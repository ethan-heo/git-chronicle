import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Commit } from '../../src/webview/types/commit';

const commitA: Commit = { hash: 'commit-a', shortHash: 'commit-a', message: 'A', author: 'x', date: '2026-01-01' };
const commitB: Commit = { hash: 'commit-b', shortHash: 'commit-b', message: 'B', author: 'x', date: '2026-01-02' };

describe('useDependencyCanvas commit switching', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'acquireVsCodeApi');
  });

  it('requests a fresh dependency analysis when the same pane switches to a different commit', async () => {
    const postMessageSpy = vi.fn();
    window.acquireVsCodeApi = vi.fn(() => ({
      postMessage: postMessageSpy,
      getState: vi.fn(() => ({})),
      setState: vi.fn(),
    }));

    const { useDependencyCanvas } = await import('../../src/webview/features/F04/useDependencyCanvas');
    const { useAppStore } = await import('../../src/webview/store/appStore');

    useAppStore.setState({
      changedFilesByCommit: {
        'commit-a': { changedFiles: [{ path: 'a.ts', status: 'M' }], hasSavedCommitSummary: false, isLoading: false, error: null, hasLoaded: true },
        'commit-b': { changedFiles: [{ path: 'b.ts', status: 'M' }], hasSavedCommitSummary: false, isLoading: false, error: null, hasLoaded: true },
      },
      dependencyGraphsByPane: {},
    });

    const { rerender } = renderHook(
      ({ commit }: { commit: Commit }) => useDependencyCanvas({ isActive: true, paneId: 'pane-1', commit }),
      { initialProps: { commit: commitA } },
    );

    expect(postMessageSpy).toHaveBeenCalledWith({
      type: 'ANALYZE_DEPENDENCIES',
      payload: { paneId: 'pane-1', filePaths: ['a.ts'], commitHash: 'commit-a' },
    });

    act(() => {
      useAppStore.getState().handleDependenciesLoaded({
        paneId: 'pane-1',
        edges: [{ from: 'a.ts', to: 'other.ts', kind: 'import' }],
      });
    });

    postMessageSpy.mockClear();

    // Same pane, but the workspace tab now shows a different commit — this is what happens when a
    // user opens the fileCanvas tab for another commit within a pane that already loaded one before.
    rerender({ commit: commitB });

    expect(postMessageSpy).toHaveBeenCalledWith({
      type: 'ANALYZE_DEPENDENCIES',
      payload: { paneId: 'pane-1', filePaths: ['b.ts'], commitHash: 'commit-b' },
    });
  });

  it('does not re-request dependencies when re-rendered for the same commit that already loaded', async () => {
    const postMessageSpy = vi.fn();
    window.acquireVsCodeApi = vi.fn(() => ({
      postMessage: postMessageSpy,
      getState: vi.fn(() => ({})),
      setState: vi.fn(),
    }));

    const { useDependencyCanvas } = await import('../../src/webview/features/F04/useDependencyCanvas');
    const { useAppStore } = await import('../../src/webview/store/appStore');

    useAppStore.setState({
      changedFilesByCommit: {
        'commit-a': { changedFiles: [{ path: 'a.ts', status: 'M' }], hasSavedCommitSummary: false, isLoading: false, error: null, hasLoaded: true },
      },
      dependencyGraphsByPane: {},
    });

    const { rerender } = renderHook(
      ({ commit }: { commit: Commit }) => useDependencyCanvas({ isActive: true, paneId: 'pane-1', commit }),
      { initialProps: { commit: commitA } },
    );

    act(() => {
      useAppStore.getState().handleDependenciesLoaded({
        paneId: 'pane-1',
        edges: [{ from: 'a.ts', to: 'other.ts', kind: 'import' }],
      });
    });

    postMessageSpy.mockClear();

    rerender({ commit: { ...commitA } });

    expect(postMessageSpy).not.toHaveBeenCalled();
  });
});
