import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useEffect, type FC } from 'react';
import { TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import { SymbolGraph } from './SymbolGraph';

export const S08IntraFileSymbolDependencyCanvasScreen: FC = () => {
  const {
    selectedCommit,
    selectedFileForSymbolGraph,
    symbolNodes,
    symbolEdges,
    isLoadingSymbolGraph,
    hasLoadedSymbolGraph,
    symbolGraphError,
    goBackFromDetail,
    goToSettingsView,
    loadSymbolGraph,
    handleSymbolGraphLoaded,
    handleSymbolGraphLoadFailed,
  } = useAppStore();
  const isRouteSlotActive = useRouteSlotActive();

  useEffect(() => {
    if (isRouteSlotActive && selectedFileForSymbolGraph && !hasLoadedSymbolGraph && !symbolGraphError) {
      loadSymbolGraph();
    }
  }, [hasLoadedSymbolGraph, isRouteSlotActive, loadSymbolGraph, selectedFileForSymbolGraph, symbolGraphError]);

  useEffect(() => {
    const handler = (event: MessageEvent<{ type: string; payload?: { nodes?: typeof symbolNodes; edges?: typeof symbolEdges; message?: string } }>): void => {
      if (event.data.type === 'SYMBOL_GRAPH_LOADED') handleSymbolGraphLoaded({ nodes: event.data.payload?.nodes ?? [], edges: event.data.payload?.edges ?? [] });
      if (event.data.type === 'SYMBOL_GRAPH_LOAD_FAILED') handleSymbolGraphLoadFailed(event.data.payload?.message);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleSymbolGraphLoaded, handleSymbolGraphLoadFailed]);

  const retry = useCallback(() => loadSymbolGraph(), [loadSymbolGraph]);

  if (!selectedCommit || !selectedFileForSymbolGraph) return null;

  return (
    <main className="app-shell commit-log-shell dependency-canvas-shell">
      <TopHeader
        title={selectedFileForSymbolGraph.path}
        context={`${selectedCommit.shortHash} · 심볼 ${symbolNodes.length}개`}
        showBackButton
        onBackClick={goBackFromDetail}
        showSettingsIcon
        onSettingsClick={goToSettingsView}
      />
      <ReactFlowProvider>
        <SymbolGraph symbolNodes={symbolNodes} symbolEdges={symbolEdges} isLoading={isLoadingSymbolGraph} error={symbolGraphError} onRetry={retry} />
      </ReactFlowProvider>
    </main>
  );
};
