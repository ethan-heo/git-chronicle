const OVERSIZED_DIFF_LINE_LIMIT = 500;

const LOCKFILE_NAMES = new Set([
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'npm-shrinkwrap.json',
  'Cargo.lock',
  'Gemfile.lock',
  'composer.lock',
  'poetry.lock',
  'Pipfile.lock',
]);

const BUILD_ARTIFACT_SEGMENTS = new Set(['dist', 'build', 'out', '.next', 'coverage']);
const GENERATED_FILE_SUFFIXES = ['.min.js', '.min.css', '.map', '.snap'];

type OmitReason = 'lockfile' | 'build-artifact' | 'generated' | 'oversized';

export function filterDiffForSummary(diff: string): string {
  const lines = diff.split('\n');
  const firstDiffIndex = lines.findIndex((line) => line.startsWith('diff --git '));

  if (firstDiffIndex === -1) {
    return diff;
  }

  const preamble = lines.slice(0, firstDiffIndex);
  const blocks: string[][] = [];
  let currentBlock: string[] = [];

  for (const line of lines.slice(firstDiffIndex)) {
    if (line.startsWith('diff --git ') && currentBlock.length > 0) {
      blocks.push(currentBlock);
      currentBlock = [];
    }

    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  const filteredBlocks = blocks.map(filterBlockLines);
  return [...preamble, ...filteredBlocks.flat()].join('\n');
}

function filterBlockLines(blockLines: string[]): string[] {
  const filePath = getBlockFilePath(blockLines[0]);
  const omitReason = getOmitReason(filePath, blockLines.length);

  if (!omitReason) {
    return blockLines;
  }

  return [blockLines[0], `[diff omitted: ${omitReason}]`];
}

function getBlockFilePath(headerLine: string): string {
  const match = /^diff --git a\/(.+?) b\/(.+)$/.exec(headerLine);
  if (!match) {
    return '';
  }

  return normalizeGitPath(match[2]);
}

function normalizeGitPath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function getOmitReason(filePath: string, blockLineCount: number): OmitReason | null {
  if (!filePath) {
    return blockLineCount > OVERSIZED_DIFF_LINE_LIMIT ? 'oversized' : null;
  }

  const segments = filePath.split('/');
  const fileName = segments.at(-1) ?? filePath;

  if (LOCKFILE_NAMES.has(fileName)) {
    return 'lockfile';
  }

  if (segments.some((segment) => BUILD_ARTIFACT_SEGMENTS.has(segment))) {
    return 'build-artifact';
  }

  if (GENERATED_FILE_SUFFIXES.some((suffix) => filePath.endsWith(suffix))) {
    return 'generated';
  }

  return blockLineCount > OVERSIZED_DIFF_LINE_LIMIT ? 'oversized' : null;
}
