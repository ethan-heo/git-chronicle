import { describe, expect, it } from 'vitest';
import type { ChangedFile } from '../../src/webview/types/commit';
import { ANALYZABLE_FILE_PATTERN, buildNodePathIndex, layoutFiles, resolveNodePath } from '../../src/webview/features/F04/graph';

describe('graph path resolution', () => {
  it('does not let duplicate file names overwrite each other in the node index', () => {
    const files = [
      { path: 'src/utils/hooks.ts', status: 'M' },
      { path: 'src/services/hooks.ts', status: 'M' },
    ] satisfies ChangedFile[];
    const index = buildNodePathIndex(files);

    expect(index.get('src/utils/hooks.ts')).toBe('src/utils/hooks.ts');
    expect(index.get('src/services/hooks.ts')).toBe('src/services/hooks.ts');
    expect(index.has('hooks.ts')).toBe(false);
  });

  it('resolves only exact or unique path matches when file names collide', () => {
    const files = [
      { path: 'src/utils/hooks.ts', status: 'M' },
      { path: 'src/services/hooks.ts', status: 'M' },
      { path: 'src/main.ts', status: 'M' },
    ] satisfies ChangedFile[];
    const index = buildNodePathIndex(files);
    const fullPathKeys = new Set(files.map((file) => file.path));

    expect(resolveNodePath('src/utils/hooks.ts', index, fullPathKeys)).toBe('src/utils/hooks.ts');
    expect(resolveNodePath('hooks.ts', index, fullPathKeys)).toBeNull();
    expect(resolveNodePath('src/services/hooks.ts', index, fullPathKeys)).toBe('src/services/hooks.ts');
  });

  it('uses dagre layout when edges are present and keeps isolated files in a separate band', () => {
    const files = [
      { path: 'src/a.ts', status: 'M' },
      { path: 'src/b.ts', status: 'M' },
      { path: 'src/c.ts', status: 'M' },
    ] satisfies ChangedFile[];
    const positions = layoutFiles(files, [
      { from: 'src/a.ts', to: 'src/b.ts', kind: 'import' },
    ]);

    expect(positions.get('src/a.ts')?.x).toBeLessThan(positions.get('src/b.ts')?.x ?? 0);
    expect(positions.get('src/c.ts')?.y).toBeGreaterThan(positions.get('src/b.ts')?.y ?? 0);
  });

  it('treats CSS Modules, JSON, and SVG as analyzable asset module targets', () => {
    expect(ANALYZABLE_FILE_PATTERN.test('src/Button.module.css')).toBe(true);
    expect(ANALYZABLE_FILE_PATTERN.test('src/Button.module.scss')).toBe(true);
    expect(ANALYZABLE_FILE_PATTERN.test('src/data.json')).toBe(true);
    expect(ANALYZABLE_FILE_PATTERN.test('src/icon.svg')).toBe(true);
  });

  it('does not treat plain (non-module) CSS or binary assets as analyzable', () => {
    expect(ANALYZABLE_FILE_PATTERN.test('src/global.css')).toBe(false);
    expect(ANALYZABLE_FILE_PATTERN.test('src/logo.png')).toBe(false);
  });
});
