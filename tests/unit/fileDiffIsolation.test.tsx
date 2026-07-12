import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { initI18n } from '../../src/webview/i18n';

vi.mock('../../src/webview/features/F03/highlightDiff', () => ({
  highlightDiffLines: vi.fn(async (lines) => lines.map((line: { tokens?: unknown[] }) => ({
    ...line,
    tokens: line.tokens ?? [],
  }))),
}));

const RAW_DIFF = `diff --git a/src/app.ts b/src/app.ts
index 1234567..89abcde 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1 +1 @@
-before
+after
`;

describe('file diff isolation', () => {
  beforeEach(() => {
    initI18n('ko');
  });

  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'acquireVsCodeApi');
  });

  it('stores loaded diffs by tab id', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');

    useAppStore.setState({
      fileDiffsByTab: {},
    });

    await useAppStore.getState().handleFileDiffLoaded({
      tabId: 'tab-a',
      payload: {
        rawDiff: RAW_DIFF,
        isBinary: false,
        isDeleted: false,
      },
      loadedFilePath: 'src/app.ts',
    });

    const state = useAppStore.getState().fileDiffsByTab['tab-a'];
    expect(state).toMatchObject({
      isLoading: false,
      hasLoaded: true,
      error: null,
      isBinaryFile: false,
      isDeletedFile: false,
    });
    expect(state.diffLines).not.toHaveLength(0);
  });

  it('ignores broadcast diff responses for other tabs', async () => {
    const postMessageSpy = vi.fn();
    window.acquireVsCodeApi = vi.fn(() => ({
      postMessage: postMessageSpy,
      getState: vi.fn(() => ({})),
      setState: vi.fn(),
    }));

    const { useFileDiff } = await import('../../src/webview/features/F03/useFileDiff');
    const { useAppStore } = await import('../../src/webview/store/appStore');

    useAppStore.setState({
      fileDiffsByTab: {},
    });

    const tabAHook = renderHook(() => useFileDiff({
      isActive: true,
      tabId: 'tab-a',
      commitHash: 'commit-a',
      filePath: 'src/a.ts',
      isDeletedFile: false,
    }));
    const tabBHook = renderHook(() => useFileDiff({
      isActive: true,
      tabId: 'tab-b',
      commitHash: 'commit-b',
      filePath: 'src/b.ts',
      isDeletedFile: false,
    }));

    expect(postMessageSpy).toHaveBeenCalledWith({
      type: 'FETCH_FILE_DIFF',
      payload: {
        tabId: 'tab-a',
        commitHash: 'commit-a',
        filePath: 'src/a.ts',
      },
    });
    expect(postMessageSpy).toHaveBeenCalledWith({
      type: 'FETCH_FILE_DIFF',
      payload: {
        tabId: 'tab-b',
        commitHash: 'commit-b',
        filePath: 'src/b.ts',
      },
    });

    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: 'FILE_DIFF_LOADED',
        payload: {
          tabId: 'tab-a',
          rawDiff: RAW_DIFF,
          isBinary: false,
          isDeleted: false,
        },
      },
    }));

    await waitFor(() => {
      expect(tabAHook.result.current.diffState.hasLoaded).toBe(true);
    });

    expect(tabAHook.result.current.diffState.diffLines).not.toHaveLength(0);
    expect(tabBHook.result.current.diffState.hasLoaded).toBe(false);
    expect(tabBHook.result.current.diffState.diffLines).toHaveLength(0);
    expect(tabBHook.result.current.diffState.isLoading).toBe(true);
  });
});
