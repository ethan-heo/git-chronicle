import type { Edge, Node } from '@xyflow/react';
import { graphlib, layout as layoutGraph } from '@dagrejs/dagre';
import type { SymbolDependencyKind, SymbolEdge, SymbolKind, SymbolNode } from '../../types/commit';

export interface SymbolNodeData extends Record<string, unknown> {
  symbolNode: SymbolNode;
  label: string;
  lineRange: string;
}

export type SymbolNodeType = Node<SymbolNodeData, 'symbolNode'>;

export interface SymbolEdgeData extends Record<string, unknown> {
  kind: SymbolDependencyKind;
  highlighted: boolean;
  dimmed: boolean;
}

export type SymbolEdgeType = Edge<SymbolEdgeData, 'symbolEdge'>;

type NodeFace = 'top' | 'right' | 'bottom' | 'left';

interface NodeGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function buildSymbolGraphData(symbolNodes: SymbolNode[], symbolEdges: SymbolEdge[]): { nodes: SymbolNodeType[]; edges: SymbolEdgeType[] } {
  const positions = layoutSymbols(symbolNodes, symbolEdges);
  const geometryById = new Map(
    symbolNodes.map((symbolNode) => {
      const position = positions.get(symbolNode.id) ?? { x: 0, y: 0 };
      return [symbolNode.id, { ...position, width: 240, height: 88 }];
    }),
  );
  return {
    nodes: [
      ...symbolNodes.map((symbolNode) => {
        const position = positions.get(symbolNode.id) ?? { x: 0, y: 0 };
        return {
          id: symbolNode.id,
          type: 'symbolNode',
          position,
          data: { symbolNode, label: symbolNode.name, lineRange: `L${symbolNode.lineStart}–${symbolNode.lineEnd}` },
          draggable: true,
          selectable: true,
        } as SymbolNodeType;
      }),
    ],
    edges: [
      ...symbolEdges.map((edge, index) => {
        const handles = getNearestHandles(geometryById.get(edge.from), geometryById.get(edge.to));
        return {
          id: `symbol-${index}-${edge.from}-${edge.to}`,
          source: edge.from,
          target: edge.to,
          sourceHandle: handles.sourceHandle,
          targetHandle: handles.targetHandle,
          type: 'symbolEdge',
          animated: false,
          data: { kind: edge.kind, highlighted: false, dimmed: false },
        } as SymbolEdgeType;
      }),
    ],
  };
}

export function layoutSymbols(symbolNodes: SymbolNode[], symbolEdges: SymbolEdge[]): Map<string, { x: number; y: number }> {
  if (symbolNodes.length === 0) return new Map();
  if (symbolEdges.length === 0) return layoutByKind(symbolNodes);
  const graph = new graphlib.Graph();
  graph.setGraph({ rankdir: 'LR', nodesep: 70, ranksep: 150, marginx: 40, marginy: 40 });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const node of symbolNodes) graph.setNode(node.id, { width: 240, height: 88 });
  for (const edge of symbolEdges) if (graph.hasNode(edge.from) && graph.hasNode(edge.to)) graph.setEdge(edge.from, edge.to);
  layoutGraph(graph);
  const positions = new Map<string, { x: number; y: number }>();
  for (const node of symbolNodes) {
    const layoutNode = graph.node(node.id) as { x?: number; y?: number } | undefined;
    if (layoutNode?.x === undefined || layoutNode?.y === undefined) continue;
    positions.set(node.id, { x: layoutNode.x - 120, y: layoutNode.y - 44 });
  }
  return normalizePositions(positions);
}

function layoutByKind(symbolNodes: SymbolNode[]): Map<string, { x: number; y: number }> {
  const groups = new Map<SymbolKind, SymbolNode[]>();
  for (const node of symbolNodes) {
    const nodes = groups.get(node.kind) ?? [];
    nodes.push(node);
    groups.set(node.kind, nodes);
  }

  const order: SymbolKind[] = ['function', 'class', 'interface', 'type', 'variable', 'constant', 'enum'];
  const positions = new Map<string, { x: number; y: number }>();
  order.forEach((kind, groupIndex) => {
    (groups.get(kind) ?? []).forEach((node, nodeIndex) => {
      positions.set(node.id, { x: 80 + groupIndex * 210, y: 80 + nodeIndex * 120 });
    });
  });
  return normalizePositions(positions);
}

function normalizePositions(positions: Map<string, { x: number; y: number }>): Map<string, { x: number; y: number }> {
  if (positions.size === 0) return positions;
  const minX = Math.min(...[...positions.values()].map((position) => position.x));
  const minY = Math.min(...[...positions.values()].map((position) => position.y));
  return new Map([...positions.entries()].map(([id, position]) => [id, { x: position.x - minX + 100, y: position.y - minY + 100 }]));
}

function getNearestHandles(source: NodeGeometry | undefined, target: NodeGeometry | undefined): { sourceHandle: string; targetHandle: string } {
  if (!source || !target) {
    return { sourceHandle: getSourceHandleId('right'), targetHandle: getTargetHandleId('left') };
  }

  const sourceCenterX = source.x + source.width / 2;
  const sourceCenterY = source.y + source.height / 2;
  const targetCenterX = target.x + target.width / 2;
  const targetCenterY = target.y + target.height / 2;
  const dx = targetCenterX - sourceCenterX;
  const dy = targetCenterY - sourceCenterY;

  let sourceFace: NodeFace;
  let targetFace: NodeFace;

  if (Math.abs(dx) >= Math.abs(dy)) {
    sourceFace = dx >= 0 ? 'right' : 'left';
    targetFace = dx >= 0 ? 'left' : 'right';
  } else {
    sourceFace = dy >= 0 ? 'bottom' : 'top';
    targetFace = dy >= 0 ? 'top' : 'bottom';
  }

  return { sourceHandle: getSourceHandleId(sourceFace), targetHandle: getTargetHandleId(targetFace) };
}

function getSourceHandleId(face: NodeFace): string {
  return `source-${face}`;
}

function getTargetHandleId(face: NodeFace): string {
  return `target-${face}`;
}
