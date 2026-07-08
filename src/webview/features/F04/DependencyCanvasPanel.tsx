import { ReactFlowProvider } from '@xyflow/react';
import type { FC } from 'react';
import type { ChangedFile } from '../../types/commit';
import { DependencyGraph } from './DependencyGraph';
import { useDependencyCanvas } from './useDependencyCanvas';

interface DependencyCanvasPanelProps {
  isActive: boolean;
  onFileCodeView: (file: ChangedFile) => void;
}

export const DependencyCanvasPanel: FC<DependencyCanvasPanelProps> = ({ isActive, onFileCodeView }) => {
  const { files, dependencyEdges, isLoading, error, retryCanvas } = useDependencyCanvas({ isActive });

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
