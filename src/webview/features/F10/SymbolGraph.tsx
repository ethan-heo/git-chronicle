import '@xyflow/react/dist/style.css';
import { Background, BackgroundVariant, ReactFlow, useEdgesState, useNodesInitialized, useNodesState, useReactFlow } from '@xyflow/react';
import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import { useAppStore } from '../../store/appStore';
import { CanvasControls } from '../F04/CanvasControls';
import { CopyMarkdownButton, symbolSelectionToMermaid } from '../F11';
import { buildSymbolGraphData } from './symbolGraphUtils';
import { SymbolEdge } from './SymbolEdge';
import { SymbolLegendPanel } from './SymbolLegendPanel';
import { SymbolNode } from './SymbolNode';
import type { SymbolEdge as SymbolEdgeModel, SymbolNode as SymbolNodeModel } from '../../types/commit';
import './SymbolGraph.css';

interface Props {
  symbolNodes: SymbolNodeModel[];
  symbolEdges: SymbolEdgeModel[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  activeNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  onPaneClick?: () => void;
}

const nodeTypes = { symbolNode: SymbolNode };
const edgeTypes = { symbolEdge: SymbolEdge };

function collectConnectedSelection(
  nodeId: string,
  symbolNodes: SymbolNodeModel[],
  symbolEdges: SymbolEdgeModel[],
): { nodes: SymbolNodeModel[]; edges: SymbolEdgeModel[] } {
  const connectedEdges = symbolEdges.filter((edge) => edge.from === nodeId);
  const relatedNodeIds = new Set([nodeId, ...connectedEdges.map((edge) => edge.to)]);

  return {
    nodes: symbolNodes.filter((node) => relatedNodeIds.has(node.id)),
    edges: connectedEdges,
  };
}

export const SymbolGraph: FC<Props> = ({ symbolNodes, symbolEdges, isLoading, error, onRetry, activeNodeId, onNodeClick, onNodeHover, onPaneClick }) => {
  const { t } = useTranslation();

  if (isLoading) return <section className="flex min-h-0 flex-1 items-center justify-center p-8"><LoadingState label={t('symbol_graph.loading')} size="lg" /></section>;
  if (error) return <section className="flex min-h-0 flex-1 items-center justify-center p-8"><ErrorState message={error} onRetry={onRetry} /></section>;
  if (symbolNodes.length === 0) return <section className="flex min-h-0 flex-1 items-center justify-center p-8"><EmptyState message={t('symbol_graph.empty')} /></section>;
  return (
    <SymbolGraphCanvas
      symbolNodes={symbolNodes}
      symbolEdges={symbolEdges}
      activeNodeId={activeNodeId}
      onNodeClick={onNodeClick}
      onNodeHover={onNodeHover}
      onPaneClick={onPaneClick}
    />
  );
};

const SymbolGraphCanvas: FC<Pick<Props, 'symbolNodes' | 'symbolEdges' | 'activeNodeId' | 'onNodeClick' | 'onNodeHover' | 'onPaneClick'>> = ({ symbolNodes, symbolEdges, activeNodeId, onNodeClick, onNodeHover, onPaneClick }) => {
  const { t } = useTranslation();
  const pushToast = useAppStore((state) => state.pushToast);
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [isLegendMinimized, setIsLegendMinimized] = useState(true);
  const [selectedEdgeIds, setSelectedEdgeIds] = useState<string[]>([]);
  const nodesInitialized = useNodesInitialized();
  const symbolNodeMermaidCopiedToast = t('toast.symbol_node_mermaid_copied');
  const { nodes: graphNodes, edges: graphEdges } = useMemo(
    () =>
      buildSymbolGraphData(symbolNodes, symbolEdges, {
        onCopy: (symbolNode) => {
          const selection = collectConnectedSelection(symbolNode.id, symbolNodes, symbolEdges);
          void navigator.clipboard.writeText(symbolSelectionToMermaid(selection.nodes, selection.edges));
          pushToast(symbolNodeMermaidCopiedToast, 'success');
        },
      }),
    [pushToast, symbolEdges, symbolNodeMermaidCopiedToast, symbolNodes],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);
  const fittedGraphKeyRef = useRef<string | null>(null);

  useEffect(() => setNodes(graphNodes), [graphNodes, setNodes]);
  useEffect(() => {
    const highlight = new Set([highlightedNodeId, activeNodeId].filter(Boolean) as string[]);
    setEdges(graphEdges.map((edge) => ({ ...edge, data: { ...(edge.data ?? {}), highlighted: highlight.has(edge.source), dimmed: highlight.size > 0 && !highlight.has(edge.source), kind: edge.data?.kind ?? 'uses' } })));
  }, [activeNodeId, graphEdges, highlightedNodeId, setEdges]);
  useEffect(() => {
    if (!nodesInitialized || nodes.length === 0) {
      return;
    }

    const graphKey = `${nodes.length}:${edges.length}`;
    if (fittedGraphKeyRef.current === graphKey) {
      return;
    }

    fittedGraphKeyRef.current = graphKey;
    window.setTimeout(() => void fitView({ padding: 0.22, duration: 180 }), 0);
  }, [edges.length, fitView, nodes.length, nodesInitialized]);
  const selectedEdgesForCopy = useMemo(() => {
    return graphEdges
      .filter((edge) => selectedEdgeIds.includes(edge.id))
      .map((edge) => ({
        from: edge.source,
        to: edge.target,
        kind: (edge.data?.kind ?? 'uses') as SymbolEdgeModel['kind'],
      }));
  }, [graphEdges, selectedEdgeIds]);

  return (
    <section className="dependency-graph symbol-graph relative min-h-0 flex-1 overflow-hidden bg-surface" aria-label={t('symbol_graph.graph_aria')}>
      {selectedEdgesForCopy.length > 0 ? (
        <div className="absolute top-3 right-3 z-[6]">
          <CopyMarkdownButton
            className="opacity-100"
            onClick={() => {
              void navigator.clipboard.writeText(symbolSelectionToMermaid([], selectedEdgesForCopy));
              pushToast(t('toast.graph_mermaid_copied'), 'success');
            }}
          />
        </div>
      ) : null}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onNodeMouseEnter={(_, node) => {
          setHighlightedNodeId(node.id);
          onNodeHover?.(node.id);
        }}
        onNodeMouseLeave={() => {
          setHighlightedNodeId(null);
          onNodeHover?.(null);
        }}
        onNodeClick={(_, node) => onNodeClick?.(node.id)}
        onEdgeClick={(_, edge) => setSelectedEdgeIds((current) => (current.includes(edge.id) ? current.filter((id) => id !== edge.id) : [...current, edge.id]))}
        onPaneClick={() => {
          setHighlightedNodeId(null);
          setSelectedEdgeIds([]);
          onNodeHover?.(null);
          onPaneClick?.();
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} />
      </ReactFlow>
      <CanvasControls onZoomIn={() => void zoomIn({ duration: 120 })} onZoomOut={() => void zoomOut({ duration: 120 })} onFitView={() => void fitView({ padding: 0.22, duration: 180 })} />
      <SymbolLegendPanel isMinimized={isLegendMinimized} onToggleMinimized={() => setIsLegendMinimized((current) => !current)} />
    </section>
  );
};
