import { getMarkdownHighlighter, inferLanguageFromPath } from '../../shared/highlighter';
import type { DiffLineData, HighlightToken } from './types';

export async function highlightDiffLines(lines: DiffLineData[], filePath: string): Promise<DiffLineData[]> {
  if (lines.length === 0) {
    return lines;
  }

  const code = lines.map((line) => line.content).join('\n');

  try {
    const highlighter = await getMarkdownHighlighter();
    const result = highlighter.codeToTokens(code, {
      lang: inferLanguageFromPath(filePath),
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

function normalizeTokens(tokens: Array<{ content: string; color?: string }> | undefined, fallback: string): HighlightToken[] {
  if (!tokens || tokens.length === 0) {
    return [{ content: fallback }];
  }

  return tokens.map((token) => ({
    content: token.content,
    color: token.color,
  }));
}
