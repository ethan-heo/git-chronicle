import '@xyflow/react/dist/style.css';
import { Background, BackgroundVariant, MarkerType, ReactFlow, useEdgesState, useNodesInitialized, useNodesState, useReactFlow } from '@xyflow/react';
import { useEffect, useMemo, useRef, useState, type FC } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import { CanvasControls } from '../F04/CanvasControls';
import { buildSymbolGraphData } from './symbolGraphUtils';
import { SymbolEdge } from './SymbolEdge';
import { SymbolLegendPanel } from './SymbolLegendPanel';
import { SymbolNode } from './SymbolNode';
import type { SymbolEdge as SymbolEdgeModel, SymbolNode as SymbolNodeModel } from '../../types/commit';

interface Props {
  symbolNodes: SymbolNodeModel[];
  symbolEdges: SymbolEdgeModel[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  activeNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
}

const nodeTypes = { symbolNode: SymbolNode };
const edgeTypes = { symbolEdge: SymbolEdge };

export const SymbolGraph: FC<Props> = ({ symbolNodes, symbolEdges, isLoading, error, onRetry, activeNodeId, onNodeClick, onNodeHover }) => {
  if (isLoading) return <section className="dependency-canvas-state"><LoadingState label="심볼을 분석하는 중..." size="lg" /></section>;
  if (error) return <section className="dependency-canvas-state"><ErrorState message={error} onRetry={onRetry} /></section>;
  if (symbolNodes.length === 0) return <section className="dependency-canvas-state"><EmptyState message="분석 가능한 심볼이 없습니다" /></section>;
  return <SymbolGraphCanvas symbolNodes={symbolNodes} symbolEdges={symbolEdges} activeNodeId={activeNodeId} onNodeClick={onNodeClick} onNodeHover={onNodeHover} />;
};

const SymbolGraphCanvas: FC<Pick<Props, 'symbolNodes' | 'symbolEdges' | 'activeNodeId' | 'onNodeClick' | 'onNodeHover'>> = ({ symbolNodes, symbolEdges, activeNodeId, onNodeClick, onNodeHover }) => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [isLegendMinimized, setIsLegendMinimized] = useState(true);
  const nodesInitialized = useNodesInitialized();
  const { nodes: graphNodes, edges: graphEdges } = useMemo(() => buildSymbolGraphData(symbolNodes, symbolEdges), [symbolEdges, symbolNodes]);
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

  return (
    <section className="dependency-graph symbol-graph" aria-label="파일 내부 심볼 의존성 그래프">
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
        defaultEdgeOptions={{ markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: 'var(--gae-color-text-secondary)' } }}
        onNodeMouseEnter={(_, node) => {
          setHighlightedNodeId(node.id);
          onNodeHover?.(node.id);
        }}
        onNodeMouseLeave={() => {
          setHighlightedNodeId(null);
          onNodeHover?.(null);
        }}
        onNodeClick={(_, node) => onNodeClick?.(node.id)}
        onPaneClick={() => {
          setHighlightedNodeId(null);
          onNodeHover?.(null);
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} />
      </ReactFlow>
      <CanvasControls onZoomIn={() => void zoomIn({ duration: 120 })} onZoomOut={() => void zoomOut({ duration: 120 })} onFitView={() => void fitView({ padding: 0.22, duration: 180 })} />
      <SymbolLegendPanel isMinimized={isLegendMinimized} onToggleMinimized={() => setIsLegendMinimized((current) => !current)} />
    </section>
  );
};
