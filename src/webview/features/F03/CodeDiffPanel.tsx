import type { FC } from 'react';
import { DiffViewer } from './DiffViewer';
import { useFileDiff } from './useFileDiff';

interface CodeDiffPanelProps {
  isActive: boolean;
  commitHash: string | null;
  filePath: string;
  isDeletedFile: boolean;
}

export const CodeDiffPanel: FC<CodeDiffPanelProps> = ({ isActive, commitHash, filePath, isDeletedFile }) => {
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
        onRetry={loadFileDiff}
      />
    </div>
  );
};
