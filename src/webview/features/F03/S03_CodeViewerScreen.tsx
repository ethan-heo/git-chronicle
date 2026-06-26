import { useCallback, useEffect, useState, type FC } from 'react';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import { TopHeader } from '../../shared/components';
import { useAppStore } from '../../store/appStore';
import { DiffViewer } from './DiffViewer';
import { parseDiff } from './parseDiff';
import type { DiffLineData, FileDiffPayload } from './types';

interface FileDiffState {
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

export const S03CodeViewerScreen: FC = () => {
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const goToHistoryView = useAppStore((state) => state.goToHistoryView);
  const goToSettingsView = useAppStore((state) => state.goToSettingsView);
  const [diffState, setDiffState] = useState<FileDiffState>(initialDiffState);

  const applyLoadedDiff = useCallback(async (payload: FileDiffPayload, filePath: string): Promise<void> => {
    if (payload.isBinary) {
      setDiffState({
        ...initialDiffState,
        isBinaryFile: true,
      });
      return;
    }

    const parsedLines = parseDiff(payload.rawDiff);
    const { highlightDiffLines } = await import('./highlightDiff');
    const highlightedLines = await highlightDiffLines(parsedLines, filePath);

    setDiffState({
      diffLines: highlightedLines,
      isLoading: false,
      error: null,
      isBinaryFile: false,
      isDeletedFile: payload.isDeleted,
    });
  }, []);

  const loadFileDiff = useCallback((): void => {
    if (!selectedCommit || !selectedFile) {
      return;
    }

    setDiffState({
      ...initialDiffState,
      isLoading: true,
    });

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        void applyLoadedDiff(createDemoFileDiff(selectedFile.status === 'D'), selectedFile.path);
      }, 180);
      return;
    }

    postMessage('FETCH_FILE_DIFF', {
      commitHash: selectedCommit.hash,
      filePath: selectedFile.path,
    });
  }, [applyLoadedDiff, selectedCommit, selectedFile]);

  useEffect(() => {
    loadFileDiff();
  }, [loadFileDiff]);

  useEffect(() => {
    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: Partial<FileDiffPayload> & {
          message?: string;
        };
      }>,
    ): void => {
      if (!selectedFile) {
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
          selectedFile.path,
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
  }, [applyLoadedDiff, selectedFile]);

  if (!selectedCommit || !selectedFile) {
    return null;
  }

  return (
    <main className="app-shell commit-log-shell code-viewer-shell">
      <TopHeader
        title={selectedCommit.message}
        context={`${selectedCommit.shortHash} > ${selectedFile.path}`}
        showBackButton
        onBackClick={goToHistoryView}
        showSettingsIcon
        onSettingsClick={goToSettingsView}
      />
      <DiffViewer
        diffLines={diffState.diffLines}
        filePath={selectedFile.path}
        isLoading={diffState.isLoading}
        error={diffState.error}
        isBinaryFile={diffState.isBinaryFile}
        isDeletedFile={diffState.isDeletedFile}
        onRetry={loadFileDiff}
      />
    </main>
  );
};

function createDemoFileDiff(isDeleted: boolean): FileDiffPayload {
  if (isDeleted) {
    return {
      rawDiff: `diff --git a/src/hooks/useScrollTrigger.ts b/src/hooks/useScrollTrigger.ts
deleted file mode 100644
index 3f84a11..0000000
--- a/src/hooks/useScrollTrigger.ts
+++ /dev/null
@@ -1,7 +0,0 @@
-export function useScrollTrigger(callback: () => void): void {
-  window.addEventListener('scroll', callback);
-
-  return () => {
-    window.removeEventListener('scroll', callback);
-  };
-}`,
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
