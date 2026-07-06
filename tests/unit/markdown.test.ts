import { describe, expect, it } from 'vitest';
import { dependencySelectionToMermaid, symbolSelectionToMermaid } from '../../src/webview/features/F11/markdown';
import type { ChangedFile, DependencyEdge, SymbolEdge, SymbolNode } from '../../src/webview/types/commit';

describe('dependencySelectionToMermaid', () => {
  it('uses file names rather than full paths for node labels', () => {
    const files: ChangedFile[] = [{ path: 'src/components/Button.tsx', status: 'M' }];

    const markdown = dependencySelectionToMermaid(files, []);

    expect(markdown).toContain('N_Button_tsx["Button.tsx"]');
    expect(markdown).not.toContain('src/components/Button.tsx');
  });

  it('includes edge endpoint nodes even when they are introduced by selected edges', () => {
    const edges: DependencyEdge[] = [{ from: 'src/App.tsx', to: 'src/store/index.ts', kind: 'import' }];

    const markdown = dependencySelectionToMermaid([], edges);

    expect(markdown).toContain('N_App_tsx["App.tsx"]');
    expect(markdown).toContain('N_index_ts["index.ts"]');
    expect(markdown).toContain('N_App_tsx -->|import| N_index_ts');
  });

  it('disambiguates duplicate file names without falling back to full paths', () => {
    const files: ChangedFile[] = [
      { path: 'src/components/index.ts', status: 'M' },
      { path: 'src/store/index.ts', status: 'M' },
    ];

    const markdown = dependencySelectionToMermaid(files, []);

    expect(markdown).toContain('N_index_ts_1["index.ts"]');
    expect(markdown).toContain('N_index_ts_2["index.ts"]');
    expect(markdown).not.toContain('src/components/index.ts');
    expect(markdown).not.toContain('src/store/index.ts');
  });
});

describe('symbolSelectionToMermaid', () => {
  it('uses symbol names rather than source ids for node ids', () => {
    const nodes: SymbolNode[] = [
      {
        id: 'src/components/CommitList.tsx#renderItem',
        name: 'renderItem',
        kind: 'function',
        lineStart: 10,
        lineEnd: 20,
        isExported: false,
        nodeCategory: 'local',
      },
    ];

    const markdown = symbolSelectionToMermaid(nodes, []);

    expect(markdown).toContain('N_renderItem_function["renderItem (function)"]');
    expect(markdown).not.toContain('src/components/CommitList.tsx#renderItem');
  });

  it('includes edge endpoint nodes even when they are introduced by selected edges', () => {
    const edges: SymbolEdge[] = [
      {
        from: 'src/components/CommitList.tsx#renderItem',
        to: 'src/components/CommitList.tsx#loadMore',
        kind: 'calls',
      },
    ];

    const markdown = symbolSelectionToMermaid([], edges);

    expect(markdown).toContain('N_renderItem_function["renderItem (function)"]');
    expect(markdown).toContain('N_loadMore_function["loadMore (function)"]');
    expect(markdown).toContain('N_renderItem_function -->|calls| N_loadMore_function');
  });

  it('disambiguates duplicate symbol names without falling back to source ids', () => {
    const nodes: SymbolNode[] = [
      {
        id: 'src/foo.ts#render',
        name: 'render',
        kind: 'function',
        lineStart: 1,
        lineEnd: 2,
        isExported: false,
        nodeCategory: 'local',
      },
      {
        id: 'src/bar.ts#render',
        name: 'render',
        kind: 'function',
        lineStart: 3,
        lineEnd: 4,
        isExported: false,
        nodeCategory: 'local',
      },
    ];

    const markdown = symbolSelectionToMermaid(nodes, []);

    expect(markdown).toContain('N_render_function_1["render (function)"]');
    expect(markdown).toContain('N_render_function_2["render (function)"]');
    expect(markdown).not.toContain('src/foo.ts#render');
    expect(markdown).not.toContain('src/bar.ts#render');
  });
});
