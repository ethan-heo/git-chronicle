import { describe, expect, it } from 'vitest';
import { getMatchingSuggestions } from '../../src/webview/features/F05b/PathAutocompleteInput';
import { getDirectorySuggestions } from '../../src/webview/features/F05b/SaveAsNotePopover';

describe('PathAutocompleteInput helpers', () => {
  it('returns every directory whose path contains the typed keyword, most recently updated first', () => {
    const suggestions = getDirectorySuggestions([
      { relativePath: 'ideas/today/alpha.md', name: 'alpha.md', updatedAt: '2026-07-12T10:00:00.000Z' },
      { relativePath: 'ideas/todo/task.md', name: 'task.md', updatedAt: '2026-07-12T11:00:00.000Z' },
      { relativePath: 'archive/older.md', name: 'older.md', updatedAt: '2026-07-10T11:00:00.000Z' },
    ]);

    expect(getMatchingSuggestions('to', suggestions)).toEqual(['ideas/todo/', 'ideas/today/']);
  });

  it('matches keywords anywhere in the path, not only as a prefix', () => {
    const suggestions = getDirectorySuggestions([
      { relativePath: 'ideas/todo/task.md', name: 'task.md', updatedAt: '2026-07-12T11:00:00.000Z' },
    ]);

    expect(getMatchingSuggestions('todo', suggestions)).toEqual(['ideas/todo/']);
  });

  it('ignores case when matching', () => {
    const suggestions = getDirectorySuggestions([
      { relativePath: 'Ideas/Todo/task.md', name: 'task.md', updatedAt: '2026-07-12T11:00:00.000Z' },
    ]);

    expect(getMatchingSuggestions('TODO', suggestions)).toEqual(['Ideas/Todo/']);
  });

  it('returns no suggestions until a keyword is typed', () => {
    const suggestions = getDirectorySuggestions([
      { relativePath: 'ideas/todo/task.md', name: 'task.md', updatedAt: '2026-07-12T11:00:00.000Z' },
      { relativePath: 'archive/older.md', name: 'older.md', updatedAt: '2026-07-10T11:00:00.000Z' },
    ]);

    expect(getMatchingSuggestions('', suggestions)).toEqual([]);
  });

  it('does not suggest file names, only directories', () => {
    const suggestions = getDirectorySuggestions([
      { relativePath: 'ideas/todo/task.md', name: 'task.md', updatedAt: '2026-07-12T11:00:00.000Z' },
    ]);

    expect(getMatchingSuggestions('task', suggestions)).toEqual([]);
  });
});
