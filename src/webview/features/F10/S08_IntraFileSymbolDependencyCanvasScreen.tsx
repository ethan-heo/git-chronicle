import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ResizableSplitPane, TopHeader } from '../../shared/components';
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
    <main className="app-shell flex h-screen min-h-0 flex-col overflow-hidden bg-surface">
      <TopHeader
        title={selectedFileForSymbolGraph.path}
        context={`${selectedCommit.shortHash} · ${t('symbol_graph.symbol_count_context', { count: symbolNodes.length })}`}
        showBackButton
        onBackClick={goBackFromDetail}
        showSettingsIcon
        onSettingsClick={goToSettingsView}
        endSlot={(
          <button
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm bg-transparent text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-45"
            type="button"
            aria-label={isCodePanelOpen ? t('symbol_graph.code_panel_hide') : t('symbol_graph.code_panel_show')}
            title={isCodePanelOpen ? t('symbol_graph.code_panel_hide') : t('symbol_graph.code_panel_show')}
            disabled={symbolNodes.length === 0 || Boolean(symbolGraphError) || isLoadingSymbolGraph}
            onClick={() => {
              if (!isCodePanelOpen) {
                openCodePanel();
              } else {
                closeCodePanel();
              }
            }}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <rect x="1.6" y="2" width="4.9" height="12" rx="1.1" />
              <rect x="9.5" y="2" width="4.9" height="12" rx="1.1" />
            </svg>
          </button>
        )}
      />
      <ResizableSplitPane
        isOpen={isCodePanelOpen}
        className="flex-1 min-h-0"
        defaultLeftPercent={62}
        left={(
          <div className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden">
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
