import type { ChangedFile, Commit, DependencyEdge, SymbolEdge, SymbolNode } from '../../types/commit';
import type { DiffLineData } from '../F03/types';

export function commitToMarkdown(commit: Commit): string {
  return [
    `## Commit ${commit.shortHash}`,
    '',
    `- Message: ${commit.message}`,
    `- Author: ${commit.author}`,
    `- Date: ${commit.date}`,
    '',
  ].join('\n');
}

export function changedFileToMarkdown(file: ChangedFile): string {
  return [
    `## File ${file.path}`,
    '',
    `- Status: ${file.status}`,
    ...(file.oldPath ? [`- Previous path: ${file.oldPath}`] : []),
    '',
  ].join('\n');
}

export function diffRangeToMarkdown(filePath: string, diffLines: DiffLineData[], startIndex: number, endIndex: number): string {
  const selectedLines = diffLines.slice(startIndex, endIndex + 1);
  const firstLine = selectedLines.find((line) => line.oldLineNumber || line.newLineNumber);
  const lastLine = [...selectedLines].reverse().find((line) => line.oldLineNumber || line.newLineNumber);

  return [
    `## Diff ${filePath}`,
    '',
    `- Range: ${formatDiffRange(firstLine?.oldLineNumber ?? firstLine?.newLineNumber, lastLine?.newLineNumber ?? lastLine?.oldLineNumber)}`,
    '',
    '```diff',
    ...selectedLines.map((line) => `${toDiffPrefix(line.type)}${line.tokens.map((token) => token.content).join('')}`),
    '```',
    '',
  ].join('\n');
}

export function codeRangeToMarkdown(filePath: string, lines: string[], startLine: number, endLine: number, language: string): string {
  const normalizedStart = Math.max(1, Math.min(startLine, endLine));
  const normalizedEnd = Math.max(startLine, endLine);
  const selectedLines = lines.slice(normalizedStart - 1, normalizedEnd);

  return [
    `## Code ${filePath}`,
    '',
    `- Range: ${formatDiffRange(normalizedStart, normalizedEnd)}`,
    '',
    `\`\`\`${normalizeCodeFenceLanguage(language)}`,
    ...selectedLines,
    '```',
    '',
  ].join('\n');
}

export function splitMarkdownSections(content: string): Array<{ heading: string; content: string }> {
  const normalized = content.trim();
  if (!normalized) {
    return [];
  }

  const lines = normalized.split('\n');
  const sections: Array<{ heading: string; content: string }> = [];
  let currentHeading = 'Summary';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (/^#{2,3}\s+/.test(line) && currentLines.length > 0) {
      sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
      currentHeading = line.replace(/^#{2,3}\s+/, '').trim();
      currentLines = [line];
      continue;
    }

    if (/^#{2,3}\s+/.test(line)) {
      currentHeading = line.replace(/^#{2,3}\s+/, '').trim();
    }

    currentLines.push(line);
  }

  if (currentLines.length > 0) {
    sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
  }

  return sections;
}

export function dependencySelectionToMermaid(selectedFiles: ChangedFile[], selectedEdges: DependencyEdge[]): string {
  const dedupedFiles = dedupeFilesByPath(selectedFiles);
  const fileByPath = new Map(dedupedFiles.map((file) => [file.path, file]));

  for (const edge of selectedEdges) {
    if (!fileByPath.has(edge.from)) {
      fileByPath.set(edge.from, { path: edge.from, status: 'M' });
    }
    if (!fileByPath.has(edge.to)) {
      fileByPath.set(edge.to, { path: edge.to, status: 'M' });
    }
  }
  const dependencyNodeIds = buildDependencyNodeIds([...fileByPath.values()]);

  return graphSelectionToMermaid(
    'graph LR',
    [...fileByPath.values()].map((file) => ({ id: dependencyNodeIds.get(file.path) ?? toMermaidId(getFileName(file.path)), label: getFileName(file.path) })),
    selectedEdges.map((edge) => ({
      from: dependencyNodeIds.get(edge.from) ?? toMermaidId(getFileName(edge.from)),
      to: dependencyNodeIds.get(edge.to) ?? toMermaidId(getFileName(edge.to)),
      label: edge.kind,
    })),
  );
}

export function symbolSelectionToMermaid(selectedNodes: SymbolNode[], selectedEdges: SymbolEdge[]): string {
  const dedupedNodes = dedupeSymbolNodesById(selectedNodes);
  const nodeById = new Map(dedupedNodes.map((node) => [node.id, node]));

  for (const edge of selectedEdges) {
    if (!nodeById.has(edge.from)) {
      nodeById.set(edge.from, {
        id: edge.from,
        name: getSymbolNameFromId(edge.from),
        kind: 'function',
        lineStart: 0,
        lineEnd: 0,
        isExported: false,
        nodeCategory: 'local',
      });
    }
    if (!nodeById.has(edge.to)) {
      nodeById.set(edge.to, {
        id: edge.to,
        name: getSymbolNameFromId(edge.to),
        kind: 'function',
        lineStart: 0,
        lineEnd: 0,
        isExported: false,
        nodeCategory: 'local',
      });
    }
  }
  const symbolNodeIds = buildSymbolNodeIds([...nodeById.values()]);

  return graphSelectionToMermaid(
    'graph LR',
    [...nodeById.values()].map((node) => ({
      id: symbolNodeIds.get(node.id) ?? toMermaidId(node.name),
      label: `${node.name} (${node.kind})`,
    })),
    selectedEdges.map((edge) => ({
      from: symbolNodeIds.get(edge.from) ?? toMermaidId(getSymbolNameFromId(edge.from)),
      to: symbolNodeIds.get(edge.to) ?? toMermaidId(getSymbolNameFromId(edge.to)),
      label: edge.kind,
    })),
  );
}

function graphSelectionToMermaid(
  header: string,
  nodes: Array<{ id: string; label: string }>,
  edges: Array<{ from: string; to: string; label?: string }>,
): string {
  return [
    '```mermaid',
    header,
    ...nodes.map((node) => `  ${node.id}["${escapeMermaidLabel(node.label)}"]`),
    ...edges.map((edge) => `  ${edge.from} -->|${escapeMermaidLabel(edge.label ?? '')}| ${edge.to}`),
    '```',
    '',
  ].join('\n');
}

function formatDiffRange(start?: number | null, end?: number | null): string {
  if (!start && !end) {
    return 'n/a';
  }
  if (!end || start === end) {
    return `L${start ?? end}`;
  }
  return `L${start}-${end}`;
}

function toDiffPrefix(type: DiffLineData['type']): string {
  return type === 'added' ? '+' : type === 'removed' ? '-' : ' ';
}

function toMermaidId(value: string): string {
  return `N_${value.replace(/[^A-Za-z0-9_]/g, '_')}`;
}

function escapeMermaidLabel(value: string): string {
  return value.replace(/"/g, '&quot;');
}

function dedupeFilesByPath(files: ChangedFile[]): ChangedFile[] {
  return [...new Map(files.map((file) => [file.path, file])).values()];
}

function getFileName(filePath: string): string {
  const segments = filePath.split('/');
  return segments.at(-1) || filePath;
}

function buildDependencyNodeIds(files: ChangedFile[]): Map<string, string> {
  const countsByFileName = new Map<string, number>();

  for (const file of files) {
    const fileName = getFileName(file.path);
    countsByFileName.set(fileName, (countsByFileName.get(fileName) ?? 0) + 1);
  }

  const occurrenceByFileName = new Map<string, number>();

  return new Map(
    files.map((file) => {
      const fileName = getFileName(file.path);
      const total = countsByFileName.get(fileName) ?? 1;
      const occurrence = (occurrenceByFileName.get(fileName) ?? 0) + 1;
      occurrenceByFileName.set(fileName, occurrence);

      const suffix = total > 1 ? `_${occurrence}` : '';
      return [file.path, toMermaidId(`${fileName}${suffix}`)];
    }),
  );
}

function dedupeSymbolNodesById(nodes: SymbolNode[]): SymbolNode[] {
  return [...new Map(nodes.map((node) => [node.id, node])).values()];
}

function getSymbolNameFromId(symbolId: string): string {
  const segments = symbolId.split(/[:/#]/);
  return segments.at(-1) || symbolId;
}

function normalizeCodeFenceLanguage(language: string): string {
  const normalized = language.split('.').at(-1)?.toLowerCase() ?? language.toLowerCase();
  const aliasMap: Record<string, string> = {
    cjs: 'javascript',
    js: 'javascript',
    jsx: 'jsx',
    mjs: 'javascript',
    mts: 'typescript',
    cts: 'typescript',
    ts: 'typescript',
    tsx: 'tsx',
    md: 'markdown',
    yml: 'yaml',
  };

  return aliasMap[normalized] ?? normalized;
}

function buildSymbolNodeIds(nodes: SymbolNode[]): Map<string, string> {
  const countsByKey = new Map<string, number>();

  for (const node of nodes) {
    const key = `${node.name}:${node.kind}`;
    countsByKey.set(key, (countsByKey.get(key) ?? 0) + 1);
  }

  const occurrenceByKey = new Map<string, number>();

  return new Map(
    nodes.map((node) => {
      const key = `${node.name}:${node.kind}`;
      const total = countsByKey.get(key) ?? 1;
      const occurrence = (occurrenceByKey.get(key) ?? 0) + 1;
      occurrenceByKey.set(key, occurrence);

      const suffix = total > 1 ? `_${occurrence}` : '';
      return [node.id, toMermaidId(`${node.name}_${node.kind}${suffix}`)];
    }),
  );
}
