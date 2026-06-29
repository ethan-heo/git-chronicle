import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ResizableSplitPane, SplitViewButton, TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import { SymbolCodePanel } from './SymbolCodePanel';
import { SymbolGraph } from './SymbolGraph';

export const S08IntraFileSymbolDependencyCanvasScreen: FC = () => {
  const { t } = useTranslation();
  const {
    selectedCommit,
    selectedFileForSymbolGraph,
    symbolNodes,
    symbolEdges,
    symbolFileContent,
    isLoadingSymbolGraph,
    hasLoadedSymbolGraph,
    symbolGraphError,
    isCodePanelOpen,
    activeSymbolNodeId,
    hoveredSymbolNodeId,
    goBackFromDetail,
    goToSettingsView,
    loadSymbolGraph,
    handleSymbolGraphLoaded,
    handleSymbolGraphLoadFailed,
    openCodePanel,
    closeCodePanel,
    setActiveSymbolNode,
    setHoveredSymbolNode,
  } = useAppStore();
  const isRouteSlotActive = useRouteSlotActive();

  useEffect(() => {
    if (isRouteSlotActive && selectedFileForSymbolGraph && !hasLoadedSymbolGraph && !symbolGraphError) {
      loadSymbolGraph();
    }
  }, [hasLoadedSymbolGraph, isRouteSlotActive, loadSymbolGraph, selectedFileForSymbolGraph, symbolGraphError]);

  useEffect(() => {
    const handler = (event: MessageEvent<{ type: string; payload?: { nodes?: typeof symbolNodes; edges?: typeof symbolEdges; fileContent?: string; message?: string } }>): void => {
      if (event.data.type === 'SYMBOL_GRAPH_LOADED') {
        handleSymbolGraphLoaded({
          nodes: event.data.payload?.nodes ?? [],
          edges: event.data.payload?.edges ?? [],
          fileContent: event.data.payload?.fileContent ?? '',
        });
      }

      if (event.data.type === 'SYMBOL_GRAPH_LOAD_FAILED') {
        handleSymbolGraphLoadFailed(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleSymbolGraphLoaded, handleSymbolGraphLoadFailed, symbolEdges, symbolNodes]);

  const retry = useCallback(() => loadSymbolGraph(), [loadSymbolGraph]);
  const hoveredNode = useMemo(() => symbolNodes.find((node) => node.id === hoveredSymbolNodeId) ?? null, [hoveredSymbolNodeId, symbolNodes]);
  const activeNode = useMemo(() => symbolNodes.find((node) => node.id === activeSymbolNodeId) ?? null, [activeSymbolNodeId, symbolNodes]);
  const [scrollRequestId, setScrollRequestId] = useState(0);
  const highlightedRange = useMemo(
    () => (isCodePanelOpen ? activeNode ?? hoveredNode : null),
    [activeNode, hoveredNode, isCodePanelOpen],
  );
  const scrollToRange = useMemo(
    () => (activeNode ? { start: activeNode.lineStart, end: activeNode.lineEnd } : null),
    [activeNode],
  );

  if (!selectedCommit || !selectedFileForSymbolGraph) return null;

  return (
    <main className="app-shell commit-log-shell dependency-canvas-shell symbol-graph-shell">
      <TopHeader
        title={selectedFileForSymbolGraph.path}
        context={`${selectedCommit.shortHash} · ${t('symbol_graph.symbol_count_context', { count: symbolNodes.length })}`}
        showBackButton
        onBackClick={goBackFromDetail}
        showSettingsIcon
        onSettingsClick={goToSettingsView}
        endSlot={(
          <SplitViewButton
            label={isCodePanelOpen ? t('symbol_graph.code_panel_hide') : t('symbol_graph.code_panel_show')}
            disabled={symbolNodes.length === 0 || Boolean(symbolGraphError) || isLoadingSymbolGraph}
            onClick={() => {
              if (!isCodePanelOpen) {
                openCodePanel();
              } else {
                closeCodePanel();
              }
            }}
          />
        )}
      />
      <ResizableSplitPane
        isOpen={isCodePanelOpen}
        className="symbol-graph-workspace"
        defaultLeftPercent={62}
        left={(
          <div className="symbol-graph-canvas-panel">
          <ReactFlowProvider>
            <SymbolGraph
              symbolNodes={symbolNodes}
              symbolEdges={symbolEdges}
              isLoading={isLoadingSymbolGraph}
              error={symbolGraphError}
              onRetry={retry}
              activeNodeId={activeSymbolNodeId ?? hoveredSymbolNodeId}
              onNodeClick={(nodeId) => {
                setActiveSymbolNode(nodeId);
                setScrollRequestId((current) => current + 1);
              }}
              onNodeHover={(nodeId) => {
                setHoveredSymbolNode(nodeId);
              }}
              onPaneClick={() => {
                setActiveSymbolNode(null);
                setHoveredSymbolNode(null);
              }}
            />
          </ReactFlowProvider>
          </div>
        )}
        right={(
          <SymbolCodePanel
            isOpen={isCodePanelOpen}
            filePath={selectedFileForSymbolGraph.path}
            fileContent={symbolFileContent ?? ''}
            language={selectedFileForSymbolGraph.path}
            highlightRange={highlightedRange ? { start: highlightedRange.lineStart, end: highlightedRange.lineEnd } : null}
            scrollToRange={scrollToRange}
            scrollRequestId={scrollRequestId}
            onClose={closeCodePanel}
          />
        )}
      />
    </main>
  );
};
