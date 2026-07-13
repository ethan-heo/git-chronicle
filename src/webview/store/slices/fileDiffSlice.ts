import type { StateCreator } from 'zustand';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { translate } from '../../i18n/runtime';
import { parseDiff } from '../../features/F03/parseDiff';
import { highlightDiffLines } from '../../features/F03/highlightDiff';
import type { DiffLineData, FileDiffPayload } from '../../features/F03/types';
import type { AppState } from '../appStore';

export interface FileDiffStateEntry {
  diffLines: DiffLineData[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  isBinaryFile: boolean;
  isDeletedFile: boolean;
}

export interface FileDiffSlice {
  fileDiffsByTab: Record<string, FileDiffStateEntry>;

  prepareFileDiffTab: (input: { tabId: string }) => void;
  loadFileDiff: (input: { tabId: string; commitHash: string; filePath: string; isDeletedFile: boolean }) => void;
  handleFileDiffLoaded: (input: { tabId: string; payload: FileDiffPayload; loadedFilePath: string }) => Promise<void>;
  handleFileDiffLoadFailed: (input: { tabId: string; message?: string }) => void;
}

export const EMPTY_FILE_DIFF_STATE: FileDiffStateEntry = {
  diffLines: [],
  isLoading: false,
  hasLoaded: false,
  error: null,
  isBinaryFile: false,
  isDeletedFile: false,
};

function getEntry(state: AppState, tabId: string): FileDiffStateEntry {
  return state.fileDiffsByTab[tabId] ?? EMPTY_FILE_DIFF_STATE;
}

export const createFileDiffSlice: StateCreator<AppState, [], [], FileDiffSlice> = (set, get) => ({
  fileDiffsByTab: {},

  prepareFileDiffTab: ({ tabId }) => {
    set((state) => ({
      fileDiffsByTab: {
        ...state.fileDiffsByTab,
        [tabId]: getEntry(state, tabId),
      },
    }));
  },

  loadFileDiff: ({ tabId, commitHash, filePath, isDeletedFile }) => {
    const entry = getEntry(get(), tabId);
    if (entry.isLoading) {
      return;
    }

    set((state) => ({
      fileDiffsByTab: {
        ...state.fileDiffsByTab,
        [tabId]: {
          ...EMPTY_FILE_DIFF_STATE,
          isLoading: true,
          isDeletedFile,
        },
      },
    }));

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        void get().handleFileDiffLoaded({
          tabId,
          payload: createDemoFileDiff(isDeletedFile),
          loadedFilePath: filePath,
        });
      }, 180);
      return;
    }

    postMessage('FETCH_FILE_DIFF', {
      tabId,
      commitHash,
      filePath,
    });
  },

  handleFileDiffLoaded: async ({ tabId, payload, loadedFilePath }) => {
    if (payload.isBinary) {
      set((state) => ({
        fileDiffsByTab: {
          ...state.fileDiffsByTab,
          [tabId]: {
            ...EMPTY_FILE_DIFF_STATE,
            hasLoaded: true,
            isBinaryFile: true,
          },
        },
      }));
      return;
    }

    const parsedLines = parseDiff(payload.rawDiff);
    const highlightedLines = await highlightDiffLines(parsedLines, loadedFilePath);

    set((state) => ({
      fileDiffsByTab: {
        ...state.fileDiffsByTab,
        [tabId]: {
          diffLines: highlightedLines,
          isLoading: false,
          hasLoaded: true,
          error: null,
          isBinaryFile: false,
          isDeletedFile: payload.isDeleted,
        },
      },
    }));
  },

  handleFileDiffLoadFailed: ({ tabId, message }) => {
    set((state) => ({
      fileDiffsByTab: {
        ...state.fileDiffsByTab,
        [tabId]: {
          ...EMPTY_FILE_DIFF_STATE,
          hasLoaded: true,
          error: message ?? translate('diff.error'),
        },
      },
    }));
  },
});

function createDemoFileDiff(isDeleted: boolean): FileDiffPayload {
  if (isDeleted) {
    return {
      rawDiff: `diff --git a/src/hooks/useScrollTrigger.ts b/src/hooks/useScrollTrigger.ts
deleted file mode 100644
index 3f84a11..0000000
--- a/src/hooks/useScrollTrigger.ts
+++ /dev/null
@@ -1,7 +0,0 @@
export function useScrollTrigger(callback: () => void): void {
  window.addEventListener('scroll', callback);

  return () => {
    window.removeEventListener('scroll', callback);
  };
}`,
      isBinary: false,
      isDeleted: true,
    };
  }

  return {
    rawDiff: `diff --git a/src/components/CommitList/CommitList.tsx b/src/components/CommitList/CommitList.tsx
index 18c2a19..f3b89de 100644
--- a/src/components/CommitList/CommitList.tsx
+++ b/src/components/CommitList/CommitList.tsx
@@ -8,9 +8,14 @@ interface CommitListProps {
 export function CommitList({ commits, onSelectCommit }: CommitListProps) {
   const listRef = useRef<HTMLDivElement | null>(null);

-  const handleScroll = () => {
-    if (!listRef.current) return;
-    onLoadMore();
+  const handleIntersect = (entry: IntersectionObserverEntry) => {
+    if (!entry.isIntersecting) {
+      return;
+    }
+
+    requestAnimationFrame(() => {
+      onLoadMore();
+    });
   };

   return (`,
    isBinary: false,
    isDeleted: false,
  };
}
