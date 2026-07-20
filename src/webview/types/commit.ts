export interface Commit {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export interface FilterState {
  filterBranch: string | null;
  filterDateStart: string | null;
  filterDateEnd: string | null;
  filterAuthor: string | null;
  filterKeyword: string;
  filterExcludeKeyword: string;
  filterGroupId: string | null;
  sortOrder: 'desc' | 'asc';
}

export interface CommitGroup {
  id: string;
  name: string;
  commitHashes: string[];
  createdAt: string;
  updatedAt: string;
}

export type FileStatus = 'A' | 'M' | 'D' | 'R';

export interface ChangedFile {
  path: string;
  oldPath?: string;
  status: FileStatus;
}

export interface Branch {
  name: string;
  scope: 'local' | 'remote';
  isCurrent: boolean;
  upstream: string | null;
  ahead: number;
  behind: number;
}

export type DependencyKind = 'import' | 'require';

export interface DependencyEdge {
  from: string;
  to: string;
  kind: DependencyKind;
}

export type SymbolKind = 'function' | 'class' | 'interface' | 'type' | 'variable' | 'constant' | 'enum';
export type ImportKind = 'named' | 'default' | 'namespace';

export type SymbolDependencyKind = 'calls' | 'uses' | 'extends' | 'implements';
export type MemberVisibility = '+' | '-' | '#';

export interface SymbolMember {
  name: string;
  visibility: MemberVisibility;
  memberKind: 'attribute' | 'operation';
  isOptional?: boolean;
  type?: string;
  params?: string;
  isStatic?: boolean;
  isAbstract?: boolean;
}

export interface SymbolNode {
  id: string;
  name: string;
  kind: SymbolKind;
  lineStart: number;
  lineEnd: number;
  isExported: boolean;
  nodeCategory: 'local' | 'import';
  modulePath?: string;
  importKind?: ImportKind;
  signature?: string;
  typeAnnotation?: string;
  members?: SymbolMember[];
  enumValues?: string[];
}

export interface SymbolEdge {
  from: string;
  to: string;
  kind: SymbolDependencyKind;
}

export type AIProviderName = 'claude' | 'gemini' | 'codex';

export interface AIUsageInfo {
  inputTokens: number;
  outputTokens: number;
  costUsd: number | null;
}

export type AIProviderButtonState = 'unregistered' | 'registering' | 'active' | 'inactive' | 'error';

export interface AIProvider {
  name: AIProviderName;
  label: string;
  cli: string;
  installUrl: string;
  brandColor: string;
}

export type ScreenID = 'S02';

export type RouteTransitionDirection = 'forward' | 'back';
