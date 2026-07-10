import type { HighlightToken } from '../../shared/highlighter';

export type { HighlightToken };
export interface LineRange {
  start: number;
  end: number;
}

export type DiffLineType = 'added' | 'removed' | 'context';

export interface DiffLineData {
  type: DiffLineType;
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  tokens: HighlightToken[];
}

export interface DiffFoldGroup {
  id: string;
  startIndex: number;
  endIndex: number;
  hiddenCount: number;
}

export interface DiffLineItem {
  kind: 'line';
  index: number;
  line: DiffLineData;
}

export type DiffDisplayItem =
  | DiffLineItem
  | {
      kind: 'fold';
      group: DiffFoldGroup;
    };

export interface FileDiffPayload {
  rawDiff: string;
  isBinary: boolean;
  isDeleted: boolean;
}
