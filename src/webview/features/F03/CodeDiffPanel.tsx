import type { LineRange } from './types';
import type { FC } from 'react';
import { DiffViewer } from './DiffViewer';
import { useFileDiff } from './useFileDiff';

interface CodeDiffPanelProps {
  isActive: boolean;
  tabId: string;
  commitHash: string | null;
  filePath: string;
  isDeletedFile: boolean;
  scrollCacheKey?: string;
  highlightRange?: LineRange | null;
  scrollToRange?: LineRange | null;
  scrollRequestId?: number;
}

export const CodeDiffPanel: FC<CodeDiffPanelProps> = ({
  isActive,
  tabId,
  commitHash,
  filePath,
  isDeletedFile,
  scrollCacheKey,
  highlightRange = null,
  scrollToRange = null,
  scrollRequestId = 0,
}) => {
  const { diffState, loadFileDiff } = useFileDiff({
    isActive,
    tabId,
    commitHash,
    filePath,
    isDeletedFile,
  });

  return (
    <div className="h-full min-h-0">
      <DiffViewer
        diffLines={diffState.diffLines}
        filePath={filePath}
        isLoading={diffState.isLoading}
        error={diffState.error}
        isBinaryFile={diffState.isBinaryFile}
        isDeletedFile={diffState.isDeletedFile}
        scrollCacheKey={scrollCacheKey}
        highlightRange={highlightRange}
        scrollToRange={scrollToRange}
        scrollRequestId={scrollRequestId}
        onRetry={loadFileDiff}
      />
    </div>
  );
};
