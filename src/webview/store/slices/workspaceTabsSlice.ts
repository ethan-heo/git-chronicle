import type { StateCreator } from 'zustand';
import type { Commit } from '../../types/commit';
import type { NoteEntry } from '../../types/note';
import type { AppState } from '../appStore';

export type WorkspaceTabPanelType = 'code' | 'aiSummary' | 'fileCanvas' | 'note';
export type PaneSplitOrientation = 'horizontal' | 'vertical';
export type DropZone = 'left' | 'right' | 'top' | 'bottom' | 'center';
export type CodeInnerPanelKind = 'diff' | 'aiSummary' | 'symbolGraph';

export interface CodeInnerLeafNode {
  kind: 'leaf';
  panel: CodeInnerPanelKind;
}

export interface CodeInnerSplitNode {
  nodeId: string;
  kind: 'split';
  orientation: PaneSplitOrientation;
  children: [CodeInnerPaneNode, CodeInnerPaneNode];
  sizePercent: number;
}

export type CodeInnerPaneNode = CodeInnerLeafNode | CodeInnerSplitNode;

export interface WorkspaceTab {
  id: string;
  panelType: WorkspaceTabPanelType;
  // 'note' 탭은 커밋과 무관하므로 commit이 없다. 나머지 panelType은 항상 non-null이다.
  commit: Commit | null;
  filePath: string | null;
  relativePath?: string | null;
  codeInnerPaneTree?: CodeInnerPaneNode;
  title?: string | null;
}

export type OpenWorkspaceTabInput =
  | { panelType: 'code' | 'aiSummary' | 'fileCanvas'; commit: Commit; filePath?: string | null; paneId?: string }
  | { panelType: 'note'; relativePath: string; paneId?: string };

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
  openNoteTreeEntry: (relativePath: string) => void;
  closeWorkspaceTab: (paneId: string, tabId: string) => void;
  activateWorkspaceTab: (paneId: string, tabId: string) => void;
  activateAdjacentWorkspaceTab: (paneId: string, direction: 'next' | 'prev') => void;
  toggleCodeInnerPanel: (paneId: string, tabId: string, panel: Exclude<CodeInnerPanelKind, 'diff'>) => void;
  moveCodeInnerPanel: (input: {
    paneId: string;
    tabId: string;
    sourcePanel: CodeInnerPanelKind;
    targetPanel: CodeInnerPanelKind;
    zone: Exclude<DropZone, 'center'>;
  }) => void;
  resizeCodeInnerSplit: (paneId: string, tabId: string, nodeId: string, sizePercent: number) => void;
  focusPane: (paneId: string) => void;
  moveWorkspaceTab: (input: { sourcePaneId: string; tabId: string; targetPaneId: string; zone: DropZone }) => void;
  setPaneSplitSize: (paneId: string, sizePercent: number) => void;
  renameNoteTabs: (fromRelativePath: string, toRelativePath: string) => void;
  closeNoteTabs: (relativePath: string) => void;
}

export function computeWorkspaceTabId(panelType: WorkspaceTabPanelType, commitHash: string, filePath?: string | null): string {
  return `${panelType}:${commitHash}:${filePath ?? '_'}`;
}

export function computeNoteWorkspaceTabId(relativePath: string): string {
  return `note:${relativePath}`;
}

function getNoteTabTitle(relativePath: string): string {
  return relativePath.split('/').at(-1) ?? relativePath;
}

function synthesizeCommitFromLink(entry: NoteEntry['aiSummaryLink']): Commit | null {
  if (!entry) {
    return null;
  }

  return {
    hash: entry.commitHash,
    shortHash: entry.commitHash.slice(0, 7),
    message: entry.commitMessage,
    author: '',
    date: '',
  };
}

export function createWorkspaceTab(input: OpenWorkspaceTabInput): WorkspaceTab {
  if (input.panelType === 'note') {
    return {
      id: computeNoteWorkspaceTabId(input.relativePath),
      panelType: 'note',
      commit: null,
      filePath: null,
      relativePath: input.relativePath,
      title: getNoteTabTitle(input.relativePath),
    };
  }

  return {
    id: computeWorkspaceTabId(input.panelType, input.commit.hash, input.filePath),
    panelType: input.panelType,
    commit: input.commit,
    filePath: input.filePath ?? null,
    relativePath: null,
    codeInnerPaneTree: input.panelType === 'code'
      ? createDefaultCodeInnerPaneTree()
      : undefined,
    title: null,
  };
}

export function createDefaultCodeInnerPaneTree(): CodeInnerPaneNode {
  return { kind: 'leaf', panel: 'diff' };
}

export function countCodeInnerLeaves(node: CodeInnerPaneNode): number {
  return node.kind === 'leaf'
    ? 1
    : countCodeInnerLeaves(node.children[0]) + countCodeInnerLeaves(node.children[1]);
}

export function hasCodeInnerPanel(node: CodeInnerPaneNode | undefined, panel: CodeInnerPanelKind): boolean {
  if (!node) {
    return panel === 'diff';
  }

  return node.kind === 'leaf'
    ? node.panel === panel
    : hasCodeInnerPanel(node.children[0], panel) || hasCodeInnerPanel(node.children[1], panel);
}

function getCodeInnerPaneTree(node: CodeInnerPaneNode | undefined): CodeInnerPaneNode {
  return node ?? createDefaultCodeInnerPaneTree();
}

function replaceCodeInnerNode(
  node: CodeInnerPaneNode,
  matcher: (candidate: CodeInnerPaneNode) => boolean,
  replacer: (candidate: CodeInnerPaneNode) => CodeInnerPaneNode,
): CodeInnerPaneNode {
  if (matcher(node)) {
    return replacer(node);
  }

  if (node.kind === 'leaf') {
    return node;
  }

  return {
    ...node,
    children: [
      replaceCodeInnerNode(node.children[0], matcher, replacer),
      replaceCodeInnerNode(node.children[1], matcher, replacer),
    ],
  };
}

function removeCodeInnerPanelNode(node: CodeInnerPaneNode, panel: CodeInnerPanelKind): CodeInnerPaneNode | null {
  if (node.kind === 'leaf') {
    return node.panel === panel ? null : node;
  }

  const left = removeCodeInnerPanelNode(node.children[0], panel);
  const right = removeCodeInnerPanelNode(node.children[1], panel);

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

function insertCodeInnerPanel(
  root: CodeInnerPaneNode,
  targetPanel: CodeInnerPanelKind,
  panel: CodeInnerPanelKind,
  zone: Exclude<DropZone, 'center'>,
): CodeInnerPaneNode {
  if (panel === targetPanel || hasCodeInnerPanel(root, panel) || !hasCodeInnerPanel(root, targetPanel)) {
    return root;
  }

  const orientation: PaneSplitOrientation = zone === 'left' || zone === 'right' ? 'horizontal' : 'vertical';
  const newLeaf: CodeInnerLeafNode = { kind: 'leaf', panel };

  return replaceCodeInnerNode(
    root,
    (candidate) => candidate.kind === 'leaf' && candidate.panel === targetPanel,
    (candidate) => {
      const targetLeaf = candidate as CodeInnerLeafNode;
      const children: [CodeInnerPaneNode, CodeInnerPaneNode] =
        zone === 'left' || zone === 'top'
          ? [newLeaf, targetLeaf]
          : [targetLeaf, newLeaf];

      return {
        nodeId: crypto.randomUUID(),
        kind: 'split',
        orientation,
        children,
        sizePercent: 50,
      };
    },
  );
}

function moveCodeInnerPanelNode(
  root: CodeInnerPaneNode,
  sourcePanel: CodeInnerPanelKind,
  targetPanel: CodeInnerPanelKind,
  zone: Exclude<DropZone, 'center'>,
): CodeInnerPaneNode {
  if (sourcePanel === targetPanel || !hasCodeInnerPanel(root, sourcePanel) || !hasCodeInnerPanel(root, targetPanel)) {
    return root;
  }

  const nextRoot = removeCodeInnerPanelNode(root, sourcePanel);
  if (!nextRoot) {
    return root;
  }

  return insertCodeInnerPanel(nextRoot, targetPanel, sourcePanel, zone);
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
        set((current) => ({
          selectedCommit: nextTab.commit ?? current.selectedCommit,
        }));
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
        // note 탭은 commit이 없으므로 마지막 selectedCommit을 그대로 유지한다.
        selectedCommit: nextTab.commit ?? current.selectedCommit,
      }));
    },

    openNoteTreeEntry: (relativePath) => {
      const state = get();
      const entry = state.noteTree.find((item) => item.relativePath === relativePath);
      const link = entry?.aiSummaryLink ?? null;
      if (!link) {
        get().openWorkspaceTab({ panelType: 'note', relativePath });
        return;
      }

      const commit = synthesizeCommitFromLink(link);
      if (!commit) {
        get().openWorkspaceTab({ panelType: 'note', relativePath });
        return;
      }

      if (link.scope === 'commit') {
        get().openWorkspaceTab({ panelType: 'aiSummary', commit, filePath: null });
        return;
      }

      const filePath = link.filePath ?? null;
      get().openWorkspaceTab({ panelType: 'code', commit, filePath });

      const nextState = get();
      const tabId = computeWorkspaceTabId('code', commit.hash, filePath);
      const pane = findLeafPane(nextState.paneTree, nextState.focusedPaneId);
      const tab = pane?.tabs.find((item) => item.id === tabId);
      if (!pane || !tab || tab.panelType !== 'code' || hasCodeInnerPanel(tab.codeInnerPaneTree, 'aiSummary')) {
        return;
      }

      get().toggleCodeInnerPanel(pane.paneId, tab.id, 'aiSummary');
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

      set({
        paneTree: collapsedTree,
        focusedPaneId: nextFocusedPane.paneId,
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
      }));
    },

    activateAdjacentWorkspaceTab: (paneId, direction) => {
      const state = get();
      const pane = findLeafPane(state.paneTree, paneId);
      if (!pane || pane.tabs.length < 2 || !pane.activeTabId) {
        return;
      }

      const activeIndex = pane.tabs.findIndex((tab) => tab.id === pane.activeTabId);
      if (activeIndex === -1) {
        return;
      }

      const offset = direction === 'next' ? 1 : -1;
      const nextIndex = (activeIndex + offset + pane.tabs.length) % pane.tabs.length;
      const nextTab = pane.tabs[nextIndex];
      if (!nextTab) {
        return;
      }

      get().activateWorkspaceTab(paneId, nextTab.id);
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

              const currentTree = getCodeInnerPaneTree(tab.codeInnerPaneTree);
              const nextTree = hasCodeInnerPanel(currentTree, panel)
                ? removeCodeInnerPanelNode(currentTree, panel) ?? createDefaultCodeInnerPaneTree()
                : insertCodeInnerPanel(currentTree, 'diff', panel, 'right');

              return {
                ...tab,
                codeInnerPaneTree: nextTree,
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

      set({
        focusedPaneId: paneId,
      });
    },

    moveWorkspaceTab: ({ sourcePaneId, tabId, targetPaneId, zone }) => {
      const state = get();
      const nextTree = zone === 'center'
        ? mergeTabIntoLeaf(state.paneTree, sourcePaneId, targetPaneId, tabId)
        : moveTabBetweenLeaves(state.paneTree, sourcePaneId, targetPaneId, tabId, zone);

      if (zone === 'center') {
        set({
          paneTree: nextTree,
          focusedPaneId: targetPaneId,
        });
        return;
      }

      const nextFocusedPane = getFirstLeafPane(nextTree);
      const focusedPane = findLeafPane(nextTree, state.focusedPaneId) ?? nextFocusedPane;
      set({
        paneTree: nextTree,
        focusedPaneId: focusedPane.paneId,
      });
    },

    moveCodeInnerPanel: ({ paneId, tabId, sourcePanel, targetPanel, zone }) => {
      set((state) => ({
        paneTree: replacePaneNode(state.paneTree, paneId, (pane) => {
          if (pane.kind !== 'leaf') {
            return pane;
          }

          return {
            ...pane,
            tabs: pane.tabs.map((tab) => {
              if (tab.id !== tabId || tab.panelType !== 'code') {
                return tab;
              }

              return {
                ...tab,
                codeInnerPaneTree: moveCodeInnerPanelNode(getCodeInnerPaneTree(tab.codeInnerPaneTree), sourcePanel, targetPanel, zone),
              };
            }),
          };
        }),
      }));
    },

    setPaneSplitSize: (paneId, sizePercent) => {
      set((state) => ({
        paneTree: replacePaneNode(state.paneTree, paneId, (pane) => pane.kind === 'split'
          ? { ...pane, sizePercent }
          : pane),
      }));
    },

    resizeCodeInnerSplit: (paneId, tabId, nodeId, sizePercent) => {
      set((state) => ({
        paneTree: replacePaneNode(state.paneTree, paneId, (pane) => {
          if (pane.kind !== 'leaf') {
            return pane;
          }

          return {
            ...pane,
            tabs: pane.tabs.map((tab) => {
              if (tab.id !== tabId || tab.panelType !== 'code') {
                return tab;
              }

              return {
                ...tab,
                codeInnerPaneTree: replaceCodeInnerNode(
                  getCodeInnerPaneTree(tab.codeInnerPaneTree),
                  (candidate) => candidate.kind === 'split' && candidate.nodeId === nodeId,
                  (candidate) => candidate.kind === 'split'
                    ? { ...candidate, sizePercent }
                    : candidate,
                ),
              };
            }),
          };
        }),
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
