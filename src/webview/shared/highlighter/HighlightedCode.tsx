import { useEffect, useMemo, useState, type FC } from 'react';
import { getMarkdownHighlighter, resolveLanguageTag } from './shikiHighlighter';
import type { HighlightToken } from './types';

interface HighlightedCodeProps {
  cacheKey: string;
  className?: string;
  code: string;
  language?: string;
}

const highlightedCodeCache = new Map<string, HighlightToken[][]>();

export const HighlightedCode: FC<HighlightedCodeProps> = ({ cacheKey, className, code, language }) => {
  const supportedLanguage = resolveLanguageTag(language);
  const codeLines = useMemo(() => code.split('\n'), [code]);
  const [tokensByLine, setTokensByLine] = useState<HighlightToken[][] | null>(() => highlightedCodeCache.get(cacheKey) ?? null);

  useEffect(() => {
    let cancelled = false;

    if (!supportedLanguage || supportedLanguage === 'text') {
      setTokensByLine(null);
      return () => {
        cancelled = true;
      };
    }

    const cachedTokens = highlightedCodeCache.get(cacheKey);
    if (cachedTokens) {
      setTokensByLine(cachedTokens);
      return () => {
        cancelled = true;
      };
    }

    void getMarkdownHighlighter()
      .then((highlighter) =>
        highlighter.codeToTokens(code, {
          lang: supportedLanguage,
          theme: 'dark-plus',
          tokenizeMaxLineLength: 500,
        }),
      )
      .then((result) => {
        if (cancelled) {
          return;
        }

        const normalized = result.tokens.map((lineTokens, index) => normalizeTokens(lineTokens, codeLines[index] ?? ''));
        highlightedCodeCache.set(cacheKey, normalized);
        setTokensByLine(normalized);
      })
      .catch(() => {
        if (!cancelled) {
          setTokensByLine(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, code, codeLines, supportedLanguage]);

  if (!tokensByLine) {
    return <code className={className}>{code}</code>;
  }

  return (
    <code className={className}>
      <span className="sr-only">{code}</span>
      {tokensByLine.map((lineTokens, lineIndex) => (
        <span key={`${cacheKey}-${lineIndex}`} aria-hidden="true">
          {lineTokens.map((token, tokenIndex) => (
            <span key={`${cacheKey}-${lineIndex}-${tokenIndex}`} style={token.color ? { color: token.color } : undefined}>
              {token.content || ' '}
            </span>
          ))}
          {lineIndex < tokensByLine.length - 1 ? '\n' : null}
        </span>
      ))}
    </code>
  );
};

function normalizeTokens(tokens: Array<{ content: string; color?: string }> | undefined, fallback: string): HighlightToken[] {
  if (!tokens || tokens.length === 0) {
    return [{ content: fallback }];
  }

  return tokens.map((token) => ({
    content: token.content,
    color: token.color,
  }));
}
