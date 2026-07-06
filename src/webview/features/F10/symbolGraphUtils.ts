import type { Edge, Node } from '@xyflow/react';
import { graphlib, layout as layoutGraph } from '@dagrejs/dagre';
import type { SymbolDependencyKind, SymbolEdge, SymbolKind, SymbolNode } from '../../types/commit';

export interface SymbolNodeData extends Record<string, unknown> {
  symbolNode: SymbolNode;
  label: string;
  lineRange: string;
  accentColor: string;
  width: number;
  onCopy: (symbolNode: SymbolNode) => void;
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

type SymbolGroup = SymbolKind | 'import';

export function buildSymbolGraphData(
  symbolNodes: SymbolNode[],
  symbolEdges: SymbolEdge[],
  handlers: Pick<SymbolNodeData, 'onCopy'>,
): { nodes: SymbolNodeType[]; edges: SymbolEdgeType[] } {
  const positions = layoutSymbols(symbolNodes, symbolEdges);
  const geometryById = new Map(
    symbolNodes.map((symbolNode) => {
      const position = positions.get(symbolNode.id) ?? { x: 0, y: 0 };
      return [symbolNode.id, { ...position, ...getNodeDimensions(symbolNode) }];
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
          data: {
            symbolNode,
            label: symbolNode.name,
            lineRange: `L${symbolNode.lineStart}–${symbolNode.lineEnd}`,
            accentColor: getSymbolAccentColor(symbolNode),
            width: getNodeDimensions(symbolNode).width,
            onCopy: handlers.onCopy,
          },
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
  for (const node of symbolNodes) {
    const size = getNodeDimensions(node);
    graph.setNode(node.id, {
      width: size.width,
      height: size.height,
      rank: node.nodeCategory === 'import' ? 'min' : undefined,
    });
  }
  for (const edge of symbolEdges) if (graph.hasNode(edge.from) && graph.hasNode(edge.to)) graph.setEdge(edge.from, edge.to);
  layoutGraph(graph);
  const positions = new Map<string, { x: number; y: number }>();
  for (const node of symbolNodes) {
    const layoutNode = graph.node(node.id) as { x?: number; y?: number } | undefined;
    if (layoutNode?.x === undefined || layoutNode?.y === undefined) continue;
    const size = getNodeDimensions(node);
    positions.set(node.id, { x: layoutNode.x - size.width / 2, y: layoutNode.y - size.height / 2 });
  }
  return normalizePositions(positions);
}

function layoutByKind(symbolNodes: SymbolNode[]): Map<string, { x: number; y: number }> {
  const groups = new Map<SymbolGroup, SymbolNode[]>();
  for (const node of symbolNodes) {
    const groupKey: SymbolGroup = node.nodeCategory === 'import' ? 'import' : node.kind;
    const nodes = groups.get(groupKey) ?? [];
    nodes.push(node);
    groups.set(groupKey, nodes);
  }

  const order: SymbolGroup[] = ['import', 'function', 'class', 'interface', 'type', 'variable', 'constant', 'enum'];
  const positions = new Map<string, { x: number; y: number }>();
  order.forEach((kind, groupIndex) => {
    (groups.get(kind) ?? []).forEach((node, nodeIndex) => {
      const size = getNodeDimensions(node);
      positions.set(node.id, { x: 80 + groupIndex * 220, y: 80 + nodeIndex * (size.height + 32) });
    });
  });
  return normalizePositions(positions);
}

function getNodeDimensions(symbolNode: SymbolNode): { width: number; height: number } {
  const width = getNodeWidth(symbolNode);
  if (symbolNode.nodeCategory === 'import') {
    return { width, height: 84 };
  }

  const rowHeight = 18;
  const dividerHeight = 10;
  let height = 84;

  if (symbolNode.signature) {
    height += rowHeight;
  }
  if (symbolNode.typeAnnotation) {
    height += rowHeight;
  }

  const attributes = symbolNode.members?.filter((member) => member.memberKind === 'attribute') ?? [];
  const operations = symbolNode.members?.filter((member) => member.memberKind === 'operation') ?? [];

  if (attributes.length > 0) {
    height += dividerHeight + attributes.length * rowHeight;
  }
  if (operations.length > 0) {
    height += dividerHeight + operations.length * rowHeight;
  }
  if ((symbolNode.enumValues?.length ?? 0) > 0) {
    height += dividerHeight + (symbolNode.enumValues?.length ?? 0) * rowHeight;
  }

  return { width, height };
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

function getSymbolAccentColor(symbolNode: SymbolNode): string {
  if (symbolNode.nodeCategory === 'import') {
    return 'var(--gae-color-symbol-imp)';
  }

  return {
    function: 'var(--gae-color-symbol-function)',
    class: 'var(--gae-color-symbol-class)',
    interface: 'var(--gae-color-symbol-interface)',
    type: 'var(--gae-color-symbol-type)',
    variable: 'var(--gae-color-symbol-variable)',
    constant: 'var(--gae-color-symbol-constant)',
    enum: 'var(--gae-color-symbol-enum)',
  }[symbolNode.kind];
}

function getNodeWidth(symbolNode: SymbolNode): number {
  const minWidth = symbolNode.nodeCategory === 'import' ? 208 : symbolNode.kind === 'function' ? 248 : 232;
  const horizontalPadding = symbolNode.nodeCategory === 'import' ? 52 : 56;
  const charWidth = 7.4;
  const candidateLines: string[] = [symbolNode.name];

  if (symbolNode.modulePath) {
    candidateLines.push(symbolNode.modulePath);
  }
  if (symbolNode.signature) {
    candidateLines.push(symbolNode.signature);
  }
  if (symbolNode.typeAnnotation) {
    candidateLines.push(symbolNode.typeAnnotation);
  }
  for (const member of symbolNode.members ?? []) {
    candidateLines.push(formatMemberLine(member));
  }
  for (const enumValue of symbolNode.enumValues ?? []) {
    candidateLines.push(enumValue);
  }

  const longestLine = candidateLines.reduce((max, current) => Math.max(max, current.length), 0);
  const estimatedWidth = Math.ceil(longestLine * charWidth + horizontalPadding);
  return Math.max(minWidth, estimatedWidth);
}

function formatMemberLine(member: NonNullable<SymbolNode['members']>[number]): string {
  const name = `${member.name}${member.isOptional ? '?' : ''}`;
  if (member.memberKind === 'operation') {
    return `${member.visibility} ${name}(${member.params ?? ''})${member.type ? `: ${member.type}` : ''}`;
  }

  return `${member.visibility} ${name}${member.type ? `: ${member.type}` : ''}`;
}
