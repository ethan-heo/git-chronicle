import { ReactFlowProvider } from '@xyflow/react';
import type { FC } from 'react';
import type { ChangedFile, Commit } from '../../types/commit';
import { DependencyGraph } from './DependencyGraph';
import { useDependencyCanvas } from './useDependencyCanvas';

interface DependencyCanvasPanelProps {
  isActive: boolean;
  paneId: string;
  commit: Commit | null;
  onFileCodeView: (file: ChangedFile) => void;
}

export const DependencyCanvasPanel: FC<DependencyCanvasPanelProps> = ({ isActive, paneId, commit, onFileCodeView }) => {
  const { files, dependencyEdges, isLoading, error, retryCanvas } = useDependencyCanvas({ isActive, paneId, commit });

  return (
    <div className="h-full min-h-0">
      <ReactFlowProvider>
        <DependencyGraph
          files={files}
          dependencyEdges={dependencyEdges}
          isLoading={isLoading}
          error={error}
          onRetry={retryCanvas}
          onFileCodeView={onFileCodeView}
        />
      </ReactFlowProvider>
    </div>
  );
};
