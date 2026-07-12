import { describe, expect, it } from 'vitest';
import { applyAutocompleteSegment, getActiveSuggestion } from '../../src/webview/features/F05b/PathAutocompleteInput';
import { getDirectorySuggestions } from '../../src/webview/features/F05b/SaveAsNotePopover';

describe('PathAutocompleteInput helpers', () => {
  it('returns the most recently updated matching directory suggestion', () => {
    const suggestions = getDirectorySuggestions([
      { relativePath: 'ideas/today/alpha.md', name: 'alpha.md', updatedAt: '2026-07-12T10:00:00.000Z' },
      { relativePath: 'ideas/todo/task.md', name: 'task.md', updatedAt: '2026-07-12T11:00:00.000Z' },
      { relativePath: 'archive/older.md', name: 'older.md', updatedAt: '2026-07-10T11:00:00.000Z' },
    ]);

    expect(getActiveSuggestion('ideas/t', suggestions)).toBe('ideas/todo/');
  });

  it('completes only until the next slash on each Tab press', () => {
    expect(applyAutocompleteSegment('ideas/t', 'ideas/todo/tasks/')).toBe('ideas/todo/');
    expect(applyAutocompleteSegment('ideas/todo/', 'ideas/todo/tasks/')).toBe('ideas/todo/tasks/');
  });

  it('does not autocomplete file names', () => {
    const suggestions = getDirectorySuggestions([
      { relativePath: 'ideas/todo/task.md', name: 'task.md', updatedAt: '2026-07-12T11:00:00.000Z' },
    ]);

    expect(getActiveSuggestion('ideas/todo/task', suggestions)).toBeNull();
  });
});
