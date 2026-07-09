import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { EMPTY_SYMBOL_GRAPH_STATE } from '../../store/slices/symbolGraphSlice';
import type { ChangedFile, SymbolEdge, SymbolNode } from '../../types/commit';

export interface UseSymbolGraphResult {
  selectedFile: ChangedFile | null;
  symbolNodes: SymbolNode[];
  symbolEdges: SymbolEdge[];
  symbolFileContent: string | null;
  isLoading: boolean;
  error: string | null;
  isCodePanelOpen: boolean;
  canToggleCodePanel: boolean;
  toggleCodePanel: () => void;
  closeCodePanel: () => void;
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

export function useSymbolGraph(options: { isActive: boolean; paneId: string; selectedFile: ChangedFile | null; commitHash: string | null }): UseSymbolGraphResult {
  const { isActive, paneId, selectedFile, commitHash } = options;
  const symbolState = useAppStore((state) => state.symbolGraphsByPane[paneId] ?? EMPTY_SYMBOL_GRAPH_STATE);
  const prepareSymbolGraphPane = useAppStore((state) => state.prepareSymbolGraphPane);
  const loadSymbolGraph = useAppStore((state) => state.loadSymbolGraph);
  const closeCodePanel = useAppStore((state) => state.closeCodePanel);
  const toggleCodePanel = useAppStore((state) => state.toggleCodePanel);
  const setActiveSymbolNode = useAppStore((state) => state.setActiveSymbolNode);
  const setHoveredSymbolNode = useAppStore((state) => state.setHoveredSymbolNode);

  const [scrollRequestId, setScrollRequestId] = useState(0);

  useEffect(() => {
    prepareSymbolGraphPane({ paneId, selectedFile });
  }, [paneId, prepareSymbolGraphPane, selectedFile]);

  useEffect(() => {
    if (isActive && selectedFile && commitHash && !symbolState.hasLoaded && !symbolState.error) {
      loadSymbolGraph({ paneId, selectedFile, commitHash });
    }
  }, [commitHash, isActive, loadSymbolGraph, paneId, selectedFile, symbolState.error, symbolState.hasLoaded]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (event: MessageEvent<{ type: string; payload?: { paneId?: string; nodes?: SymbolNode[]; edges?: SymbolEdge[]; fileContent?: string; message?: string } }>): void => {
      if (event.data.payload?.paneId !== paneId) {
        return;
      }

      if (event.data.type === 'SYMBOL_GRAPH_LOADED') {
        useAppStore.getState().handleSymbolGraphLoaded({
          paneId,
          nodes: event.data.payload?.nodes ?? [],
          edges: event.data.payload?.edges ?? [],
          fileContent: event.data.payload?.fileContent ?? '',
        });
      }

      if (event.data.type === 'SYMBOL_GRAPH_LOAD_FAILED') {
        useAppStore.getState().handleSymbolGraphLoadFailed({
          paneId,
          message: event.data.payload?.message,
        });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [isActive, paneId]);

  const retrySymbolGraph = useCallback(() => {
    if (selectedFile && commitHash) {
      loadSymbolGraph({ paneId, selectedFile, commitHash });
    }
  }, [commitHash, loadSymbolGraph, paneId, selectedFile]);

  const hoveredNode = useMemo(
    () => symbolState.symbolNodes.find((node) => node.id === symbolState.hoveredSymbolNodeId) ?? null,
    [symbolState.hoveredSymbolNodeId, symbolState.symbolNodes],
  );
  const activeNode = useMemo(
    () => symbolState.symbolNodes.find((node) => node.id === symbolState.activeSymbolNodeId) ?? null,
    [symbolState.activeSymbolNodeId, symbolState.symbolNodes],
  );
  const highlightedRange = useMemo(
    () => (symbolState.isCodePanelOpen ? activeNode ?? hoveredNode : null),
    [activeNode, hoveredNode, symbolState.isCodePanelOpen],
  );
  const scrollToRange = useMemo(
    () => (activeNode ? { start: activeNode.lineStart, end: activeNode.lineEnd } : null),
    [activeNode],
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setActiveSymbolNode(paneId, nodeId);
    setScrollRequestId((current) => current + 1);
  }, [paneId, setActiveSymbolNode]);

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredSymbolNode(paneId, nodeId);
  }, [paneId, setHoveredSymbolNode]);

  const handlePaneClick = useCallback(() => {
    setActiveSymbolNode(paneId, null);
    setHoveredSymbolNode(paneId, null);
  }, [paneId, setActiveSymbolNode, setHoveredSymbolNode]);

  return {
    selectedFile: symbolState.selectedFile,
    symbolNodes: symbolState.symbolNodes,
    symbolEdges: symbolState.symbolEdges,
    symbolFileContent: symbolState.symbolFileContent,
    isLoading: symbolState.isLoading,
    error: symbolState.error,
    isCodePanelOpen: symbolState.isCodePanelOpen,
    canToggleCodePanel: symbolState.symbolNodes.length > 0 && !symbolState.error && !symbolState.isLoading,
    toggleCodePanel: () => toggleCodePanel(paneId),
    closeCodePanel: () => closeCodePanel(paneId),
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
