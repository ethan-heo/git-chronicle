import '@xyflow/react/dist/style.css';
import { Background, BackgroundVariant, MarkerType, ReactFlow, useEdgesState, useNodesState, useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import type { ChangedFile, DependencyEdge as DependencyEdgeModel } from '../../types/commit';
import { CanvasControls } from './CanvasControls';
import { DependencyEdge } from './DependencyEdge';
import { FileNode } from './FileNode';
import { LegendPanel } from './LegendPanel';
import { buildGraphData } from './graph';
import './DependencyGraph.css';

interface DependencyGraphProps {
  files: ChangedFile[];
  dependencyEdges: DependencyEdgeModel[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onFileCodeView: (file: ChangedFile) => void;
  onFileAISummary: (file: ChangedFile) => void;
  onFileSymbolGraph?: (file: ChangedFile) => void;
}

const nodeTypes = {
  fileNode: FileNode,
};

const edgeTypes = {
  dependencyEdge: DependencyEdge,
};

export const DependencyGraph: FC<DependencyGraphProps> = ({
  files,
  dependencyEdges,
  isLoading,
  error,
  onRetry,
  onFileCodeView,
  onFileAISummary,
  onFileSymbolGraph,
}) => {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center p-8">
        <LoadingState label={t('dependency.loading')} size="lg" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center p-8">
        <ErrorState message={error} onRetry={onRetry} />
      </section>
    );
  }

  if (files.length === 0) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center p-8">
        <EmptyState message={t('dependency.empty')} />
      </section>
    );
  }

  return (
    <DependencyGraphCanvas
      files={files}
      dependencyEdges={dependencyEdges}
      onFileCodeView={onFileCodeView}
      onFileAISummary={onFileAISummary}
      onFileSymbolGraph={onFileSymbolGraph}
    />
  );
};

const DependencyGraphCanvas: FC<Omit<DependencyGraphProps, 'isLoading' | 'error' | 'onRetry'>> = ({
  files,
  dependencyEdges,
  onFileCodeView,
  onFileAISummary,
  onFileSymbolGraph,
}) => {
  const { t } = useTranslation();
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const graphRef = useRef<HTMLElement | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const { nodes: graphNodes, edges: graphEdges } = useMemo(
    () =>
        buildGraphData(files, dependencyEdges, {
          onCodeView: onFileCodeView,
          onAISummary: onFileAISummary,
          onSymbolGraph: onFileSymbolGraph,
        }),
    [dependencyEdges, files, onFileAISummary, onFileCodeView, onFileSymbolGraph],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);
  const hasOnlyUnanalyzableFiles = files.every((file) => !/\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx)$/i.test(file.path));
  const activeNodeIds = useMemo(() => {
    const nodeIds = [selectedNodeId, highlightedNodeId].filter((nodeId): nodeId is string => Boolean(nodeId));

    return new Set(nodeIds);
  }, [highlightedNodeId, selectedNodeId]);

  const fitCanvas = useCallback(() => {
    void fitView({ padding: 0.22, duration: 180 });
  }, [fitView]);

  useEffect(() => {
    setNodes(graphNodes);
  }, [graphNodes, setNodes]);

  useEffect(() => {
    const isHovering = activeNodeIds.size > 0;
    const updatedEdges = graphEdges.map((edge) => {
      const highlighted = activeNodeIds.has(edge.source);

      return {
        ...edge,
        data: {
          ...(edge.data ?? {}),
          highlighted,
          dimmed: isHovering && !highlighted,
          kind: edge.data?.kind ?? 'import',
        },
      };
    });

    setEdges([
      ...updatedEdges.filter((edge) => !edge.data?.highlighted),
      ...updatedEdges.filter((edge) => edge.data?.highlighted),
    ]);
  }, [activeNodeIds, graphEdges, setEdges]);

  useEffect(() => {
    window.setTimeout(fitCanvas, 0);
  }, [fitCanvas, files, dependencyEdges]);

  useEffect(() => {
    if (!graphRef.current || typeof ResizeObserver === 'undefined') {
      return;
    }

    let timer: number | undefined;
    const observer = new ResizeObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(fitCanvas, 120);
    });

    observer.observe(graphRef.current);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [fitCanvas]);

  return (
    <section className="dependency-graph relative min-h-0 flex-1 overflow-hidden bg-surface" aria-label={t('dependency.graph_aria')} ref={graphRef}>
      {hasOnlyUnanalyzableFiles ? (
        <div className="absolute top-3 left-3 z-[5] rounded-sm border border-line border-l-[3px] border-l-warning bg-elevated px-[11px] py-[7px] text-[11px] text-muted">
          JS/TS 외 파일은 노드로만 표시됩니다.
        </div>
      ) : null}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable
        onNodesChange={onNodesChange}
        fitView
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        onEdgesChange={onEdgesChange}
        defaultEdgeOptions={{
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: 'var(--gae-color-text-secondary)',
          },
        }}
        onNodeClick={(_, node) => setSelectedNodeId((currentNodeId) => (currentNodeId === node.id ? null : node.id))}
        onNodeMouseEnter={(_, node) => setHighlightedNodeId((currentNodeId) => (currentNodeId === node.id ? currentNodeId : node.id))}
        onNodeMouseLeave={(_, node) => setHighlightedNodeId((currentNodeId) => (currentNodeId === node.id ? null : currentNodeId))}
        onPaneClick={() => setSelectedNodeId(null)}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} />
      </ReactFlow>
      <CanvasControls onZoomIn={() => void zoomIn({ duration: 120 })} onZoomOut={() => void zoomOut({ duration: 120 })} onFitView={fitCanvas} />
      <LegendPanel />
    </section>
  );
};
