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

interface DependencyGraphProps {
  files: ChangedFile[];
  dependencyEdges: DependencyEdgeModel[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onFileCodeView: (file: ChangedFile) => void;
  onFileAISummary: (file: ChangedFile) => void;
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
}) => {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <section className="dependency-canvas-state">
        <LoadingState label={t('dependency.loading')} size="lg" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="dependency-canvas-state">
        <ErrorState message={error} onRetry={onRetry} />
      </section>
    );
  }

  if (files.length === 0) {
    return (
      <section className="dependency-canvas-state">
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
    />
  );
};

const DependencyGraphCanvas: FC<Omit<DependencyGraphProps, 'isLoading' | 'error' | 'onRetry'>> = ({
  files,
  dependencyEdges,
  onFileCodeView,
  onFileAISummary,
}) => {
  const { t } = useTranslation();
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const graphRef = useRef<HTMLElement | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const { nodes: graphNodes, edges: graphEdges } = useMemo(
    () =>
      buildGraphData(files, dependencyEdges, {
        onCodeView: onFileCodeView,
        onAISummary: onFileAISummary,
      }),
    [dependencyEdges, files, onFileAISummary, onFileCodeView],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(graphEdges);
  const hasOnlyUnanalyzableFiles = files.every((file) => !/\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx)$/i.test(file.path));

  const fitCanvas = useCallback(() => {
    void fitView({ padding: 0.22, duration: 180 });
  }, [fitView]);

  useEffect(() => {
    setNodes(graphNodes);
  }, [graphNodes, setNodes]);

  useEffect(() => {
    const isHovering = highlightedNodeId !== null;
    const updatedEdges = graphEdges.map((edge) => {
      const highlighted = highlightedNodeId === edge.source || highlightedNodeId === edge.target;

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
  }, [graphEdges, highlightedNodeId, setEdges]);

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
    <section className="dependency-graph" aria-label={t('dependency.graph_aria')} ref={graphRef}>
      {hasOnlyUnanalyzableFiles ? <div className="dependency-canvas-notice">JS/TS 외 파일은 노드로만 표시됩니다.</div> : null}
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
        onNodeMouseEnter={(_, node) => setHighlightedNodeId((currentNodeId) => (currentNodeId === node.id ? currentNodeId : node.id))}
        onNodeMouseLeave={(_, node) => setHighlightedNodeId((currentNodeId) => (currentNodeId === node.id ? null : currentNodeId))}
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} />
      </ReactFlow>
      <CanvasControls onZoomIn={() => void zoomIn({ duration: 120 })} onZoomOut={() => void zoomOut({ duration: 120 })} onFitView={fitCanvas} />
      <LegendPanel />
    </section>
  );
};
