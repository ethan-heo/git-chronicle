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
