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
  handlers: Pick<FileNodeData, 'onCodeView' | 'onAISummary'>,
): { nodes: FileNodeType[]; edges: DependencyEdgeType[] } {
  const changedFileSet = new Set(files.map((file) => file.path));
  const validEdges = dependencyEdges.filter((edge) => changedFileSet.has(edge.from) && changedFileSet.has(edge.to));
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
          onAISummary: handlers.onAISummary,
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
        },
      };
    }),
  };
}

function layoutFiles(files: ChangedFile[], edges: DependencyEdge[]): Map<string, { x: number; y: number }> {
  void edges;

  if (files.length === 0) {
    return new Map();
  }

  const centerX = 520;
  const centerY = 340;
  const horizontalGap = 160;
  const verticalGap = 190;
  const anchoredPositions = buildExtensionLayoutAnchors(files, centerX, centerY, horizontalGap, verticalGap);
  const positionList = [...anchoredPositions.values()];
  const minX = Math.min(...positionList.map((position) => position.x));
  const minY = Math.min(...positionList.map((position) => position.y));
  const margin = 100;

  return new Map(
    [...anchoredPositions.entries()].map(([filePath, position]) => [
      filePath,
      {
        x: position.x - minX + margin,
        y: position.y - minY + margin,
      },
    ]),
  );
}

interface ExtensionLayoutGroup {
  extension: string;
  files: ChangedFile[];
  width: number;
  height: number;
}

function buildExtensionLayoutAnchors(
  files: ChangedFile[],
  centerX: number,
  centerY: number,
  horizontalGap: number,
  verticalGap: number,
): Map<string, { x: number; y: number }> {
  const groups = buildExtensionGroups(files, verticalGap);
  const totalWidth = groups.reduce((sum, group, index) => sum + group.width + (index === 0 ? 0 : horizontalGap), 0);
  const startX = centerX - totalWidth / 2;
  const anchors = new Map<string, { x: number; y: number }>();
  let groupLeft = startX;

  for (const group of groups) {
    const groupTop = centerY - group.height / 2;

    group.files.forEach((file, row) => {
      anchors.set(file.path, {
        x: groupLeft,
        y: groupTop + row * verticalGap,
      });
    });

    groupLeft += group.width + horizontalGap;
  }

  return anchors;
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

function buildExtensionGroups(files: ChangedFile[], verticalGap: number): ExtensionLayoutGroup[] {
  const extensionGroups = new Map<string, ChangedFile[]>();

  for (const file of files) {
    const extension = getExtensionName(file.path);
    const group = extensionGroups.get(extension) ?? [];

    group.push(file);
    extensionGroups.set(extension, group);
  }

  return [...extensionGroups.entries()]
    .sort(([firstExtension], [secondExtension]) => firstExtension.localeCompare(secondExtension))
    .map(([extension, groupFiles]) => {
      const sortedFiles = [...groupFiles].sort((first, second) => compareFilePathForLayout(first.path, second.path));

      return {
        extension,
        files: sortedFiles,
        width: Math.max(...sortedFiles.map((file) => getNodeWidth(file.path))),
        height: (sortedFiles.length - 1) * verticalGap + Math.max(...sortedFiles.map((file) => getNodeHeight(file.path))),
      };
    });
}

function getExtensionName(filePath: string): string {
  const fileName = getFileName(filePath);
  const extensionIndex = fileName.lastIndexOf('.');

  return extensionIndex > 0 ? fileName.slice(extensionIndex).toLowerCase() : '[no extension]';
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
