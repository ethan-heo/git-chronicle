import '@xyflow/react/dist/style.css';
import { Background, BackgroundVariant, MarkerType, ReactFlow, useNodesState, useReactFlow } from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import type { ChangedFile, DependencyEdge as DependencyEdgeModel } from '../../types/commit';
import { CanvasControls } from './CanvasControls';
import { DependencyEdge } from './DependencyEdge';
import { FileNode } from './FileNode';
import { LegendPanel } from './LegendPanel';
import { buildGraphData, getNearestHandles, getNodeHeight } from './graph';

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
  if (isLoading) {
    return (
      <section className="dependency-canvas-state">
        <LoadingState label="의존 관계를 분석하는 중..." size="lg" />
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
        <EmptyState message="변경된 파일이 없습니다" />
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
  const edges = useMemo(
    () => {
      const geometryByNodeId = new Map(
        nodes.map((node) => [
          node.id,
          {
            x: node.position.x,
            y: node.position.y,
            width: Number(node.style?.width ?? 220),
            height: getNodeHeight(node.id),
          },
        ]),
      );

      return graphEdges.map((edge) => {
        const handles = getNearestHandles(geometryByNodeId.get(edge.source), geometryByNodeId.get(edge.target));

        return {
          ...edge,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
          data: {
            ...edge.data,
            highlighted: highlightedNodeId === edge.source || highlightedNodeId === edge.target,
          },
        };
      });
    },
    [graphEdges, highlightedNodeId, nodes],
  );
  const hasOnlyUnanalyzableFiles = files.every((file) => !/\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx)$/i.test(file.path));

  const fitCanvas = useCallback(() => {
    void fitView({ padding: 0.22, duration: 180 });
  }, [fitView]);

  useEffect(() => {
    setNodes(graphNodes);
  }, [graphNodes, setNodes]);

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
    <section className="dependency-graph" aria-label="의존 관계 그래프" ref={graphRef}>
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
