import { afterEach, describe, expect, it, vi } from 'vitest';

describe('appStore webview filter persistence', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'acquireVsCodeApi');
  });

  it('initializes filters from VSCode webview state', async () => {
    window.acquireVsCodeApi = vi.fn(() => ({
      postMessage: vi.fn(),
      getState: vi.fn(() => ({
        filter: {
          filterDateStart: '2026-06-01',
          filterDateEnd: '2026-06-27',
          filterAuthor: 'Jane Cooper',
          filterKeyword: 'refactor',
        },
      })),
      setState: vi.fn(),
    }));

    const { useAppStore } = await import('../../src/webview/store/appStore');
    const state = useAppStore.getState();

    expect(state.filterDateStart).toBe('2026-06-01');
    expect(state.filterDateEnd).toBe('2026-06-27');
    expect(state.filterAuthor).toBe('Jane Cooper');
    expect(state.filterKeyword).toBe('refactor');
  });

  it('persists filters when they change or clear', async () => {
    const setState = vi.fn();

    window.acquireVsCodeApi = vi.fn(() => ({
      postMessage: vi.fn(),
      getState: vi.fn(() => ({
        filter: {
          filterDateStart: null,
          filterDateEnd: null,
          filterAuthor: 'Jane Cooper',
          filterKeyword: '',
        },
      })),
      setState,
    }));

    const { useAppStore } = await import('../../src/webview/store/appStore');

    useAppStore.getState().setFilter({ filterKeyword: 'summary' });

    expect(setState).toHaveBeenLastCalledWith({
      filter: {
        filterDateStart: null,
        filterDateEnd: null,
        filterAuthor: 'Jane Cooper',
        filterKeyword: 'summary',
      },
    });

    useAppStore.getState().clearFilters();

    expect(setState).toHaveBeenLastCalledWith({
      filter: {
        filterDateStart: null,
        filterDateEnd: null,
        filterAuthor: null,
        filterKeyword: '',
      },
    });
  });
});
