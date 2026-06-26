import type { DiffLineData, DiffLineType } from './types';

const HUNK_HEADER_PATTERN = /^@@ -(?<oldStart>\d+)(?:,\d+)? \+(?<newStart>\d+)(?:,\d+)? @@/;

export function parseDiff(rawDiff: string): DiffLineData[] {
  const lines = rawDiff.split('\n');
  const parsedLines: DiffLineData[] = [];
  let oldLineNumber = 1;
  let newLineNumber = 1;
  let hasHunk = false;

  for (const line of lines) {
    const hunkMatch = line.match(HUNK_HEADER_PATTERN);

    if (hunkMatch?.groups) {
      oldLineNumber = Number(hunkMatch.groups.oldStart);
      newLineNumber = Number(hunkMatch.groups.newStart);
      hasHunk = true;
      continue;
    }

    if (shouldSkipMetadataLine(line)) {
      continue;
    }

    if (!hasHunk) {
      parsedLines.push(createDiffLine('context', line, null, newLineNumber));
      newLineNumber += 1;
      continue;
    }

    if (line.startsWith('+')) {
      parsedLines.push(createDiffLine('added', line.slice(1), null, newLineNumber));
      newLineNumber += 1;
      continue;
    }

    if (line.startsWith('-')) {
      parsedLines.push(createDiffLine('removed', line.slice(1), oldLineNumber, null));
      oldLineNumber += 1;
      continue;
    }

    const content = line.startsWith(' ') ? line.slice(1) : line;
    parsedLines.push(createDiffLine('context', content, oldLineNumber, newLineNumber));
    oldLineNumber += 1;
    newLineNumber += 1;
  }

  return trimTrailingEmptyLine(parsedLines);
}

function createDiffLine(
  type: DiffLineType,
  content: string,
  oldLineNumber: number | null,
  newLineNumber: number | null,
): DiffLineData {
  return {
    type,
    content,
    oldLineNumber,
    newLineNumber,
    tokens: [{ content }],
  };
}

function shouldSkipMetadataLine(line: string): boolean {
  return (
    line.startsWith('diff --git ') ||
    line.startsWith('index ') ||
    line.startsWith('new file mode ') ||
    line.startsWith('deleted file mode ') ||
    line.startsWith('similarity index ') ||
    line.startsWith('rename from ') ||
    line.startsWith('rename to ') ||
    line.startsWith('--- ') ||
    line.startsWith('+++ ')
  );
}

function trimTrailingEmptyLine(lines: DiffLineData[]): DiffLineData[] {
  if (lines.at(-1)?.content !== '') {
    return lines;
  }

  return lines.slice(0, -1);
}
