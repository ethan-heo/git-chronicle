import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/appStore';
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

export function useSymbolGraph(options: { isActive: boolean }): UseSymbolGraphResult {
  const { isActive } = options;
  const selectedFile = useAppStore((state) => state.selectedFileForSymbolGraph);
  const symbolNodes = useAppStore((state) => state.symbolNodes);
  const symbolEdges = useAppStore((state) => state.symbolEdges);
  const symbolFileContent = useAppStore((state) => state.symbolFileContent);
  const isLoadingSymbolGraph = useAppStore((state) => state.isLoadingSymbolGraph);
  const hasLoadedSymbolGraph = useAppStore((state) => state.hasLoadedSymbolGraph);
  const symbolGraphError = useAppStore((state) => state.symbolGraphError);
  const isCodePanelOpen = useAppStore((state) => state.isCodePanelOpen);
  const activeSymbolNodeId = useAppStore((state) => state.activeSymbolNodeId);
  const hoveredSymbolNodeId = useAppStore((state) => state.hoveredSymbolNodeId);
  const loadSymbolGraph = useAppStore((state) => state.loadSymbolGraph);
  const closeCodePanel = useAppStore((state) => state.closeCodePanel);
  const toggleCodePanel = useAppStore((state) => state.toggleCodePanel);
  const setActiveSymbolNode = useAppStore((state) => state.setActiveSymbolNode);
  const setHoveredSymbolNode = useAppStore((state) => state.setHoveredSymbolNode);

  const [scrollRequestId, setScrollRequestId] = useState(0);

  useEffect(() => {
    if (isActive && selectedFile && !hasLoadedSymbolGraph && !symbolGraphError) {
      loadSymbolGraph();
    }
  }, [hasLoadedSymbolGraph, isActive, loadSymbolGraph, selectedFile, symbolGraphError]);

  const retrySymbolGraph = useCallback(() => loadSymbolGraph(), [loadSymbolGraph]);

  const hoveredNode = useMemo(
    () => symbolNodes.find((node) => node.id === hoveredSymbolNodeId) ?? null,
    [hoveredSymbolNodeId, symbolNodes],
  );
  const activeNode = useMemo(
    () => symbolNodes.find((node) => node.id === activeSymbolNodeId) ?? null,
    [activeSymbolNodeId, symbolNodes],
  );
  const highlightedRange = useMemo(
    () => (isCodePanelOpen ? activeNode ?? hoveredNode : null),
    [activeNode, hoveredNode, isCodePanelOpen],
  );
  const scrollToRange = useMemo(
    () => (activeNode ? { start: activeNode.lineStart, end: activeNode.lineEnd } : null),
    [activeNode],
  );

  const handleNodeClick = useCallback((nodeId: string) => {
    setActiveSymbolNode(nodeId);
    setScrollRequestId((current) => current + 1);
  }, [setActiveSymbolNode]);

  const handleNodeHover = useCallback((nodeId: string | null) => {
    setHoveredSymbolNode(nodeId);
  }, [setHoveredSymbolNode]);

  const handlePaneClick = useCallback(() => {
    setActiveSymbolNode(null);
    setHoveredSymbolNode(null);
  }, [setActiveSymbolNode, setHoveredSymbolNode]);

  return {
    selectedFile,
    symbolNodes,
    symbolEdges,
    symbolFileContent,
    isLoading: isLoadingSymbolGraph,
    error: symbolGraphError,
    isCodePanelOpen,
    canToggleCodePanel: symbolNodes.length > 0 && !symbolGraphError && !isLoadingSymbolGraph,
    toggleCodePanel,
    closeCodePanel,
    activeSymbolNodeId,
    hoveredSymbolNodeId,
    highlightedRange,
    scrollToRange,
    scrollRequestId,
    retrySymbolGraph,
    handleNodeClick,
    handleNodeHover,
    handlePaneClick,
  };
}
