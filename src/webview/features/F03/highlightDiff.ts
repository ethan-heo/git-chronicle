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
import type { DiffLineData, HighlightToken } from './types';

type SupportedLanguage = 'css' | 'html' | 'javascript' | 'json' | 'jsx' | 'markdown' | 'mdx' | 'text' | 'tsx' | 'typescript' | 'yaml';

const EXTENSION_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
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

type TokensResult = ReturnType<HighlighterCore['codeToTokens']>;

let highlighterPromise: Promise<HighlighterCore> | null = null;

export async function highlightDiffLines(lines: DiffLineData[], filePath: string): Promise<DiffLineData[]> {
  if (lines.length === 0) {
    return lines;
  }

  const code = lines.map((line) => line.content).join('\n');

  try {
    const highlighter = await getHighlighter();
    const result = highlighter.codeToTokens(code, {
      lang: inferLanguage(filePath),
      theme: 'dark-plus',
      tokenizeMaxLineLength: 500,
    });

    return lines.map((line, index) => ({
      ...line,
      tokens: normalizeTokens(result.tokens[index], line.content),
    }));
  } catch {
    return lines;
  }
}

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    themes: [themeDarkPlus],
    langs: [
      langCss,
      langHtml,
      langJavascript,
      langJson,
      langJsx,
      langMarkdown,
      langMdx,
      langTsx,
      langTypescript,
      langYaml,
    ],
  });

  return highlighterPromise;
}

function inferLanguage(filePath: string): SupportedLanguage {
  const extension = filePath.split('.').at(-1)?.toLowerCase() ?? '';

  return EXTENSION_LANGUAGE_MAP[extension] ?? 'text';
}

function normalizeTokens(tokens: TokensResult['tokens'][number] | undefined, fallback: string): HighlightToken[] {
  if (!tokens || tokens.length === 0) {
    return [{ content: fallback }];
  }

  return tokens.map((token) => ({
    content: token.content,
    color: token.color,
  }));
}
