import { describe, expect, it } from 'vitest';
import { buildGraphData } from '../../src/webview/features/F04/graph';
import type { ChangedFile, DependencyEdge } from '../../src/webview/types/commit';

describe('buildGraphData', () => {
  it('keeps every changed file as a node and filters edges to changed files only', () => {
    const files: ChangedFile[] = [
      { path: 'src/App.tsx', status: 'M', hasSavedSummary: false },
      { path: 'src/store.ts', status: 'A', hasSavedSummary: true },
      { path: 'docs/spec.md', status: 'M', hasSavedSummary: false },
    ];
    const dependencyEdges: DependencyEdge[] = [
      { from: 'src/App.tsx', to: 'src/store.ts', kind: 'import' },
      { from: 'src/App.tsx', to: 'src/untracked.ts', kind: 'import' },
    ];

    const graph = buildGraphData(files, dependencyEdges, {
      onCodeView: () => undefined,
      onAISummary: () => undefined,
    });

    expect(graph.nodes.map((node) => node.id)).toEqual(['src/App.tsx', 'src/store.ts', 'docs/spec.md']);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toMatchObject({
      source: 'src/App.tsx',
      target: 'src/store.ts',
      data: {
        kind: 'import',
        highlighted: false,
      },
    });
    expect(graph.nodes.find((node) => node.id === 'docs/spec.md')?.data.canAnalyze).toBe(false);
    expect(graph.nodes.every((node) => Number.isFinite(node.position.x) && Number.isFinite(node.position.y))).toBe(true);
  });
});
