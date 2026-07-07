import { describe, expect, it } from 'vitest';
import { buildDisplayItems, computeFoldGroups } from '../../src/webview/features/F03/foldDiffLines';
import type { DiffLineData } from '../../src/webview/features/F03/types';

function createLine(
  type: DiffLineData['type'],
  lineNumber: number,
): DiffLineData {
  return {
    type,
    content: `${type}-${lineNumber}`,
    oldLineNumber: type === 'added' ? null : lineNumber,
    newLineNumber: type === 'removed' ? null : lineNumber,
    tokens: [{ content: `${type}-${lineNumber}` }],
  };
}

describe('computeFoldGroups', () => {
  it('folds the middle of a long unchanged region while keeping surrounding context', () => {
    const diffLines: DiffLineData[] = [
      createLine('context', 1),
      createLine('context', 2),
      createLine('context', 3),
      createLine('removed', 4),
      createLine('added', 4),
      createLine('context', 5),
      createLine('context', 6),
      createLine('context', 7),
      createLine('context', 8),
      createLine('context', 9),
      createLine('context', 10),
      createLine('context', 11),
      createLine('added', 12),
      createLine('context', 13),
      createLine('context', 14),
      createLine('context', 15),
    ];

    expect(computeFoldGroups(diffLines)).toEqual([
      {
        id: 'fold-8-8',
        startIndex: 8,
        endIndex: 8,
        hiddenCount: 1,
      },
    ]);
  });

  it('folds file edges when unchanged context extends beyond the preserved side', () => {
    const diffLines: DiffLineData[] = [
      createLine('context', 1),
      createLine('context', 2),
      createLine('context', 3),
      createLine('context', 4),
      createLine('context', 5),
      createLine('added', 6),
      createLine('context', 7),
      createLine('context', 8),
      createLine('context', 9),
      createLine('context', 10),
      createLine('context', 11),
    ];

    expect(computeFoldGroups(diffLines)).toEqual([
      {
        id: 'fold-0-1',
        startIndex: 0,
        endIndex: 1,
        hiddenCount: 2,
      },
      {
        id: 'fold-9-10',
        startIndex: 9,
        endIndex: 10,
        hiddenCount: 2,
      },
    ]);
  });
});

describe('buildDisplayItems', () => {
  it('replaces collapsed regions with fold rows and removes the fold row after expansion', () => {
    const diffLines: DiffLineData[] = [
      createLine('context', 1),
      createLine('context', 2),
      createLine('context', 3),
      createLine('added', 4),
      createLine('context', 5),
      createLine('context', 6),
      createLine('context', 7),
      createLine('context', 8),
      createLine('context', 9),
      createLine('context', 10),
      createLine('context', 11),
      createLine('removed', 12),
      createLine('context', 13),
      createLine('context', 14),
      createLine('context', 15),
    ];
    const foldGroups = computeFoldGroups(diffLines);

    const collapsedItems = buildDisplayItems(diffLines, foldGroups, new Set());
    expect(collapsedItems.filter((item) => item.kind === 'fold')).toHaveLength(1);
    expect(collapsedItems.filter((item) => item.kind === 'line')).toHaveLength(diffLines.length - 1);

    const expandedItems = buildDisplayItems(diffLines, foldGroups, new Set([foldGroups[0].id]));
    expect(expandedItems.filter((item) => item.kind === 'fold')).toHaveLength(0);
    expect(expandedItems.filter((item) => item.kind === 'line')).toHaveLength(diffLines.length);
  });
});
