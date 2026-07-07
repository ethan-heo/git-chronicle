import type { DiffDisplayItem, DiffFoldGroup, DiffLineData } from './types';

export const CONTEXT_LINE_COUNT = 3;

export function computeFoldGroups(
  diffLines: DiffLineData[],
  contextLineCount: number = CONTEXT_LINE_COUNT,
): DiffFoldGroup[] {
  const groups: DiffFoldGroup[] = [];
  let index = 0;

  while (index < diffLines.length) {
    if (diffLines[index]?.type !== 'context') {
      index += 1;
      continue;
    }

    const start = index;
    while (index < diffLines.length && diffLines[index]?.type === 'context') {
      index += 1;
    }

    const end = index - 1;
    const length = end - start + 1;
    const previousLine = diffLines[start - 1] ?? null;
    const nextLine = diffLines[end + 1] ?? null;
    const keepStart = previousLine ? contextLineCount : 0;
    const keepEnd = nextLine ? contextLineCount : 0;
    const hiddenCount = length - keepStart - keepEnd;

    if (hiddenCount <= 0) {
      continue;
    }

    const foldStart = start + keepStart;
    const foldEnd = end - keepEnd;

    if (foldStart > foldEnd) {
      continue;
    }

    groups.push({
      id: `fold-${foldStart}-${foldEnd}`,
      startIndex: foldStart,
      endIndex: foldEnd,
      hiddenCount,
    });
  }

  return groups;
}

export function buildDisplayItems(
  diffLines: DiffLineData[],
  foldGroups: DiffFoldGroup[],
  expandedFoldIds: Set<string>,
): DiffDisplayItem[] {
  const displayItems: DiffDisplayItem[] = [];
  const foldGroupByStartIndex = new Map<number, DiffFoldGroup>();
  const hiddenIndexes = new Set<number>();

  for (const group of foldGroups) {
    foldGroupByStartIndex.set(group.startIndex, group);
    if (!expandedFoldIds.has(group.id)) {
      for (let index = group.startIndex; index <= group.endIndex; index += 1) {
        hiddenIndexes.add(index);
      }
    }
  }

  for (let index = 0; index < diffLines.length; index += 1) {
    const foldGroup = foldGroupByStartIndex.get(index);
    if (foldGroup && !expandedFoldIds.has(foldGroup.id)) {
      displayItems.push({
        kind: 'fold',
        group: foldGroup,
      });
    }

    if (hiddenIndexes.has(index)) {
      continue;
    }

    displayItems.push({
      kind: 'line',
      index,
      line: diffLines[index],
    });
  }

  return displayItems;
}
