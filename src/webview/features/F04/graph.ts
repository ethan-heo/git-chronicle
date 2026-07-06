import type { Edge, Node } from '@xyflow/react';
import { graphlib, layout as layoutGraph } from '@dagrejs/dagre';
import type { ChangedFile, DependencyEdge } from '../../types/commit';

export const ANALYZABLE_FILE_PATTERN = /\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx)$/i;

export interface FileNodeData extends Record<string, unknown> {
  file: ChangedFile;
  label: string;
  directory: string;
  canAnalyze: boolean;
  onCodeView: (file: ChangedFile) => void;
}

export type FileNodeType = Node<FileNodeData, 'fileNode'>;

export interface DependencyEdgeData extends Record<string, unknown> {
  kind: 'import' | 'require';
  highlighted: boolean;
  dimmed: boolean;
}

export type DependencyEdgeType = Edge<DependencyEdgeData, 'dependencyEdge'>;

type NodeFace = 'top' | 'right' | 'bottom' | 'left';

interface NodeGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function buildGraphData(
  files: ChangedFile[],
  dependencyEdges: DependencyEdge[],
  handlers: Pick<FileNodeData, 'onCodeView'>,
): { nodes: FileNodeType[]; edges: DependencyEdgeType[] } {
  const nodePathIndex = buildNodePathIndex(files);
  const fullPathKeys = new Set(files.map((file) => normalizePath(file.path)));
  const validEdges = dependencyEdges
    .map((edge) => normalizeDependencyEdge(edge, nodePathIndex, fullPathKeys))
    .filter((edge): edge is DependencyEdge => Boolean(edge));
  const positions = layoutFiles(files, validEdges);
  const geometryByPath = new Map(
    files.map((file) => {
      const position = positions.get(file.path) ?? { x: 0, y: 0 };

      return [
        file.path,
        {
          ...position,
          width: getNodeWidth(file.path),
          height: getNodeHeight(file.path),
        },
      ];
    }),
  );

  return {
    nodes: files.map((file) => {
      const position = positions.get(file.path) ?? { x: 0, y: 0 };
      const label = getFileName(file.path);
      const nodeWidth = getNodeWidth(file.path);

      return {
        id: file.path,
        type: 'fileNode',
        position,
        style: {
          width: nodeWidth,
        },
        data: {
          file,
          label,
          directory: getDirectoryName(file.path),
          canAnalyze: ANALYZABLE_FILE_PATTERN.test(file.path),
          onCodeView: handlers.onCodeView,
        },
      };
    }),
    edges: validEdges.map((edge, index) => {
      const handles = getNearestHandles(geometryByPath.get(edge.from), geometryByPath.get(edge.to));

      return {
        id: `dependency-${index}-${edge.from}-${edge.to}`,
        source: edge.from,
        target: edge.to,
        sourceHandle: handles.sourceHandle,
        targetHandle: handles.targetHandle,
        type: 'dependencyEdge',
        animated: false,
        data: {
          kind: edge.kind,
          highlighted: false,
          dimmed: false,
        },
      };
    }),
  };
}

function normalizeDependencyEdge(
  edge: DependencyEdge,
  nodePathIndex: Map<string, string>,
  fullPathKeys: Set<string>,
): DependencyEdge | null {
  const from = resolveNodePath(edge.from, nodePathIndex, fullPathKeys);
  const to = resolveNodePath(edge.to, nodePathIndex, fullPathKeys);

  if (!from || !to) {
    return null;
  }

  return {
    ...edge,
    from,
    to,
  };
}

export function layoutFiles(files: ChangedFile[], edges: DependencyEdge[]): Map<string, { x: number; y: number }> {
  if (files.length === 0) {
    return new Map();
  }

  if (edges.length === 0) {
    return layoutCompactCluster(files);
  }

  const dagreLayout = layoutWithDagre(files, edges);
  if (dagreLayout.size === 0) {
    return layoutCompactCluster(files);
  }

  const connectedPaths = new Set(edges.flatMap((edge) => [edge.from, edge.to]));
  const isolatedFiles = files.filter((file) => !connectedPaths.has(file.path));
  if (isolatedFiles.length > 0) {
    const isolatedLayout = layoutCompactCluster(isolatedFiles);
    const dagreBottom = Math.max(
      ...[...dagreLayout.entries()].map(([filePath, position]) => position.y + getNodeHeight(filePath)),
    );
    const isolatedTop = Math.min(...[...isolatedLayout.values()].map((position) => position.y));
    const isolatedOffsetY = dagreBottom + 120 - isolatedTop;

    for (const [filePath, position] of isolatedLayout) {
      dagreLayout.set(filePath, {
        x: position.x,
        y: position.y + isolatedOffsetY,
      });
    }
  }

  const minX = Math.min(...[...dagreLayout.values()].map((position) => position.x));
  const minY = Math.min(...[...dagreLayout.values()].map((position) => position.y));
  const margin = 100;

  return new Map(
    [...dagreLayout.entries()].map(([filePath, position]) => [
      filePath,
      {
        x: position.x - minX + margin,
        y: position.y - minY + margin,
      },
    ]),
  );
}

function layoutWithDagre(files: ChangedFile[], edges: DependencyEdge[]): Map<string, { x: number; y: number }> {
  const graph = new graphlib.Graph();
  graph.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    ranksep: 160,
    marginx: 40,
    marginy: 40,
  });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const file of files) {
    graph.setNode(file.path, {
      width: getNodeWidth(file.path),
      height: getNodeHeight(file.path),
    });
  }

  for (const edge of edges) {
    if (graph.hasNode(edge.from) && graph.hasNode(edge.to)) {
      graph.setEdge(edge.from, edge.to);
    }
  }

  layoutGraph(graph);

  const positions = new Map<string, { x: number; y: number }>();
  for (const file of files) {
    const node = graph.node(file.path) as { x?: number; y?: number } | undefined;
    if (node?.x === undefined || node?.y === undefined) {
      continue;
    }

    positions.set(file.path, {
      x: node.x - getNodeWidth(file.path) / 2,
      y: node.y - getNodeHeight(file.path) / 2,
    });
  }

  if (positions.size === 0) {
    return new Map();
  }

  const minX = Math.min(...[...positions.values()].map((position) => position.x));
  const minY = Math.min(...[...positions.values()].map((position) => position.y));
  const margin = 100;

  return new Map(
    [...positions.entries()].map(([filePath, position]) => [
      filePath,
      {
        x: position.x - minX + margin,
        y: position.y - minY + margin,
      },
    ]),
  );
}

function layoutCompactCluster(files: ChangedFile[]): Map<string, { x: number; y: number }> {
  const sortedFiles = [...files].sort((first, second) => compareFilePathForLayout(first.path, second.path));
  const columns = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(sortedFiles.length))));
  const horizontalGap = 48;
  const verticalGap = 40;

  const columnWidths = Array.from({ length: columns }, (_, columnIndex) =>
    Math.max(
      0,
      ...sortedFiles
        .filter((_, index) => index % columns === columnIndex)
        .map((file) => getNodeWidth(file.path)),
    ),
  );

  const rowCount = Math.ceil(sortedFiles.length / columns);
  const rowHeights = Array.from({ length: rowCount }, (_, rowIndex) =>
    Math.max(
      0,
      ...sortedFiles
        .filter((_, index) => Math.floor(index / columns) === rowIndex)
        .map((file) => getNodeHeight(file.path)),
    ),
  );

  const columnOffsets: number[] = [];
  let currentX = 0;
  for (const width of columnWidths) {
    columnOffsets.push(currentX);
    currentX += width + horizontalGap;
  }

  const rowOffsets: number[] = [];
  let currentY = 0;
  for (const height of rowHeights) {
    rowOffsets.push(currentY);
    currentY += height + verticalGap;
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (let index = 0; index < sortedFiles.length; index += 1) {
    const file = sortedFiles[index];
    const columnIndex = index % columns;
    const rowIndex = Math.floor(index / columns);
    const width = getNodeWidth(file.path);
    const height = getNodeHeight(file.path);

    positions.set(file.path, {
      x: columnOffsets[columnIndex] + (columnWidths[columnIndex] - width) / 2,
      y: rowOffsets[rowIndex] + (rowHeights[rowIndex] - height) / 2,
    });
  }

  const margin = 100;
  return new Map(
    [...positions.entries()].map(([filePath, position]) => [
      filePath,
      {
        x: position.x + margin,
        y: position.y + margin,
      },
    ]),
  );
}

function getNodeWidth(filePath: string): number {
  return Math.max(220, Math.min(520, getFileName(filePath).length * 8 + 96));
}

export function getNodeHeight(filePath: string): number {
  const fileName = getFileName(filePath);
  const contentWidth = getNodeWidth(filePath) - 78;
  const estimatedLines = Math.max(1, Math.ceil((fileName.length * 8) / contentWidth));

  return 62 + (estimatedLines - 1) * 17;
}

export function getNearestHandles(
  source: NodeGeometry | undefined,
  target: NodeGeometry | undefined,
): { sourceHandle: string; targetHandle: string } {
  if (!source || !target) {
    return {
      sourceHandle: getSourceHandleId('right'),
      targetHandle: getTargetHandleId('left'),
    };
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

  return {
    sourceHandle: getSourceHandleId(sourceFace),
    targetHandle: getTargetHandleId(targetFace),
  };
}

export function getSourceHandleId(face: NodeFace): string {
  return `source-${face}`;
}

export function getTargetHandleId(face: NodeFace): string {
  return `target-${face}`;
}

function getFileName(filePath: string): string {
  return filePath.split('/').pop() ?? filePath;
}

function getDirectoryName(filePath: string): string {
  const parts = filePath.split('/');
  parts.pop();
  return parts.length > 0 ? `${parts.join('/')}/` : '';
}

export function buildNodePathIndex(files: ChangedFile[]): Map<string, string> {
  const index = new Map<string, string>();
  const fileNameCount = new Map<string, number>();

  for (const file of files) {
    const normalizedPath = normalizePath(file.path);
    const fileName = getFileName(normalizedPath);

    fileNameCount.set(fileName, (fileNameCount.get(fileName) ?? 0) + 1);
    index.set(normalizedPath, file.path);
  }

  for (const file of files) {
    const normalizedPath = normalizePath(file.path);
    const fileName = getFileName(normalizedPath);

    if (fileNameCount.get(fileName) === 1) {
      index.set(fileName, file.path);
    }
  }

  return index;
}

export function resolveNodePath(
  candidatePath: string,
  nodePathIndex: Map<string, string>,
  fullPathKeys: Set<string>,
): string | null {
  const normalizedPath = normalizePath(candidatePath);

  if (nodePathIndex.has(normalizedPath)) {
    return nodePathIndex.get(normalizedPath) ?? null;
  }

  const fileName = getFileName(normalizedPath);
  if (nodePathIndex.has(fileName)) {
    return nodePathIndex.get(fileName) ?? null;
  }

  for (const nodeKey of fullPathKeys) {
    if (normalizedPath === nodeKey || normalizedPath.endsWith(`/${nodeKey}`)) {
      return nodePathIndex.get(nodeKey) ?? null;
    }
  }

  return null;
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

function compareFilePathForLayout(firstPath: string, secondPath: string): number {
  const firstDirectory = getDirectoryName(firstPath);
  const secondDirectory = getDirectoryName(secondPath);
  const directoryOrder = firstDirectory.localeCompare(secondDirectory);

  if (directoryOrder !== 0) {
    return directoryOrder;
  }

  return getFileName(firstPath).localeCompare(getFileName(secondPath));
}
