import { describe, expect, it } from 'vitest';
import type { ChangedFile } from '../../src/types/commit';
import { buildNodePathIndex, resolveNodePath } from '../../src/webview/features/F04/graph';

describe('graph path resolution', () => {
  it('does not let duplicate file names overwrite each other in the node index', () => {
    const files = [{ path: 'src/utils/hooks.ts' }, { path: 'src/services/hooks.ts' }] satisfies ChangedFile[];
    const index = buildNodePathIndex(files);

    expect(index.get('src/utils/hooks.ts')).toBe('src/utils/hooks.ts');
    expect(index.get('src/services/hooks.ts')).toBe('src/services/hooks.ts');
    expect(index.has('hooks.ts')).toBe(false);
  });

  it('resolves only exact or unique path matches when file names collide', () => {
    const files = [{ path: 'src/utils/hooks.ts' }, { path: 'src/services/hooks.ts' }, { path: 'src/main.ts' }] satisfies ChangedFile[];
    const index = buildNodePathIndex(files);
    const fullPathKeys = new Set(files.map((file) => file.path));

    expect(resolveNodePath('src/utils/hooks.ts', index, fullPathKeys)).toBe('src/utils/hooks.ts');
    expect(resolveNodePath('hooks.ts', index, fullPathKeys)).toBeNull();
    expect(resolveNodePath('src/services/hooks.ts', index, fullPathKeys)).toBe('src/services/hooks.ts');
  });
});
