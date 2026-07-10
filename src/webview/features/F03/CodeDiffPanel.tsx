import type { LineRange } from './types';
import type { FC } from 'react';
import { DiffViewer } from './DiffViewer';
import { useFileDiff } from './useFileDiff';

interface CodeDiffPanelProps {
  isActive: boolean;
  commitHash: string | null;
  filePath: string;
  isDeletedFile: boolean;
  highlightRange?: LineRange | null;
  scrollToRange?: LineRange | null;
  scrollRequestId?: number;
}

export const CodeDiffPanel: FC<CodeDiffPanelProps> = ({
  isActive,
  commitHash,
  filePath,
  isDeletedFile,
  highlightRange = null,
  scrollToRange = null,
  scrollRequestId = 0,
}) => {
  const { diffState, loadFileDiff } = useFileDiff({ isActive, commitHash, filePath, isDeletedFile });

  return (
    <div className="h-full min-h-0">
      <DiffViewer
        diffLines={diffState.diffLines}
        filePath={filePath}
        isLoading={diffState.isLoading}
        error={diffState.error}
        isBinaryFile={diffState.isBinaryFile}
        isDeletedFile={diffState.isDeletedFile}
        highlightRange={highlightRange}
        scrollToRange={scrollToRange}
        scrollRequestId={scrollRequestId}
        onRetry={loadFileDiff}
      />
    </div>
  );
};
