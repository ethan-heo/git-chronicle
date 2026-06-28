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
  filterExcludeKeyword: string;
  sortOrder: 'desc' | 'asc';
}

export type FileStatus = 'A' | 'M' | 'D' | 'R';

export interface ChangedFile {
  path: string;
  oldPath?: string;
  status: FileStatus;
  hasSavedSummary: boolean;
}

export type DependencyKind = 'import' | 'require';

export interface DependencyEdge {
  from: string;
  to: string;
  kind: DependencyKind;
}

export type SymbolKind = 'function' | 'class' | 'interface' | 'type' | 'variable' | 'constant' | 'enum';

export type SymbolDependencyKind = 'calls' | 'uses' | 'extends' | 'implements';

export interface SymbolNode {
  id: string;
  name: string;
  kind: SymbolKind;
  lineStart: number;
  lineEnd: number;
  isExported: boolean;
}

export interface SymbolEdge {
  from: string;
  to: string;
  kind: SymbolDependencyKind;
}

export type SummaryMode = 'file' | 'commit';

export type AIProviderName = 'claude' | 'gemini' | 'codex';

export type AIProviderButtonState = 'unregistered' | 'registering' | 'active' | 'inactive' | 'error';

export interface AIProvider {
  name: AIProviderName;
  label: string;
  cli: string;
  installUrl: string;
  brandColor: string;
}

export type ScreenID = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07' | 'S08';

export type RouteTransitionDirection = 'forward' | 'back';
