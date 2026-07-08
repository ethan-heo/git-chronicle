import { useCallback, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import type { Commit } from '../../types/commit';

interface UseCommitListResult {
  commitList: Commit[];
  hasMoreCommits: boolean;
  isLoadingCommits: boolean;
  isGitRepoDetected: boolean;
  hasLoadedCommits: boolean;
  commitListScrollTop: number;
  commitLoadError: string | null;
  loadMoreError: string | null;
  setCommitListScrollTop: (top: number) => void;
  selectCommit: (commit: Commit) => void;
  onLoadMore: () => void;
  retry: () => void;
}

export function useCommitList(options: { isActive: boolean }): UseCommitListResult {
  const { isActive } = options;
  const commitList = useAppStore((state) => state.commitList);
  const hasMoreCommits = useAppStore((state) => state.hasMoreCommits);
  const isLoadingCommits = useAppStore((state) => state.isLoadingCommits);
  const isGitRepoDetected = useAppStore((state) => state.isGitRepoDetected);
  const hasLoadedCommits = useAppStore((state) => state.hasLoadedCommits);
  const commitListScrollTop = useAppStore((state) => state.commitListScrollTop);
  const commitLoadError = useAppStore((state) => state.commitLoadError);
  const loadMoreError = useAppStore((state) => state.loadMoreError);
  const loadCommits = useAppStore((state) => state.loadCommits);
  const setCommitListScrollTop = useAppStore((state) => state.setCommitListScrollTop);
  const selectCommit = useAppStore((state) => state.selectCommit);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (hasLoadedCommits) {
      return;
    }

    loadCommits(true);
  }, [hasLoadedCommits, isActive, loadCommits]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: {
          commits?: Commit[];
          page?: number;
          pageSize?: number;
          hasMore?: boolean;
          requestId?: number;
          message?: string;
        };
      }>,
    ): void => {
      const store = useAppStore.getState();

      if (event.data.type === 'COMMITS_LOADED' && event.data.payload) {
        store.handleCommitsLoaded({
          commits: event.data.payload.commits ?? [],
          page: event.data.payload.page ?? 0,
          pageSize: event.data.payload.pageSize ?? 200,
          hasMore: event.data.payload.hasMore,
          requestId: event.data.payload.requestId,
        });
        return;
      }

      if (event.data.type === 'GIT_REPOSITORY_NOT_FOUND') {
        store.handleRepositoryNotFound();
        return;
      }

      if (event.data.type === 'COMMITS_LOAD_FAILED') {
        store.handleCommitsLoadFailed(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [isActive]);

  const onLoadMore = useCallback(() => loadCommits(false), [loadCommits]);
  const retry = useCallback(() => loadCommits(commitList.length === 0), [commitList.length, loadCommits]);

  return {
    commitList,
    hasMoreCommits,
    isLoadingCommits,
    isGitRepoDetected,
    hasLoadedCommits,
    commitListScrollTop,
    commitLoadError,
    loadMoreError,
    setCommitListScrollTop,
    selectCommit,
    onLoadMore,
    retry,
  };
}
