import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PaneLeafNode, PaneNode } from '../../src/webview/store/slices/workspaceTabsSlice';
import type { Commit } from '../../src/webview/types/commit';

const commitA: Commit = {
  hash: 'aaaaaaaa',
  shortHash: 'aaaaaaa',
  message: 'Commit A',
  author: 'Alice',
  date: '2026-07-10T10:00:00.000Z',
};

const commitB: Commit = {
  hash: 'bbbbbbbb',
  shortHash: 'bbbbbbb',
  message: 'Commit B',
  author: 'Bob',
  date: '2026-07-10T11:00:00.000Z',
};

function collectLeafPanes(node: PaneNode): PaneLeafNode[] {
  return node.kind === 'leaf' ? [node] : [...collectLeafPanes(node.children[0]), ...collectLeafPanes(node.children[1])];
}

describe('workspaceTabsSlice closeWorkspaceTab', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'acquireVsCodeApi');
  });

  it('keeps the selected commit when the last active tab is closed', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.selectCommit(commitA);
    state.openWorkspaceTab({ panelType: 'aiSummary', commit: commitA });

    const pane = useAppStore.getState().paneTree;
    if (pane.kind !== 'leaf' || !pane.activeTabId) {
      throw new Error('Expected a single active leaf pane');
    }

    useAppStore.getState().closeWorkspaceTab(pane.paneId, pane.activeTabId);

    const nextState = useAppStore.getState();
    expect(nextState.selectedCommit).toEqual(commitA);
    expect(nextState.paneTree.kind).toBe('leaf');
    if (nextState.paneTree.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane after closing the last tab');
    }
    expect(nextState.paneTree.activeTabId).toBeNull();
  });

  it('keeps the current sidebar commit when another tab remains after closing the active tab', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.selectCommit(commitA);
    state.openWorkspaceTab({ panelType: 'aiSummary', commit: commitA });
    state.openWorkspaceTab({ panelType: 'fileCanvas', commit: commitB });

    const pane = useAppStore.getState().paneTree;
    if (pane.kind !== 'leaf' || !pane.activeTabId) {
      throw new Error('Expected a single active leaf pane');
    }

    useAppStore.getState().closeWorkspaceTab(pane.paneId, pane.activeTabId);

    const nextState = useAppStore.getState();
    expect(nextState.selectedCommit).toEqual(commitB);
    expect(nextState.paneTree.kind).toBe('leaf');
    if (nextState.paneTree.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane after closing the active tab');
    }
    expect(nextState.paneTree.activeTabId).toBe('aiSummary:aaaaaaaa:_');
  });

  it('keeps the sidebar commit when fallback activates another open tab', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.selectCommit(commitA);
    state.openWorkspaceTab({ panelType: 'aiSummary', commit: commitA });
    state.openWorkspaceTab({ panelType: 'fileCanvas', commit: commitB });
    state.openWorkspaceTab({ panelType: 'aiSummary', commit: commitA });

    const pane = useAppStore.getState().paneTree;
    if (pane.kind !== 'leaf' || !pane.activeTabId) {
      throw new Error('Expected a single active leaf pane');
    }

    useAppStore.getState().closeWorkspaceTab(pane.paneId, pane.activeTabId);

    const nextState = useAppStore.getState();
    expect(nextState.selectedCommit).toEqual(commitA);
    if (nextState.paneTree.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane after closing the active tab');
    }
    expect(nextState.paneTree.activeTabId).toBe('fileCanvas:bbbbbbbb:_');
  });
});

describe('workspaceTabsSlice pr/issue tabs (F12)', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'acquireVsCodeApi');
  });

  it('opening a pr tab keeps the previously selected commit unchanged', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.selectCommit(commitA);
    state.openWorkspaceTab({ panelType: 'aiSummary', commit: commitA });
    state.openWorkspaceTab({ panelType: 'pr', prNumber: 42, title: 'fix: race condition' });

    const nextState = useAppStore.getState();
    expect(nextState.selectedCommit).toEqual(commitA);

    const pane = nextState.paneTree;
    if (pane.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane');
    }
    expect(pane.activeTabId).toBe('pr:42');
    const prTab = pane.tabs.find((tab) => tab.id === 'pr:42');
    expect(prTab?.commit).toBeNull();
    expect(prTab?.prNumber).toBe(42);
    expect(prTab?.title).toBe('fix: race condition');
    expect(nextState.sidebarActivePRNumber).toBe(42);
    expect(nextState.sidebarActiveIssueNumber).toBeNull();
  });

  it('reopening the same pr number activates the existing tab instead of creating a new one', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.openWorkspaceTab({ panelType: 'pr', prNumber: 42, title: 'fix: race condition' });
    state.openWorkspaceTab({ panelType: 'issue', issueNumber: 7, title: 'Crash on empty repository' });
    state.openWorkspaceTab({ panelType: 'pr', prNumber: 42, title: 'fix: race condition' });

    const pane = useAppStore.getState().paneTree;
    if (pane.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane');
    }
    expect(pane.tabs).toHaveLength(2);
    expect(pane.activeTabId).toBe('pr:42');
    expect(useAppStore.getState().sidebarActivePRNumber).toBe(42);
  });

  it('closing the active pr tab falls back to keeping the last selected commit', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.selectCommit(commitB);
    state.openWorkspaceTab({ panelType: 'issue', issueNumber: 7, title: 'Crash on empty repository' });

    const pane = useAppStore.getState().paneTree;
    if (pane.kind !== 'leaf' || !pane.activeTabId) {
      throw new Error('Expected a single active leaf pane');
    }

    useAppStore.getState().closeWorkspaceTab(pane.paneId, pane.activeTabId);

    const nextState = useAppStore.getState();
    expect(nextState.selectedCommit).toEqual(commitB);
  });

  it('keeps sidebar pr highlight when focus moves away, but updates on sidebar reopen', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.selectCommit(commitA);
    state.openWorkspaceTab({ panelType: 'pr', prNumber: 42, title: 'fix: race condition' });
    const rootPane = useAppStore.getState().paneTree;
    if (rootPane.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane before splitting');
    }

    state.openWorkspaceTab({ panelType: 'fileCanvas', commit: commitB });
    state.moveWorkspaceTab({
      sourcePaneId: rootPane.paneId,
      tabId: 'fileCanvas:bbbbbbbb:_',
      targetPaneId: rootPane.paneId,
      zone: 'right',
    });

    const splitTree = useAppStore.getState().paneTree;
    const [, rightPane] = collectLeafPanes(splitTree);
    useAppStore.getState().focusPane(rightPane.paneId);

    let nextState = useAppStore.getState();
    expect(nextState.sidebarActivePRNumber).toBe(42);

    useAppStore.getState().openWorkspaceTab({ panelType: 'pr', prNumber: 99, title: 'feat: new sidebar' });
    nextState = useAppStore.getState();
    expect(nextState.sidebarActivePRNumber).toBe(99);
  });

  it('keeps sidebar issue highlight when activating an existing non-issue tab', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.selectCommit(commitA);
    state.openWorkspaceTab({ panelType: 'issue', issueNumber: 7, title: 'Crash on empty repository' });
    state.openWorkspaceTab({ panelType: 'aiSummary', commit: commitB });
    state.activateWorkspaceTab(useAppStore.getState().focusedPaneId, 'issue:7');
    state.activateWorkspaceTab(useAppStore.getState().focusedPaneId, 'aiSummary:bbbbbbbb:_');

    const nextState = useAppStore.getState();
    expect(nextState.sidebarActiveIssueNumber).toBe(7);
    expect(nextState.selectedCommit).toEqual(commitB);
  });
});

describe('workspaceTabsSlice note tabs (F11)', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'acquireVsCodeApi');
  });

  it('opens note tabs by relative path without changing the selected commit', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.selectCommit(commitA);
    state.openWorkspaceTab({ panelType: 'note', relativePath: 'ideas/todo.md' });

    const nextState = useAppStore.getState();
    expect(nextState.selectedCommit).toEqual(commitA);
    if (nextState.paneTree.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane');
    }

    const noteTab = nextState.paneTree.tabs.find((tab) => tab.id === 'note:ideas/todo.md');
    expect(noteTab?.commit).toBeNull();
    expect(noteTab?.relativePath).toBe('ideas/todo.md');
  });

  it('renames and closes note tabs by relative path', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.openWorkspaceTab({ panelType: 'note', relativePath: 'ideas/todo.md' });
    state.renameNoteTabs('ideas/todo.md', 'archive/todo.md');

    let nextState = useAppStore.getState();
    if (nextState.paneTree.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane');
    }
    expect(nextState.paneTree.tabs.find((tab) => tab.id === 'note:archive/todo.md')?.relativePath).toBe('archive/todo.md');
    expect(nextState.paneTree.activeTabId).toBe('note:archive/todo.md');

    state.closeNoteTabs('archive/todo.md');
    nextState = useAppStore.getState();
    if (nextState.paneTree.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane');
    }
    expect(nextState.paneTree.tabs).toHaveLength(0);
    expect(nextState.paneTree.activeTabId).toBeNull();
  });

  it('reopens linked AI summary notes into aiSummary tabs instead of note tabs', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.handleNoteTreeLoaded({
      entries: [{
        relativePath: 'summaries/commit.ai.md',
        name: 'commit.ai.md',
        updatedAt: '2026-07-12T00:00:00.000Z',
        aiSummaryLink: {
          commitHash: 'aaaaaaaa',
          scope: 'commit',
          commitMessage: 'Commit A',
        },
      }],
    });

    state.selectCommit(commitB);
    state.openNoteTreeEntry('summaries/commit.ai.md');

    const nextState = useAppStore.getState();
    expect(nextState.selectedCommit).toMatchObject({
      hash: commitA.hash,
      shortHash: commitA.shortHash,
      message: commitA.message,
    });
    if (nextState.paneTree.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane');
    }
    expect(nextState.paneTree.tabs.find((tab) => tab.id === 'aiSummary:aaaaaaaa:_')?.panelType).toBe('aiSummary');
  });

  it('reopens linked file AI summary notes into code tabs with aiSummary panel enabled', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.handleNoteTreeLoaded({
      entries: [{
        relativePath: 'summaries/file.ai.md',
        name: 'file.ai.md',
        updatedAt: '2026-07-12T00:00:00.000Z',
        aiSummaryLink: {
          commitHash: 'aaaaaaaa',
          filePath: 'src/app.ts',
          scope: 'file',
          commitMessage: 'Commit A',
        },
      }],
    });

    state.openNoteTreeEntry('summaries/file.ai.md');
    state.openNoteTreeEntry('summaries/file.ai.md');

    const nextState = useAppStore.getState();
    if (nextState.paneTree.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane');
    }
    const codeTab = nextState.paneTree.tabs.find((tab) => tab.id === 'code:aaaaaaaa:src/app.ts');
    expect(codeTab?.panelType).toBe('code');
    expect(codeTab?.codeInnerPanels?.aiSummary).toBe(true);
  });
});

describe('workspaceTabsSlice moveWorkspaceTab', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'acquireVsCodeApi');
  });

  it('merges a tab into another pane and collapses the emptied source leaf', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.selectCommit(commitA);
    state.openWorkspaceTab({ panelType: 'aiSummary', commit: commitA });
    state.openWorkspaceTab({ panelType: 'fileCanvas', commit: commitB });

    const rootPane = useAppStore.getState().paneTree;
    if (rootPane.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane before splitting');
    }

    state.moveWorkspaceTab({
      sourcePaneId: rootPane.paneId,
      tabId: 'fileCanvas:bbbbbbbb:_',
      targetPaneId: rootPane.paneId,
      zone: 'right',
    });

    const splitTree = useAppStore.getState().paneTree;
    const [leftPane, rightPane] = collectLeafPanes(splitTree);
    state.moveWorkspaceTab({
      sourcePaneId: rightPane.paneId,
      tabId: 'fileCanvas:bbbbbbbb:_',
      targetPaneId: leftPane.paneId,
      zone: 'center',
    });

    const nextState = useAppStore.getState();
    expect(nextState.focusedPaneId).toBe(leftPane.paneId);
    expect(nextState.selectedCommit).toEqual(commitB);
    expect(nextState.paneTree.kind).toBe('leaf');
    if (nextState.paneTree.kind !== 'leaf') {
      throw new Error('Expected the source leaf to collapse after merging its last tab');
    }
    expect(nextState.paneTree.tabs.map((tab) => tab.id)).toEqual([
      'aiSummary:aaaaaaaa:_',
      'fileCanvas:bbbbbbbb:_',
    ]);
    expect(nextState.paneTree.activeTabId).toBe('fileCanvas:bbbbbbbb:_');
  });

  it('deduplicates when the target pane already has the same tab id', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    state.selectCommit(commitA);
    state.openWorkspaceTab({ panelType: 'aiSummary', commit: commitA });
    state.openWorkspaceTab({ panelType: 'fileCanvas', commit: commitA });

    const rootPane = useAppStore.getState().paneTree;
    if (rootPane.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane before splitting');
    }

    state.moveWorkspaceTab({
      sourcePaneId: rootPane.paneId,
      tabId: 'fileCanvas:aaaaaaaa:_',
      targetPaneId: rootPane.paneId,
      zone: 'right',
    });

    const splitTree = useAppStore.getState().paneTree;
    const [leftPane, rightPane] = collectLeafPanes(splitTree);
    state.openWorkspaceTab({ panelType: 'fileCanvas', commit: commitA, paneId: leftPane.paneId });

    state.moveWorkspaceTab({
      sourcePaneId: rightPane.paneId,
      tabId: 'fileCanvas:aaaaaaaa:_',
      targetPaneId: leftPane.paneId,
      zone: 'center',
    });

    const nextState = useAppStore.getState();
    expect(nextState.paneTree.kind).toBe('leaf');
    if (nextState.paneTree.kind !== 'leaf') {
      throw new Error('Expected the duplicated source leaf to collapse after merge');
    }
    expect(nextState.paneTree.tabs.filter((tab) => tab.id === 'fileCanvas:aaaaaaaa:_')).toHaveLength(1);
    expect(nextState.paneTree.activeTabId).toBe('fileCanvas:aaaaaaaa:_');
  });
});
