import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import langCss from 'shiki/langs/css.mjs';
import langHtml from 'shiki/langs/html.mjs';
import langJavascript from 'shiki/langs/javascript.mjs';
import langJson from 'shiki/langs/json.mjs';
import langJsx from 'shiki/langs/jsx.mjs';
import langMarkdown from 'shiki/langs/markdown.mjs';
import langMdx from 'shiki/langs/mdx.mjs';
import langTsx from 'shiki/langs/tsx.mjs';
import langTypescript from 'shiki/langs/typescript.mjs';
import langYaml from 'shiki/langs/yaml.mjs';
import themeDarkPlus from 'shiki/themes/dark-plus.mjs';
import './SymbolFileCodeViewer.css';

export interface LineRange {
  start: number;
  end: number;
}

interface SymbolFileCodeViewerProps {
  fileContent: string;
  language: string;
  highlightRange: LineRange | null;
  scrollToRange: LineRange | null;
  scrollRequestId: number;
}

type TokensResult = ReturnType<HighlighterCore['codeToTokens']>;

let highlighterPromise: Promise<HighlighterCore> | null = null;

export const SymbolFileCodeViewer: FC<SymbolFileCodeViewerProps> = ({ fileContent, language, highlightRange, scrollToRange, scrollRequestId }) => {
  const { t } = useTranslation();
  const lineRefs = useRef<Array<HTMLDivElement | null>>([]);
  const viewerRef = useRef<HTMLElement | null>(null);
  const lines = useMemo(() => fileContent.split('\n'), [fileContent]);
  const [tokensByLine, setTokensByLine] = useState<TokensResult['tokens']>([]);

  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, lines.length);
  }, [lines.length]);

  useEffect(() => {
    let cancelled = false;

    if (!fileContent) {
      setTokensByLine([]);
      return () => {
        cancelled = true;
      };
    }

    void getHighlighter()
      .then((highlighter) =>
        highlighter.codeToTokens(fileContent, {
          lang: inferLanguage(language),
          theme: 'dark-plus',
          tokenizeMaxLineLength: 500,
        }),
      )
      .then((result) => {
        if (!cancelled) {
          setTokensByLine(result.tokens);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTokensByLine([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fileContent, language]);

  useLayoutEffect(() => {
    if (!scrollToRange) {
      return;
    }

    const targetLine = lineRefs.current[Math.max(0, scrollToRange.start - 1)];
    const viewer = viewerRef.current;

    if (!targetLine || !viewer) {
      return;
    }

    const viewerRect = viewer.getBoundingClientRect();
    const targetRect = targetLine.getBoundingClientRect();
    const nextTop = viewer.scrollTop + (targetRect.top - viewerRect.top) - viewerRect.height / 2 + targetRect.height / 2;
    viewer.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
  }, [scrollRequestId, scrollToRange]);

  return (
    <section ref={viewerRef} className="flex-1 min-h-0 overflow-auto py-md font-mono text-sm" aria-label={t('symbol_graph.code_viewer_aria')} tabIndex={0}>
      <div className="min-w-full w-max">
        {lines.map((line, index) => {
          const lineNumber = index + 1;
          const isHighlighted = highlightRange ? lineNumber >= highlightRange.start && lineNumber <= highlightRange.end : false;
          const tokens = tokensByLine[index] ?? [{ content: line }];

          return (
            <div
              key={`${lineNumber}-${line}`}
              ref={(element) => {
                lineRefs.current[index] = element;
              }}
              className={['symbol-code-line relative z-0 grid min-w-full w-max grid-cols-[72px_minmax(0,1fr)] gap-5 px-xl leading-[1.75]', isHighlighted ? 'symbol-code-line-highlighted' : ''].filter(Boolean).join(' ')}
            >
              <span className="pr-2 text-right text-muted select-none">{lineNumber}</span>
              <span className="block min-w-0 w-max whitespace-pre pl-2">
                {tokens.map((token, tokenIndex) => (
                  <span key={`${lineNumber}-${tokenIndex}`} style={token.color ? { color: token.color } : undefined}>
                    {token.content || ' '}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    themes: [themeDarkPlus],
    langs: [langCss, langHtml, langJavascript, langJson, langJsx, langMarkdown, langMdx, langTsx, langTypescript, langYaml],
  });

  return highlighterPromise;
}

function inferLanguage(filePath: string): 'css' | 'html' | 'javascript' | 'json' | 'jsx' | 'markdown' | 'mdx' | 'text' | 'tsx' | 'typescript' | 'yaml' {
  const extension = filePath.split('.').at(-1)?.toLowerCase() ?? '';
  const map: Record<string, 'css' | 'html' | 'javascript' | 'json' | 'jsx' | 'markdown' | 'mdx' | 'text' | 'tsx' | 'typescript' | 'yaml'> = {
    cjs: 'javascript',
    css: 'css',
    html: 'html',
    js: 'javascript',
    json: 'json',
    jsx: 'jsx',
    md: 'markdown',
    mdx: 'mdx',
    mjs: 'javascript',
    ts: 'typescript',
    tsx: 'tsx',
    yaml: 'yaml',
    yml: 'yaml',
  };

  return map[extension] ?? 'text';
}
