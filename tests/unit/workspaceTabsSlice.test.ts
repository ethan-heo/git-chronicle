import { afterEach, describe, expect, it, vi } from 'vitest';

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

  it('switches the selected commit to the fallback tab commit when another tab remains', async () => {
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
    expect(nextState.selectedCommit).toEqual(commitA);
    expect(nextState.paneTree.kind).toBe('leaf');
    if (nextState.paneTree.kind !== 'leaf') {
      throw new Error('Expected a single leaf pane after closing the active tab');
    }
    expect(nextState.paneTree.activeTabId).toBe('aiSummary:aaaaaaaa:_');
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
});
