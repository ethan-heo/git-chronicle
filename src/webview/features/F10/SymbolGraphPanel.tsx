import { ReactFlowProvider } from '@xyflow/react';
import type { FC } from 'react';
import { SymbolGraph } from './SymbolGraph';
import type { UseSymbolGraphResult } from './useSymbolGraph';

interface SymbolGraphPanelProps {
  data: UseSymbolGraphResult;
}

export const SymbolGraphPanel: FC<SymbolGraphPanelProps> = ({ data }) => {
  if (!data.selectedFile) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden">
      <ReactFlowProvider>
        <SymbolGraph
          symbolNodes={data.symbolNodes}
          symbolEdges={data.symbolEdges}
          isLoading={data.isLoading}
          error={data.error}
          onRetry={data.retrySymbolGraph}
          activeNodeId={data.activeSymbolNodeId ?? data.hoveredSymbolNodeId}
          onNodeClick={data.handleNodeClick}
          onNodeHover={data.handleNodeHover}
          onPaneClick={data.handlePaneClick}
        />
      </ReactFlowProvider>
    </div>
  );
};
