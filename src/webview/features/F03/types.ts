export type DiffLineType = 'added' | 'removed' | 'context';

export interface HighlightToken {
  content: string;
  color?: string;
}

export interface DiffLineData {
  type: DiffLineType;
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
  tokens: HighlightToken[];
}

export interface FileDiffPayload {
  rawDiff: string;
  isBinary: boolean;
  isDeleted: boolean;
}
