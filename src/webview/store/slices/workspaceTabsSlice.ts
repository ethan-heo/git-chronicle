import type { StateCreator } from 'zustand';
import type { Commit } from '../../types/commit';
import type { AppState } from '../appStore';

export type WorkspaceTabPanelType = 'code' | 'aiSummary' | 'fileCanvas' | 'note' | 'pr' | 'issue';
export type PaneSplitOrientation = 'horizontal' | 'vertical';
export type DropZone = 'left' | 'right' | 'top' | 'bottom' | 'center';
export type CodeInnerPanelType = 'aiSummary' | 'symbolGraph';

export interface CodeInnerPanelsState {
  aiSummary: boolean;
  symbolGraph: boolean;
}

export interface WorkspaceTab {
  id: string;
  panelType: WorkspaceTabPanelType;
  // 'note'/'pr'/'issue' 탭은 커밋과 무관하므로 commit이 없다. 나머지 panelType은 항상 non-null이다.
  commit: Commit | null;
  filePath: string | null;
  relativePath?: string | null;
  codeInnerPanels?: CodeInnerPanelsState;
  prNumber?: number | null;
  issueNumber?: number | null;
  // pr/issue 탭 전용 라벨. 상세 데이터 로드 전에도 탭바에 제목을 즉시 보여주기 위해 목록 클릭 시점에 캐시한다.
  title?: string | null;
}

export type OpenWorkspaceTabInput =
  | { panelType: 'code' | 'aiSummary' | 'fileCanvas'; commit: Commit; filePath?: string | null; paneId?: string }
  | { panelType: 'note'; relativePath: string; paneId?: string }
  | { panelType: 'pr'; prNumber: number; title?: string | null; paneId?: string }
  | { panelType: 'issue'; issueNumber: number; title?: string | null; paneId?: string };

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
  openWorkspaceTab: (input: OpenWorkspaceTabInput) => void;
  closeWorkspaceTab: (paneId: string, tabId: string) => void;
  activateWorkspaceTab: (paneId: string, tabId: string) => void;
  toggleCodeInnerPanel: (paneId: string, tabId: string, panel: CodeInnerPanelType) => void;
  focusPane: (paneId: string) => void;
  moveWorkspaceTab: (input: { sourcePaneId: string; tabId: string; targetPaneId: string; zone: DropZone }) => void;
  setPaneSplitSize: (paneId: string, sizePercent: number) => void;
  renameNoteTabs: (fromRelativePath: string, toRelativePath: string) => void;
  closeNoteTabs: (relativePath: string) => void;
}

export function computeWorkspaceTabId(panelType: WorkspaceTabPanelType, commitHash: string, filePath?: string | null): string {
  return `${panelType}:${commitHash}:${filePath ?? '_'}`;
}

export function computeGithubWorkspaceTabId(panelType: 'pr' | 'issue', number: number): string {
  return `${panelType}:${number}`;
}

export function computeNoteWorkspaceTabId(relativePath: string): string {
  return `note:${relativePath}`;
}

function getNoteTabTitle(relativePath: string): string {
  return relativePath.split('/').at(-1) ?? relativePath;
}

export function createWorkspaceTab(input: OpenWorkspaceTabInput): WorkspaceTab {
  if (input.panelType === 'note') {
    return {
      id: computeNoteWorkspaceTabId(input.relativePath),
      panelType: 'note',
      commit: null,
      filePath: null,
      relativePath: input.relativePath,
      prNumber: null,
      issueNumber: null,
      title: getNoteTabTitle(input.relativePath),
    };
  }

  if (input.panelType === 'pr') {
    return {
      id: computeGithubWorkspaceTabId('pr', input.prNumber),
      panelType: 'pr',
      commit: null,
      filePath: null,
      relativePath: null,
      prNumber: input.prNumber,
      issueNumber: null,
      title: input.title ?? null,
    };
  }

  if (input.panelType === 'issue') {
    return {
      id: computeGithubWorkspaceTabId('issue', input.issueNumber),
      panelType: 'issue',
      commit: null,
      filePath: null,
      relativePath: null,
      prNumber: null,
      issueNumber: input.issueNumber,
      title: input.title ?? null,
    };
  }

  return {
    id: computeWorkspaceTabId(input.panelType, input.commit.hash, input.filePath),
    panelType: input.panelType,
    commit: input.commit,
    filePath: input.filePath ?? null,
    relativePath: null,
    codeInnerPanels: input.panelType === 'code'
      ? { aiSummary: false, symbolGraph: false }
      : undefined,
    prNumber: null,
    issueNumber: null,
    title: null,
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

function removeTabFromLeaf(root: PaneNode, paneId: string, tabId: string): { nextRoot: PaneNode; removedTab: WorkspaceTab | null } {
  const pane = findLeafPane(root, paneId);
  const removedTab = pane?.tabs.find((tab) => tab.id === tabId) ?? null;

  if (!pane || !removedTab) {
    return { nextRoot: root, removedTab: null };
  }

  const remainingTabs = pane.tabs.filter((tab) => tab.id !== tabId);
  const paneAfterRemoval = replacePaneNode(root, paneId, () => ({
    ...pane,
    tabs: remainingTabs,
    activeTabId: pane.activeTabId === tabId
      ? remainingTabs.at(remainingTabs.length - 1)?.id ?? remainingTabs[0]?.id ?? null
      : pane.activeTabId,
  }));

  return {
    nextRoot: remainingTabs.length === 0
      ? removeLeafPane(paneAfterRemoval, paneId) ?? createLeafPane()
      : paneAfterRemoval,
    removedTab,
  };
}

function moveTabBetweenLeaves(root: PaneNode, sourcePaneId: string, targetPaneId: string, tabId: string, zone: Exclude<DropZone, 'center'>): PaneNode {
  const sourcePane = findLeafPane(root, sourcePaneId);
  const targetPane = findLeafPane(root, targetPaneId);
  const movingTab = sourcePane?.tabs.find((tab) => tab.id === tabId) ?? null;

  if (!sourcePane || !targetPane || !movingTab) {
    return root;
  }

  const { nextRoot } = removeTabFromLeaf(root, sourcePaneId, tabId);

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

function mergeTabIntoLeaf(root: PaneNode, sourcePaneId: string, targetPaneId: string, tabId: string): PaneNode {
  if (sourcePaneId === targetPaneId) {
    return root;
  }

  const { nextRoot, removedTab } = removeTabFromLeaf(root, sourcePaneId, tabId);
  if (!removedTab) {
    return root;
  }

  const targetPane = findLeafPane(nextRoot, targetPaneId);
  if (!targetPane) {
    return nextRoot;
  }

  return replacePaneNode(nextRoot, targetPaneId, (pane) => {
    if (pane.kind !== 'leaf') {
      return pane;
    }

    const existingTab = pane.tabs.find((tab) => tab.id === removedTab.id);
    if (existingTab) {
      return {
        ...pane,
        activeTabId: existingTab.id,
      };
    }

    return {
      ...pane,
      tabs: [...pane.tabs, removedTab],
      activeTabId: removedTab.id,
    };
  });
}

export const createWorkspaceTabsSlice: StateCreator<AppState, [], [], WorkspaceTabsSlice> = (set, get) => {
  const rootPane = createLeafPane();

  return {
    paneTree: rootPane,
    focusedPaneId: rootPane.paneId,

    openWorkspaceTab: (input) => {
      const nextTab = createWorkspaceTab(input);
      const state = get();
      const targetPaneId = input.paneId ?? state.focusedPaneId;
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
        // note/pr/issue 탭은 commit이 없으므로 마지막 selectedCommit을 그대로 유지한다.
        selectedCommit: nextTab.commit ?? current.selectedCommit,
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
        // note/pr/issue 탭은 commit이 없으므로 마지막 selectedCommit을 그대로 유지한다.
        selectedCommit: tab.commit ?? current.selectedCommit,
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
        // note/pr/issue 탭은 commit이 없으므로 마지막 selectedCommit을 그대로 유지한다.
        selectedCommit: activeTab?.commit ?? state.selectedCommit,
      }));
    },

    moveWorkspaceTab: ({ sourcePaneId, tabId, targetPaneId, zone }) => {
      const state = get();
      const movingTab = findLeafPane(state.paneTree, sourcePaneId)?.tabs.find((tab) => tab.id === tabId) ?? null;
      const nextTree = zone === 'center'
        ? mergeTabIntoLeaf(state.paneTree, sourcePaneId, targetPaneId, tabId)
        : moveTabBetweenLeaves(state.paneTree, sourcePaneId, targetPaneId, tabId, zone);

      if (zone === 'center') {
        set((current) => ({
          paneTree: nextTree,
          focusedPaneId: targetPaneId,
          selectedCommit: movingTab?.commit ?? current.selectedCommit,
        }));
        return;
      }

      const nextFocusedPane = getFirstLeafPane(nextTree);
      const focusedPane = findLeafPane(nextTree, state.focusedPaneId) ?? nextFocusedPane;
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

    renameNoteTabs: (fromRelativePath, toRelativePath) => {
      set((state) => ({
        paneTree: mapLeafPanes(state.paneTree, (pane) => ({
          ...pane,
          tabs: pane.tabs.map((tab) => tab.panelType === 'note' && tab.relativePath === fromRelativePath
            ? {
              ...tab,
              id: computeNoteWorkspaceTabId(toRelativePath),
              relativePath: toRelativePath,
              title: getNoteTabTitle(toRelativePath),
            }
            : tab),
          activeTabId: pane.activeTabId === computeNoteWorkspaceTabId(fromRelativePath)
            ? computeNoteWorkspaceTabId(toRelativePath)
            : pane.activeTabId,
        })),
      }));
    },

    closeNoteTabs: (relativePath) => {
      set((state) => ({
        paneTree: removeNoteTabsFromTree(state.paneTree, relativePath),
      }));
    },
  };
};

function mapLeafPanes(node: PaneNode, mapper: (pane: PaneLeafNode) => PaneLeafNode): PaneNode {
  if (node.kind === 'leaf') {
    return mapper(node);
  }

  return {
    ...node,
    children: [mapLeafPanes(node.children[0], mapper), mapLeafPanes(node.children[1], mapper)],
  };
}

function removeNoteTabsFromTree(node: PaneNode, relativePath: string): PaneNode {
  return mapLeafPanes(node, (pane) => {
    const nextTabs = pane.tabs.filter((tab) => !(tab.panelType === 'note' && tab.relativePath === relativePath));
    const nextActiveTabId = nextTabs.some((tab) => tab.id === pane.activeTabId)
      ? pane.activeTabId
      : nextTabs.at(-1)?.id ?? null;

    return {
      ...pane,
      tabs: nextTabs,
      activeTabId: nextActiveTabId,
    };
  });
}
