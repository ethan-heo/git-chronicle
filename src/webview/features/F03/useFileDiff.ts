import { useCallback, useEffect, useState } from 'react';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { parseDiff } from './parseDiff';
import type { DiffLineData, FileDiffPayload } from './types';

export interface FileDiffState {
  diffLines: DiffLineData[];
  isLoading: boolean;
  error: string | null;
  isBinaryFile: boolean;
  isDeletedFile: boolean;
}

const initialDiffState: FileDiffState = {
  diffLines: [],
  isLoading: false,
  error: null,
  isBinaryFile: false,
  isDeletedFile: false,
};

export function useFileDiff(options: {
  isActive: boolean;
  commitHash: string | null;
  filePath: string | null;
  isDeletedFile: boolean;
}): {
  diffState: FileDiffState;
  loadFileDiff: () => void;
} {
  const { isActive, commitHash, filePath, isDeletedFile } = options;
  const [diffState, setDiffState] = useState<FileDiffState>(initialDiffState);

  const applyLoadedDiff = useCallback(async (payload: FileDiffPayload, loadedFilePath: string): Promise<void> => {
    if (payload.isBinary) {
      setDiffState({
        ...initialDiffState,
        isBinaryFile: true,
      });
      return;
    }

    const parsedLines = parseDiff(payload.rawDiff);
    const { highlightDiffLines } = await import('./highlightDiff');
    const highlightedLines = await highlightDiffLines(parsedLines, loadedFilePath);

    setDiffState({
      diffLines: highlightedLines,
      isLoading: false,
      error: null,
      isBinaryFile: false,
      isDeletedFile: payload.isDeleted,
    });
  }, []);

  const loadFileDiff = useCallback((): void => {
    if (!isActive || !commitHash || !filePath) {
      return;
    }

    setDiffState({
      ...initialDiffState,
      isLoading: true,
      isDeletedFile,
    });

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        void applyLoadedDiff(createDemoFileDiff(isDeletedFile), filePath);
      }, 180);
      return;
    }

    postMessage('FETCH_FILE_DIFF', {
      commitHash,
      filePath,
    });
  }, [applyLoadedDiff, commitHash, filePath, isActive, isDeletedFile]);

  useEffect(() => {
    loadFileDiff();
  }, [loadFileDiff]);

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
      if (!filePath) {
        return;
      }

      if (event.data.type === 'FILE_DIFF_LOADED') {
        const payload = event.data.payload;
        void applyLoadedDiff(
          {
            rawDiff: payload?.rawDiff ?? '',
            isBinary: Boolean(payload?.isBinary),
            isDeleted: Boolean(payload?.isDeleted),
          },
          filePath,
        );
        return;
      }

      if (event.data.type === 'FILE_DIFF_LOAD_FAILED') {
        setDiffState({
          ...initialDiffState,
          error: event.data.payload?.message ?? 'diff를 불러오지 못했습니다',
        });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [applyLoadedDiff, filePath, isActive]);

  return { diffState, loadFileDiff };
}

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
