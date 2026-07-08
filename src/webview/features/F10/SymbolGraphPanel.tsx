import { ReactFlowProvider } from '@xyflow/react';
import type { FC } from 'react';
import { ResizableSplitPane } from '../../shared/components';
import { SymbolCodePanel } from './SymbolCodePanel';
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
    <ResizableSplitPane
      isOpen={data.isCodePanelOpen}
      className="h-full min-h-0"
      defaultLeftPercent={62}
      left={(
        <div className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden">
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
      )}
      right={(
        <SymbolCodePanel
          isOpen={data.isCodePanelOpen}
          filePath={data.selectedFile.path}
          fileContent={data.symbolFileContent ?? ''}
          language={data.selectedFile.path}
          highlightRange={
            data.highlightedRange
              ? { start: data.highlightedRange.lineStart, end: data.highlightedRange.lineEnd }
              : null
          }
          scrollToRange={data.scrollToRange}
          scrollRequestId={data.scrollRequestId}
          onClose={data.closeCodePanel}
        />
      )}
    />
  );
};
