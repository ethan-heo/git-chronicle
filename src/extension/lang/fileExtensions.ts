export const JS_TS_FILE_PATTERN = /\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx)$/i;
export const PYTHON_FILE_PATTERN = /\.py$/i;
export const GO_FILE_PATTERN = /\.go$/i;
// Text-based files imported as a value from JS/TS (CSS Modules, JSON, SVG). These are never parsed
// for their own outgoing imports — they only need to exist as valid dependency edge targets.
export const ASSET_MODULE_FILE_PATTERN = /\.(?:module\.css|module\.scss|module\.sass|module\.less|json|svg)$/i;

export type SourceLanguage = 'jsTs' | 'python' | 'go';

export function detectSourceLanguage(filePath: string): SourceLanguage | null {
  if (JS_TS_FILE_PATTERN.test(filePath)) return 'jsTs';
  if (PYTHON_FILE_PATTERN.test(filePath)) return 'python';
  if (GO_FILE_PATTERN.test(filePath)) return 'go';
  return null;
}

export function isAssetModuleFile(filePath: string): boolean {
  return ASSET_MODULE_FILE_PATTERN.test(filePath);
}
