import { describe, expect, it } from 'vitest';
import { buildGraphData } from '../../src/webview/features/F04/graph';
import type { ChangedFile, DependencyEdge } from '../../src/webview/types/commit';

describe('buildGraphData', () => {
  it('keeps every changed file as a node and filters edges to changed files only', () => {
    const files: ChangedFile[] = [
      { path: 'src/App.tsx', status: 'M' },
      { path: 'src/store.ts', status: 'A' },
      { path: 'docs/spec.md', status: 'M' },
    ];
    const dependencyEdges: DependencyEdge[] = [
      { from: 'src/App.tsx', to: 'src/store.ts', kind: 'import' },
      { from: 'src/App.tsx', to: 'src/untracked.ts', kind: 'import' },
    ];

    const graph = buildGraphData(files, dependencyEdges, {
      onCodeView: () => undefined,
      onCopy: () => undefined,
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

  it('clusters dependency-free files into a compact block', () => {
    const files: ChangedFile[] = [
      { path: 'src/zeta.ts', status: 'M' },
      { path: 'docs/spec.md', status: 'M' },
      { path: 'src/alpha.ts', status: 'A' },
      { path: 'src/view.tsx', status: 'M' },
    ];

    const graph = buildGraphData(files, [], {
      onCodeView: () => undefined,
      onCopy: () => undefined,
    });
    const positions = new Map(graph.nodes.map((node) => [node.id, node.position]));
    const zetaPosition = positions.get('src/zeta.ts');
    const alphaPosition = positions.get('src/alpha.ts');
    const specPosition = positions.get('docs/spec.md');
    const viewPosition = positions.get('src/view.tsx');

    const xs = [zetaPosition?.x, alphaPosition?.x, specPosition?.x, viewPosition?.x].map((value) => value ?? 0);
    const ys = [zetaPosition?.y, alphaPosition?.y, specPosition?.y, viewPosition?.y].map((value) => value ?? 0);

    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(800);
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(400);
  });

  it('expands long file-name nodes so the label can be shown completely', () => {
    const graph = buildGraphData(
      [{ path: 'src/components/ExtremelyLongDependencyCanvasNodeFileName.tsx', status: 'M' }],
      [],
      {
        onCodeView: () => undefined,
        onCopy: () => undefined,
      },
    );

    expect(graph.nodes[0].style?.width).toBeGreaterThan(240);
  });

  it('connects dependency edges from the nearest node faces', () => {
    const graph = buildGraphData(
      [
        { path: 'src/alpha.ts', status: 'M' },
        { path: 'src/beta.ts', status: 'M' },
        { path: 'src/view.tsx', status: 'M' },
      ],
      [
        { from: 'src/alpha.ts', to: 'src/beta.ts', kind: 'import' },
        { from: 'src/beta.ts', to: 'src/view.tsx', kind: 'import' },
      ],
      {
        onCodeView: () => undefined,
        onCopy: () => undefined,
      },
    );

    expect(graph.edges[0]).toMatchObject({
      sourceHandle: 'source-right',
      targetHandle: 'target-left',
    });
    expect(graph.edges[1]).toMatchObject({
      sourceHandle: 'source-right',
      targetHandle: 'target-left',
    });
  });
});
