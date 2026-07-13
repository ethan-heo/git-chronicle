import { useCallback, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { EMPTY_FILE_DIFF_STATE, type FileDiffStateEntry } from '../../store/slices/fileDiffSlice';
import type { FileDiffPayload } from './types';

export function useFileDiff(options: {
  isActive: boolean;
  tabId: string;
  commitHash: string | null;
  filePath: string | null;
  isDeletedFile: boolean;
}): {
  diffState: FileDiffStateEntry;
  loadFileDiff: () => void;
} {
  const {
    isActive, tabId, commitHash, filePath, isDeletedFile,
  } = options;
  const diffState = useAppStore((state) => state.fileDiffsByTab[tabId] ?? EMPTY_FILE_DIFF_STATE);
  const prepareFileDiffTab = useAppStore((state) => state.prepareFileDiffTab);
  const storeLoadFileDiff = useAppStore((state) => state.loadFileDiff);

  useEffect(() => {
    prepareFileDiffTab({ tabId });
  }, [prepareFileDiffTab, tabId]);

  const loadFileDiff = useCallback((): void => {
    if (!isActive || !commitHash || !filePath) {
      return;
    }

    storeLoadFileDiff({
      tabId,
      commitHash,
      filePath,
      isDeletedFile,
    });
  }, [commitHash, filePath, isActive, isDeletedFile, storeLoadFileDiff, tabId]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: Partial<FileDiffPayload> & {
          message?: string;
        };
      }>,
    ): void => {
      if (!filePath || event.data.payload?.tabId !== tabId) {
        return;
      }

      if (event.data.type === 'FILE_DIFF_LOADED') {
        const payload = event.data.payload;
        void useAppStore.getState().handleFileDiffLoaded({
          tabId,
          payload: {
            rawDiff: payload?.rawDiff ?? '',
            isBinary: Boolean(payload?.isBinary),
            isDeleted: Boolean(payload?.isDeleted),
          },
          loadedFilePath: filePath,
        }).catch((error: unknown) => {
          useAppStore.getState().handleFileDiffLoadFailed({
            tabId,
            message: error instanceof Error ? error.message : undefined,
          });
        });
        return;
      }

      if (event.data.type === 'FILE_DIFF_LOAD_FAILED') {
        useAppStore.getState().handleFileDiffLoadFailed({
          tabId,
          message: event.data.payload?.message,
        });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [filePath, isActive, tabId]);

  useEffect(() => {
    if (isActive && !diffState.hasLoaded && !diffState.error) {
      loadFileDiff();
    }
  }, [diffState.error, diffState.hasLoaded, isActive, loadFileDiff]);

  return { diffState, loadFileDiff };
}
