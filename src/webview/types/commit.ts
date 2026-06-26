export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export interface FilterState {
  filterDateStart: string | null;
  filterDateEnd: string | null;
  filterAuthor: string | null;
  filterKeyword: string;
}

export type FileStatus = 'A' | 'M' | 'D' | 'R';

export interface ChangedFile {
  path: string;
  oldPath?: string;
  status: FileStatus;
  hasSavedSummary: boolean;
}

export type SummaryMode = 'file' | 'commit';

export type ScreenID = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06';
