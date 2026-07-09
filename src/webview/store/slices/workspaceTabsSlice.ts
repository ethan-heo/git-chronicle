import type { StateCreator } from 'zustand';
import type { ChangedFile, Commit } from '../../types/commit';
import type { AppState } from '../appStore';

export type WorkspaceTabPanelType = 'code' | 'aiSummary' | 'fileCanvas' | 'symbolGraph' | 'note';

export interface WorkspaceTab {
  id: string;
  panelType: WorkspaceTabPanelType;
  commit: Commit;
  filePath: string | null;
}

export interface PersistedWorkspaceTab {
  id: string;
  panelType: WorkspaceTabPanelType;
  commitHash: string;
  commitShortHash: string;
  commitMessage: string;
  filePath: string | null;
}

export interface WorkspaceTabsSlice {
  openTabs: WorkspaceTab[];
  activeTabId: string | null;
  openWorkspaceTab: (input: { panelType: WorkspaceTabPanelType; commit: Commit; filePath?: string | null }) => void;
  closeWorkspaceTab: (tabId: string) => void;
  activateWorkspaceTab: (tabId: string) => void;
  restoreWorkspaceTabs: (payload: { tabs: WorkspaceTab[]; activeTabId: string | null }) => void;
}

export function computeWorkspaceTabId(panelType: WorkspaceTabPanelType, commitHash: string, filePath?: string | null): string {
  return `${panelType}:${commitHash}:${filePath ?? '_'}`;
}

export function createWorkspaceTab(input: { panelType: WorkspaceTabPanelType; commit: Commit; filePath?: string | null }): WorkspaceTab {
  return {
    id: computeWorkspaceTabId(input.panelType, input.commit.hash, input.filePath),
    panelType: input.panelType,
    commit: input.commit,
    filePath: input.filePath ?? null,
  };
}

export function toPersistedWorkspaceTab(tab: WorkspaceTab): PersistedWorkspaceTab {
  return {
    id: tab.id,
    panelType: tab.panelType,
    commitHash: tab.commit.hash,
    commitShortHash: tab.commit.shortHash,
    commitMessage: tab.commit.message,
    filePath: tab.filePath,
  };
}

function findChangedFile(files: ChangedFile[], filePath: string | null): ChangedFile | null {
  if (!filePath) {
    return null;
  }

  return files.find((file) => file.path === filePath) ?? null;
}

function syncStateToTab(state: AppState, tab: WorkspaceTab): Partial<AppState> {
  const selectedFile = findChangedFile(state.changedFiles, tab.filePath);

  return {
    selectedCommit: tab.commit,
    selectedFile: tab.panelType === 'code' ? selectedFile : state.selectedFile,
    selectedFileForSymbolGraph: tab.panelType === 'symbolGraph' ? selectedFile : state.selectedFileForSymbolGraph,
  };
}

export const createWorkspaceTabsSlice: StateCreator<AppState, [], [], WorkspaceTabsSlice> = (set, get) => ({
  openTabs: [],
  activeTabId: null,

  openWorkspaceTab: ({ panelType, commit, filePath = null }) => {
    const nextTab = createWorkspaceTab({ panelType, commit, filePath });
    const state = get();
    const existingTab = state.openTabs.find((tab) => tab.id === nextTab.id);

    if (existingTab) {
      get().activateWorkspaceTab(existingTab.id);
      return;
    }

    set((current) => ({
      openTabs: [...current.openTabs, nextTab],
      activeTabId: nextTab.id,
      ...syncStateToTab(current, nextTab),
    }));
  },

  closeWorkspaceTab: (tabId) => {
    const state = get();
    const closedIndex = state.openTabs.findIndex((tab) => tab.id === tabId);

    if (closedIndex === -1) {
      return;
    }

    const remainingTabs = state.openTabs.filter((tab) => tab.id !== tabId);
    const fallbackTab = remainingTabs[closedIndex] ?? remainingTabs[closedIndex - 1] ?? null;

    set((current) => ({
      openTabs: remainingTabs,
      activeTabId: current.activeTabId === tabId ? fallbackTab?.id ?? null : current.activeTabId,
      ...(current.activeTabId === tabId && fallbackTab ? syncStateToTab(current, fallbackTab) : {}),
    }));
  },

  activateWorkspaceTab: (tabId) => {
    const state = get();
    const nextTab = state.openTabs.find((tab) => tab.id === tabId);

    if (!nextTab) {
      return;
    }

    set((current) => ({
      activeTabId: tabId,
      ...syncStateToTab(current, nextTab),
    }));
  },

  restoreWorkspaceTabs: ({ tabs, activeTabId }) => {
    set({
      openTabs: tabs,
      activeTabId,
    });
  },
});
