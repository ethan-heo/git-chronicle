import type { StateCreator } from 'zustand';
import type { Commit } from '../../types/commit';
import type { AppState } from '../appStore';

export type WorkspaceTabPanelType = 'code' | 'aiSummary' | 'fileCanvas' | 'note';
export type PaneSplitOrientation = 'horizontal' | 'vertical';
export type DropZone = 'left' | 'right' | 'top' | 'bottom';
export type CodeInnerPanelType = 'aiSummary' | 'symbolGraph';

export interface CodeInnerPanelsState {
  aiSummary: boolean;
  symbolGraph: boolean;
}

export interface WorkspaceTab {
  id: string;
  panelType: WorkspaceTabPanelType;
  commit: Commit;
  filePath: string | null;
  codeInnerPanels?: CodeInnerPanelsState;
}

export interface PaneLeafNode {
  paneId: string;
  kind: 'leaf';
  tabs: WorkspaceTab[];
  activeTabId: string | null;
}

export interface PaneSplitNode {
  paneId: string;
  kind: 'split';
  orientation: PaneSplitOrientation;
  children: [PaneNode, PaneNode];
  sizePercent: number;
}

export type PaneNode = PaneLeafNode | PaneSplitNode;

export interface WorkspaceTabsSlice {
  paneTree: PaneNode;
  focusedPaneId: string;
  openWorkspaceTab: (input: { panelType: WorkspaceTabPanelType; commit: Commit; filePath?: string | null; paneId?: string }) => void;
  closeWorkspaceTab: (paneId: string, tabId: string) => void;
  activateWorkspaceTab: (paneId: string, tabId: string) => void;
  toggleCodeInnerPanel: (paneId: string, tabId: string, panel: CodeInnerPanelType) => void;
  focusPane: (paneId: string) => void;
  splitWorkspacePaneWithTab: (input: { sourcePaneId: string; tabId: string; targetPaneId: string; zone: DropZone }) => void;
  setPaneSplitSize: (paneId: string, sizePercent: number) => void;
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
    codeInnerPanels: input.panelType === 'code'
      ? { aiSummary: false, symbolGraph: false }
      : undefined,
  };
}

function createLeafPane(tabs: WorkspaceTab[] = [], activeTabId: string | null = null): PaneLeafNode {
  return {
    paneId: crypto.randomUUID(),
    kind: 'leaf',
    tabs,
    activeTabId,
  };
}

export function getActiveTab(node: PaneLeafNode): WorkspaceTab | null {
  return node.tabs.find((tab) => tab.id === node.activeTabId) ?? null;
}

export function findLeafPane(node: PaneNode, paneId: string): PaneLeafNode | null {
  if (node.kind === 'leaf') {
    return node.paneId === paneId ? node : null;
  }

  return findLeafPane(node.children[0], paneId) ?? findLeafPane(node.children[1], paneId);
}

function getFirstLeafPane(node: PaneNode): PaneLeafNode {
  return node.kind === 'leaf' ? node : getFirstLeafPane(node.children[0]);
}

function replacePaneNode(node: PaneNode, paneId: string, replacer: (pane: PaneLeafNode | PaneSplitNode) => PaneNode): PaneNode {
  if (node.paneId === paneId) {
    return replacer(node);
  }

  if (node.kind === 'leaf') {
    return node;
  }

  return {
    ...node,
    children: [
      replacePaneNode(node.children[0], paneId, replacer),
      replacePaneNode(node.children[1], paneId, replacer),
    ],
  };
}

function removeLeafPane(node: PaneNode, paneId: string): PaneNode | null {
  if (node.kind === 'leaf') {
    return node.paneId === paneId ? null : node;
  }

  const left = removeLeafPane(node.children[0], paneId);
  const right = removeLeafPane(node.children[1], paneId);

  if (!left && !right) {
    return null;
  }

  if (!left) {
    return right;
  }

  if (!right) {
    return left;
  }

  return {
    ...node,
    children: [left, right],
  };
}

function moveTabBetweenLeaves(root: PaneNode, sourcePaneId: string, targetPaneId: string, tabId: string, zone: DropZone): PaneNode {
  const sourcePane = findLeafPane(root, sourcePaneId);
  const targetPane = findLeafPane(root, targetPaneId);
  const movingTab = sourcePane?.tabs.find((tab) => tab.id === tabId) ?? null;

  if (!sourcePane || !targetPane || !movingTab) {
    return root;
  }

  const sourceRemainingTabs = sourcePane.tabs.filter((tab) => tab.id !== tabId);
  const sourceAfterRemoval = replacePaneNode(root, sourcePaneId, () => ({
    ...sourcePane,
    tabs: sourceRemainingTabs,
    activeTabId: sourcePane.activeTabId === tabId
      ? sourceRemainingTabs.at(sourceRemainingTabs.length - 1)?.id ?? sourceRemainingTabs[0]?.id ?? null
      : sourcePane.activeTabId,
  }));

  const nextRoot = sourceRemainingTabs.length === 0
    ? removeLeafPane(sourceAfterRemoval, sourcePaneId) ?? createLeafPane([movingTab], movingTab.id)
    : sourceAfterRemoval;

  const resolvedTargetPane = findLeafPane(nextRoot, targetPaneId);
  if (!resolvedTargetPane) {
    return nextRoot;
  }

  const newPane = createLeafPane([movingTab], movingTab.id);
  const orientation: PaneSplitOrientation = zone === 'left' || zone === 'right' ? 'horizontal' : 'vertical';
  const children: [PaneNode, PaneNode] =
    zone === 'left' || zone === 'top'
      ? [newPane, resolvedTargetPane]
      : [resolvedTargetPane, newPane];

  return replacePaneNode(nextRoot, targetPaneId, () => ({
    paneId: crypto.randomUUID(),
    kind: 'split',
    orientation,
    children,
    sizePercent: 50,
  }));
}

export const createWorkspaceTabsSlice: StateCreator<AppState, [], [], WorkspaceTabsSlice> = (set, get) => {
  const rootPane = createLeafPane();

  return {
    paneTree: rootPane,
    focusedPaneId: rootPane.paneId,

    openWorkspaceTab: ({ panelType, commit, filePath = null, paneId }) => {
      const nextTab = createWorkspaceTab({ panelType, commit, filePath });
      const state = get();
      const targetPaneId = paneId ?? state.focusedPaneId;
      const targetPane = findLeafPane(state.paneTree, targetPaneId);

      if (!targetPane) {
        return;
      }

      const existingTab = targetPane.tabs.find((tab) => tab.id === nextTab.id);
      if (existingTab) {
        get().activateWorkspaceTab(targetPaneId, existingTab.id);
        return;
      }

      set((current) => ({
        paneTree: replacePaneNode(current.paneTree, targetPaneId, (pane) => {
          if (pane.kind !== 'leaf') {
            return pane;
          }

          return {
            ...pane,
            tabs: [...pane.tabs, nextTab],
            activeTabId: nextTab.id,
          };
        }),
        focusedPaneId: targetPaneId,
        selectedCommit: commit,
      }));
    },

    closeWorkspaceTab: (paneId, tabId) => {
      const state = get();
      const pane = findLeafPane(state.paneTree, paneId);
      if (!pane) {
        return;
      }

      const remainingTabs = pane.tabs.filter((tab) => tab.id !== tabId);
      const fallbackTab = remainingTabs.at(remainingTabs.length - 1) ?? null;

      const updatedTree = replacePaneNode(state.paneTree, paneId, () => ({
        ...pane,
        tabs: remainingTabs,
        activeTabId: pane.activeTabId === tabId ? fallbackTab?.id ?? null : pane.activeTabId,
      }));

      const collapsedTree = remainingTabs.length === 0
        ? removeLeafPane(updatedTree, paneId) ?? createLeafPane()
        : updatedTree;
      const nextFocusedPane = findLeafPane(collapsedTree, state.focusedPaneId) ?? getFirstLeafPane(collapsedTree);
      const nextActiveTab = getActiveTab(nextFocusedPane);

      set({
        paneTree: collapsedTree,
        focusedPaneId: nextFocusedPane.paneId,
        selectedCommit: nextActiveTab?.commit ?? state.selectedCommit,
      });
    },

    activateWorkspaceTab: (paneId, tabId) => {
      const state = get();
      const pane = findLeafPane(state.paneTree, paneId);
      const tab = pane?.tabs.find((item) => item.id === tabId) ?? null;
      if (!pane || !tab) {
        return;
      }

      set((current) => ({
        paneTree: replacePaneNode(current.paneTree, paneId, (currentPane) => currentPane.kind === 'leaf'
          ? { ...currentPane, activeTabId: tabId }
          : currentPane),
        focusedPaneId: paneId,
        selectedCommit: tab.commit,
      }));
    },

    toggleCodeInnerPanel: (paneId, tabId, panel) => {
      set((current) => ({
        paneTree: replacePaneNode(current.paneTree, paneId, (currentPane) => {
          if (currentPane.kind !== 'leaf') {
            return currentPane;
          }

          return {
            ...currentPane,
            tabs: currentPane.tabs.map((tab) => {
              if (tab.id !== tabId || tab.panelType !== 'code') {
                return tab;
              }

              const currentPanels = tab.codeInnerPanels ?? { aiSummary: false, symbolGraph: false };
              return {
                ...tab,
                codeInnerPanels: {
                  ...currentPanels,
                  [panel]: !currentPanels[panel],
                },
              };
            }),
          };
        }),
      }));
    },

    focusPane: (paneId) => {
      const pane = findLeafPane(get().paneTree, paneId);
      if (!pane) {
        return;
      }

      const activeTab = getActiveTab(pane);
      set((state) => ({
        focusedPaneId: paneId,
        selectedCommit: activeTab ? activeTab.commit : state.selectedCommit,
      }));
    },

    splitWorkspacePaneWithTab: ({ sourcePaneId, tabId, targetPaneId, zone }) => {
      const nextTree = moveTabBetweenLeaves(get().paneTree, sourcePaneId, targetPaneId, tabId, zone);
      const nextFocusedPane = getFirstLeafPane(nextTree);
      const focusedPane = findLeafPane(nextTree, get().focusedPaneId) ?? nextFocusedPane;
      set({
        paneTree: nextTree,
        focusedPaneId: focusedPane.paneId,
      });
    },

    setPaneSplitSize: (paneId, sizePercent) => {
      set((state) => ({
        paneTree: replacePaneNode(state.paneTree, paneId, (pane) => pane.kind === 'split'
          ? { ...pane, sizePercent }
          : pane),
      }));
    },
  };
};
