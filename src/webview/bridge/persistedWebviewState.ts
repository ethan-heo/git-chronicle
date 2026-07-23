import type { FilterState } from '../types/commit';
import { getWebviewState, setWebviewState } from './vscodeApi';
import type { PaneNode } from '../store/slices/workspaceTabsSlice';

export interface PersistedWorkspaceSidebarState {
  isBranchesSectionExpanded?: boolean;
  isCommitListSectionExpanded: boolean;
  isFileTreeSectionExpanded: boolean;
  branchesSectionHeight?: number;
  commitListSectionHeight: number;
  fileTreeSectionHeight: number;
  isNotesSectionExpanded?: boolean;
  notesSectionHeight?: number;
  sidebarWidth: number;
  lastSidebarWidth: number;
}

export interface PersistedWebviewState {
  filter?: Partial<FilterState>;
  workspaceSidebar?: PersistedWorkspaceSidebarState;
  workspaceTabs?: PersistedWorkspaceTabsState;
}

export interface PersistedWorkspaceTabsState {
  paneTree: PaneNode;
  focusedPaneId: string;
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
