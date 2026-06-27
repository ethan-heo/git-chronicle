import type { Edge, Node } from '@xyflow/react';
import type { ChangedFile, DependencyEdge } from '../../types/commit';

export const ANALYZABLE_FILE_PATTERN = /\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx)$/i;

export interface FileNodeData extends Record<string, unknown> {
  file: ChangedFile;
  label: string;
  directory: string;
  canAnalyze: boolean;
  onCodeView: (file: ChangedFile) => void;
  onAISummary: (file: ChangedFile) => void;
}

export type FileNodeType = Node<FileNodeData, 'fileNode'>;

export interface DependencyEdgeData extends Record<string, unknown> {
  kind: 'import' | 'require';
  highlighted: boolean;
}

export type DependencyEdgeType = Edge<DependencyEdgeData, 'dependencyEdge'>;

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function buildGraphData(
  files: ChangedFile[],
  dependencyEdges: DependencyEdge[],
  handlers: Pick<FileNodeData, 'onCodeView' | 'onAISummary'>,
): { nodes: FileNodeType[]; edges: DependencyEdgeType[] } {
  const changedFileSet = new Set(files.map((file) => file.path));
  const validEdges = dependencyEdges.filter((edge) => changedFileSet.has(edge.from) && changedFileSet.has(edge.to));
  const positions = layoutFiles(files, validEdges);

  return {
    nodes: files.map((file) => {
      const position = positions.get(file.path) ?? { x: 0, y: 0 };
      const label = getFileName(file.path);

      return {
        id: file.path,
        type: 'fileNode',
        position,
        data: {
          file,
          label,
          directory: getDirectoryName(file.path),
          canAnalyze: ANALYZABLE_FILE_PATTERN.test(file.path),
          onCodeView: handlers.onCodeView,
          onAISummary: handlers.onAISummary,
        },
      };
    }),
    edges: validEdges.map((edge, index) => ({
      id: `dependency-${index}-${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      type: 'dependencyEdge',
      animated: false,
      data: {
        kind: edge.kind,
        highlighted: false,
      },
    })),
  };
}

function layoutFiles(files: ChangedFile[], edges: DependencyEdge[]): Map<string, { x: number; y: number }> {
  const centerX = 440;
  const centerY = 280;
  const nodes: LayoutNode[] = files.map((file, index) => {
    const angle = (index / Math.max(files.length, 1)) * Math.PI * 2;
    const radius = 170 + seededNumber(file.path) * 80;

    return {
      id: file.path,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      width: getNodeWidth(file.path),
      height: 58,
    };
  });
  const indexById = new Map(nodes.map((node, index) => [node.id, index]));
  const forceEdges = edges
    .map((edge) => {
      const source = indexById.get(edge.from);
      const target = indexById.get(edge.to);

      return source === undefined || target === undefined ? null : { source, target };
    })
    .filter((edge): edge is { source: number; target: number } => Boolean(edge));

  for (let iteration = 0; iteration < 360; iteration += 1) {
    const temperature = 1 - iteration / 360;

    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const first = nodes[i];
        const second = nodes[j];
        let dx = second.x - first.x;
        let dy = second.y - first.y;
        let distanceSquared = dx * dx + dy * dy;

        if (distanceSquared < 1) {
          dx = seededNumber(`${first.id}:${second.id}`) - 0.5;
          dy = seededNumber(`${second.id}:${first.id}`) - 0.5;
          distanceSquared = 1;
        }

        const distance = Math.sqrt(distanceSquared);
        const force = 42000 / distanceSquared;
        const moveX = (dx / distance) * force;
        const moveY = (dy / distance) * force;

        first.x -= moveX * temperature;
        first.y -= moveY * temperature;
        second.x += moveX * temperature;
        second.y += moveY * temperature;
      }
    }

    for (const edge of forceEdges) {
      const source = nodes[edge.source];
      const target = nodes[edge.target];
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const preferredDistance = 230;
      const force = (distance - preferredDistance) * 0.035;
      const moveX = (dx / distance) * force;
      const moveY = (dy / distance) * force;

      source.x += moveX;
      source.y += moveY;
      target.x -= moveX;
      target.y -= moveY;
    }

    for (const node of nodes) {
      node.x += (centerX - node.x) * 0.018;
      node.y += (centerY - node.y) * 0.018;
    }
  }

  for (let pass = 0; pass < 70; pass += 1) {
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const first = nodes[i];
        const second = nodes[j];
        const minX = (first.width + second.width) / 2 + 34;
        const minY = (first.height + second.height) / 2 + 34;
        const dx = second.x - first.x;
        const dy = second.y - first.y;
        const overlapX = minX - Math.abs(dx);
        const overlapY = minY - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const offset = ((dx < 0 ? -1 : 1) * overlapX) / 2;
            first.x -= offset;
            second.x += offset;
          } else {
            const offset = ((dy < 0 ? -1 : 1) * overlapY) / 2;
            first.y -= offset;
            second.y += offset;
          }
        }
      }
    }
  }

  const positions = new Map<string, { x: number; y: number }>();
  const minX = Math.min(...nodes.map((node) => node.x - node.width / 2));
  const minY = Math.min(...nodes.map((node) => node.y - node.height / 2));
  const margin = 60;

  nodes.forEach((node) => {
    positions.set(node.id, {
      x: node.x - node.width / 2 - minX + margin,
      y: node.y - node.height / 2 - minY + margin,
    });
  });

  return positions;
}

function getNodeWidth(filePath: string): number {
  return Math.max(170, Math.min(240, getFileName(filePath).length * 8 + 70));
}

function getFileName(filePath: string): string {
  return filePath.split('/').pop() ?? filePath;
}

function getDirectoryName(filePath: string): string {
  const parts = filePath.split('/');
  parts.pop();
  return parts.length > 0 ? `${parts.join('/')}/` : '';
}

function seededNumber(input: string): number {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967295;
}
