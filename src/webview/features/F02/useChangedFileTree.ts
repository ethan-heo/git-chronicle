import { useCallback, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { EMPTY_CHANGED_FILES_STATE } from '../../store/slices/changedFilesSlice';
import type { ChangedFile, Commit } from '../../types/commit';

interface UseChangedFileTreeResult {
  changedFiles: ChangedFile[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  retryTree: () => void;
}

export function useChangedFileTree(options: { isActive: boolean; commit: Commit | null }): UseChangedFileTreeResult {
  const { isActive, commit } = options;
  const changedFilesState = useAppStore((state) => (
    commit ? state.changedFilesByCommit[commit.hash] ?? EMPTY_CHANGED_FILES_STATE : EMPTY_CHANGED_FILES_STATE
  ));
  const loadChangedFiles = useAppStore((state) => state.loadChangedFiles);
  const handleChangedFilesLoaded = useAppStore((state) => state.handleChangedFilesLoaded);
  const handleChangedFilesLoadFailed = useAppStore((state) => state.handleChangedFilesLoadFailed);

  useEffect(() => {
    if (!isActive || !commit) {
      return;
    }

    loadChangedFiles({ commit });
  }, [commit, isActive, loadChangedFiles]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: {
          commitHash?: string;
          files?: ChangedFile[];
          hasSavedCommitSummary?: boolean;
          message?: string;
        };
      }>,
    ): void => {
      if (event.data.type === 'CHANGED_FILES_LOADED') {
        if (!commit || event.data.payload?.commitHash !== commit.hash) {
          return;
        }
        handleChangedFilesLoaded({
          commitHash: commit.hash,
          files: event.data.payload?.files ?? [],
          hasSavedCommitSummary: event.data.payload?.hasSavedCommitSummary ?? false,
        });
        return;
      }

      if (event.data.type === 'CHANGED_FILES_LOAD_FAILED') {
        if (!commit || event.data.payload?.commitHash !== commit.hash) {
          return;
        }
        handleChangedFilesLoadFailed({ commitHash: commit.hash, message: event.data.payload?.message });
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [commit, handleChangedFilesLoaded, handleChangedFilesLoadFailed, isActive]);

  const retryTree = useCallback(() => {
    if (commit) {
      loadChangedFiles({ commit });
    }
  }, [commit, loadChangedFiles]);

  return {
    changedFiles: changedFilesState.changedFiles,
    isLoading: changedFilesState.isLoading,
    hasLoaded: changedFilesState.hasLoaded,
    error: changedFilesState.error,
    retryTree,
  };
}
