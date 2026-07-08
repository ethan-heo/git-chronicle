export const JS_TS_FILE_PATTERN = /\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx)$/i;
export const PYTHON_FILE_PATTERN = /\.py$/i;
export const GO_FILE_PATTERN = /\.go$/i;

export type SourceLanguage = 'jsTs' | 'python' | 'go';

export function detectSourceLanguage(filePath: string): SourceLanguage | null {
  if (JS_TS_FILE_PATTERN.test(filePath)) return 'jsTs';
  if (PYTHON_FILE_PATTERN.test(filePath)) return 'python';
  if (GO_FILE_PATTERN.test(filePath)) return 'go';
  return null;
}
