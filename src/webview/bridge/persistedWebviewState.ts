import type { FilterState } from '../types/commit';
import { getWebviewState, setWebviewState } from './vscodeApi';

export interface PersistedWorkspaceSidebarState {
  isCommitListSectionExpanded: boolean;
  isFileTreeSectionExpanded: boolean;
  commitListSectionHeight: number;
  fileTreeSectionHeight: number;
  isPRsSectionExpanded: boolean;
  prsSectionHeight: number;
  isIssuesSectionExpanded: boolean;
  issuesSectionHeight: number;
  sidebarWidth: number;
  lastSidebarWidth: number;
}

export interface PersistedWebviewState {
  filter?: Partial<FilterState>;
  workspaceSidebar?: PersistedWorkspaceSidebarState;
}

export function readPersistedWebviewState(): PersistedWebviewState {
  return getWebviewState<PersistedWebviewState>() ?? {};
}

export function mergePersistedWebviewState(partialState: Partial<PersistedWebviewState>): void {
  setWebviewState<PersistedWebviewState>({
    ...readPersistedWebviewState(),
    ...partialState,
  });
}
