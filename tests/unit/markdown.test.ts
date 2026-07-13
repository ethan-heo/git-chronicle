import { describe, expect, it } from 'vitest';
import { codeRangeToMarkdown, commitToMarkdown, dependencySelectionToMermaid, diffRangeToMarkdown, changedFileToMarkdown, symbolSelectionToMermaid } from '../../src/webview/features/F11/markdown';
import type { ChangedFile, DependencyEdge, SymbolEdge, SymbolNode } from '../../src/webview/types/commit';
import type { DiffLineData } from '../../src/webview/features/F03/types';

describe('commitToMarkdown', () => {
  it('copies only the short hash and message', () => {
    const markdown = commitToMarkdown({
      hash: '1234567890abcdef',
      shortHash: '1234567',
      message: 'Fix copy output',
      author: 'Ethan',
      date: '2026-07-13',
    });

    expect(markdown).toBe('1234567 Fix copy output');
  });
});

describe('changedFileToMarkdown', () => {
  it('copies only the current file path by default', () => {
    const markdown = changedFileToMarkdown({ path: 'src/webview/features/F11/markdown.ts', status: 'M' });

    expect(markdown).toBe('src/webview/features/F11/markdown.ts');
  });

  it('copies rename information without extra labels', () => {
    const markdown = changedFileToMarkdown({
      path: 'src/new-name.ts',
      oldPath: 'src/old-name.ts',
      status: 'R',
    });

    expect(markdown).toBe('src/old-name.ts -> src/new-name.ts');
  });
});

describe('diffRangeToMarkdown', () => {
  it('copies only the selected diff block', () => {
    const diffLines: DiffLineData[] = [
      {
        type: 'removed',
        content: 'const before = true;',
        oldLineNumber: 10,
        newLineNumber: null,
        tokens: [{ content: 'const before = true;' }],
      },
      {
        type: 'added',
        content: 'const after = true;',
        oldLineNumber: null,
        newLineNumber: 10,
        tokens: [{ content: 'const after = true;' }],
      },
    ];

    const markdown = diffRangeToMarkdown('src/example.ts', diffLines, 0, 1);

    expect(markdown).toBe(['```diff', '-const before = true;', '+const after = true;', '```', ''].join('\n'));
    expect(markdown).not.toContain('## Diff');
    expect(markdown).not.toContain('Range:');
  });
});

describe('codeRangeToMarkdown', () => {
  it('copies only the selected code block', () => {
    const markdown = codeRangeToMarkdown('src/example.ts', ['first()', 'second()', 'third()'], 2, 3, 'ts');

    expect(markdown).toBe(['```typescript', 'second()', 'third()', '```', ''].join('\n'));
    expect(markdown).not.toContain('## Code');
    expect(markdown).not.toContain('Range:');
  });
});

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
