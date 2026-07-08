import { useCallback, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import type { ChangedFile } from '../../types/commit';

interface UseChangedFileTreeResult {
  changedFiles: ChangedFile[];
  isLoading: boolean;
  error: string | null;
  retryTree: () => void;
}

export function useChangedFileTree(options: { isActive: boolean }): UseChangedFileTreeResult {
  const { isActive } = options;
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const changedFiles = useAppStore((state) => state.changedFiles);
  const isLoadingChangedFiles = useAppStore((state) => state.isLoadingChangedFiles);
  const changedFilesError = useAppStore((state) => state.changedFilesError);
  const loadChangedFiles = useAppStore((state) => state.loadChangedFiles);
  const handleChangedFilesLoaded = useAppStore((state) => state.handleChangedFilesLoaded);
  const handleChangedFilesLoadFailed = useAppStore((state) => state.handleChangedFilesLoadFailed);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    loadChangedFiles();
  }, [isActive, loadChangedFiles, selectedCommit?.hash]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: {
          files?: ChangedFile[];
          hasSavedCommitSummary?: boolean;
          message?: string;
        };
      }>,
    ): void => {
      if (event.data.type === 'CHANGED_FILES_LOADED') {
        handleChangedFilesLoaded({
          files: event.data.payload?.files ?? [],
          hasSavedCommitSummary: event.data.payload?.hasSavedCommitSummary ?? false,
        });
        return;
      }

      if (event.data.type === 'CHANGED_FILES_LOAD_FAILED') {
        handleChangedFilesLoadFailed(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [handleChangedFilesLoaded, handleChangedFilesLoadFailed, isActive]);

  const retryTree = useCallback(() => loadChangedFiles(), [loadChangedFiles]);

  return {
    changedFiles,
    isLoading: isLoadingChangedFiles,
    error: changedFilesError,
    retryTree,
  };
}
