import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import langBash from 'shiki/langs/bash.mjs';
import langCss from 'shiki/langs/css.mjs';
import langDiff from 'shiki/langs/diff.mjs';
import langHtml from 'shiki/langs/html.mjs';
import langJavascript from 'shiki/langs/javascript.mjs';
import langJson from 'shiki/langs/json.mjs';
import langJsx from 'shiki/langs/jsx.mjs';
import langMarkdown from 'shiki/langs/markdown.mjs';
import langMdx from 'shiki/langs/mdx.mjs';
import langPython from 'shiki/langs/python.mjs';
import langSql from 'shiki/langs/sql.mjs';
import langTsx from 'shiki/langs/tsx.mjs';
import langTypescript from 'shiki/langs/typescript.mjs';
import langYaml from 'shiki/langs/yaml.mjs';
import themeDarkPlus from 'shiki/themes/dark-plus.mjs';

export type SupportedLanguage =
  | 'bash'
  | 'css'
  | 'diff'
  | 'html'
  | 'javascript'
  | 'json'
  | 'jsx'
  | 'markdown'
  | 'mdx'
  | 'python'
  | 'sql'
  | 'text'
  | 'tsx'
  | 'typescript'
  | 'yaml';

const EXTENSION_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  bash: 'bash',
  cjs: 'javascript',
  css: 'css',
  diff: 'diff',
  html: 'html',
  js: 'javascript',
  json: 'json',
  jsx: 'jsx',
  md: 'markdown',
  mdx: 'mdx',
  mjs: 'javascript',
  patch: 'diff',
  py: 'python',
  sh: 'bash',
  sql: 'sql',
  ts: 'typescript',
  tsx: 'tsx',
  yaml: 'yaml',
  yml: 'yaml',
  zsh: 'bash',
};

const LANGUAGE_TAG_MAP: Record<string, SupportedLanguage> = {
  ...EXTENSION_LANGUAGE_MAP,
  javascriptreact: 'jsx',
  plaintext: 'text',
  shell: 'bash',
  text: 'text',
  ts: 'typescript',
  txt: 'text',
  typescriptreact: 'tsx',
  js: 'javascript',
};

let highlighterPromise: Promise<HighlighterCore> | null = null;

export function getMarkdownHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    themes: [themeDarkPlus],
    langs: [
      langBash,
      langCss,
      langDiff,
      langHtml,
      langJavascript,
      langJson,
      langJsx,
      langMarkdown,
      langMdx,
      langPython,
      langSql,
      langTsx,
      langTypescript,
      langYaml,
    ],
  });

  return highlighterPromise;
}

export function inferLanguageFromPath(filePath: string): SupportedLanguage {
  const extension = filePath.split('.').at(-1)?.toLowerCase() ?? '';

  return EXTENSION_LANGUAGE_MAP[extension] ?? 'text';
}

export function resolveLanguageTag(language: string | undefined): SupportedLanguage | null {
  if (!language) {
    return null;
  }

  return LANGUAGE_TAG_MAP[language.toLowerCase()] ?? null;
}
