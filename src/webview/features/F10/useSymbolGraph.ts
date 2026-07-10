import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { EMPTY_SYMBOL_GRAPH_STATE } from '../../store/slices/symbolGraphSlice';
import type { ChangedFile, SymbolEdge, SymbolNode } from '../../types/commit';

export interface UseSymbolGraphResult {
  selectedFile: ChangedFile | null;
  symbolNodes: SymbolNode[];
  symbolEdges: SymbolEdge[];
  isLoading: boolean;
  error: string | null;
  activeSymbolNodeId: string | null;
  hoveredSymbolNodeId: string | null;
  highlightedRange: SymbolNode | null;
  scrollToRange: { start: number; end: number } | null;
  scrollRequestId: number;
  retrySymbolGraph: () => void;
  handleNodeClick: (nodeId: string) => void;
  handleNodeHover: (nodeId: string | null) => void;
  handlePaneClick: () => void;
}

export function useSymbolGraph(options: { isActive: boolean; tabId: string; selectedFile: ChangedFile | null; commitHash: string | null }): UseSymbolGraphResult {
  const { isActive, tabId, selectedFile, commitHash } = options;
  const symbolState = useAppStore((state) => state.symbolGraphsByTab[tabId] ?? EMPTY_SYMBOL_GRAPH_STATE);
  const prepareSymbolGraphTab = useAppStore((state) => state.prepareSymbolGraphTab);
  const loadSymbolGraph = useAppStore((state) => state.loadSymbolGraph);
  const setActiveSymbolNode = useAppStore((state) => state.setActiveSymbolNode);
  const setHoveredSymbolNode = useAppStore((state) => state.setHoveredSymbolNode);

  const [scrollRequestId, setScrollRequestId] = useState(0);

  useEffect(() => {
    prepareSymbolGraphTab({ tabId, selectedFile });
  }, [prepareSymbolGraphTab, selectedFile, tabId]);

  useEffect(() => {
    if (isActive && selectedFile && commitHash && !symbolState.hasLoaded && !symbolState.error) {
      loadSymbolGraph({ tabId, selectedFile, commitHash });
    }
  }, [commitHash, isActive, loadSymbolGraph, selectedFile, symbolState.error, symbolState.hasLoaded, tabId]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (event: MessageEvent<{ type: string; payload?: { tabId?: string; nodes?: SymbolNode[]; edges?: SymbolEdge[]; message?: string } }>): void => {
      if (event.data.payload?.tabId !== tabId) {
        return;
      }

      if (event.data.type === 'SYMBOL_GRAPH_LOADED') {
        useAppStore.getState().handleSymbolGraphLoaded({
          tabId,
          nodes: event.data.payload?.nodes ?? [],
          edges: event.data.payload?.edges ?? [],
        });
      }

      if (event.data.type === 'SYMBOL_GRAPH_LOAD_FAILED') {
        useAppStore.getState().handleSymbolGraphLoadFailed({
          tabId,
          message: event.data.payload?.message,
        });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isActive, tabId]);

  const retrySymbolGraph = useCallback(() => {
    if (selectedFile && commitHash) {
      loadSymbolGraph({ tabId, selectedFile, commitHash });
    }
  }, [commitHash, loadSymbolGraph, selectedFile, tabId]);

  const hoveredNode = useMemo(
    () => symbolState.symbolNodes.find((node) => node.id === symbolState.hoveredSymbolNodeId) ?? null,
    [symbolState.hoveredSymbolNodeId, symbolState.symbolNodes],
  );
  const activeNode = useMemo(
    () => symbolState.symbolNodes.find((node) => node.id === symbolState.activeSymbolNodeId) ?? null,
    [symbolState.activeSymbolNodeId, symbolState.symbolNodes],
  );
  const highlightedRange = useMemo(
    () => activeNode ?? hoveredNode,
    [activeNode, hoveredNode],
  );
  const scrollToRange = useMemo(
    () => (activeNode ? { start: activeNode.lineStart, end: activeNode.lineEnd } : null),
    [activeNode],
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setActiveSymbolNode(tabId, nodeId);
    setScrollRequestId((current) => current + 1);
  }, [setActiveSymbolNode, tabId]);

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredSymbolNode(tabId, nodeId);
  }, [setHoveredSymbolNode, tabId]);

  const handlePaneClick = useCallback(() => {
    setActiveSymbolNode(tabId, null);
    setHoveredSymbolNode(tabId, null);
  }, [setActiveSymbolNode, setHoveredSymbolNode, tabId]);

  return {
    selectedFile: symbolState.selectedFile,
    symbolNodes: symbolState.symbolNodes,
    symbolEdges: symbolState.symbolEdges,
    isLoading: symbolState.isLoading,
    error: symbolState.error,
    activeSymbolNodeId: symbolState.activeSymbolNodeId,
    hoveredSymbolNodeId: symbolState.hoveredSymbolNodeId,
    highlightedRange,
    scrollToRange,
    scrollRequestId,
    retrySymbolGraph,
    handleNodeClick,
    handleNodeHover,
    handlePaneClick,
  };
}
