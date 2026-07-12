export interface AISummaryLinkEntry {
  commitHash: string;
  filePath?: string | null;
  scope: 'commit' | 'file';
  commitMessage: string;
}

export interface NoteEntry {
  relativePath: string;
  name: string;
  updatedAt: string;
  aiSummaryLink?: AISummaryLinkEntry | null;
}
