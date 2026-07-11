import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  NoteFileError,
  createNote,
  deleteNote,
  getNotesRoot,
  listNotes,
  moveNote,
  readNote,
  sanitizeRelativePath,
  writeNote,
} from '../../src/extension/noteFileService';

const tempPaths: string[] = [];

afterEach(() => {
  for (const tempPath of tempPaths.splice(0)) {
    fs.rmSync(tempPath, { recursive: true, force: true });
  }
});

describe('noteFileService', () => {
  it('rejects path traversal and absolute-like paths', () => {
    expect(() => sanitizeRelativePath('../secret.md')).toThrow(NoteFileError);
    expect(() => sanitizeRelativePath('/absolute.md')).toThrow(NoteFileError);
    expect(() => sanitizeRelativePath('C:/secret.md')).toThrow(NoteFileError);
  });

  it('creates nested folders from slash-delimited note names and appends .md when missing', () => {
    const savePath = makeTempPath();

    const entry = createNote(savePath, 'ideas/todo');

    expect(entry.relativePath).toBe('ideas/todo.md');
    expect(fs.existsSync(path.join(getNotesRoot(savePath), 'ideas', 'todo.md'))).toBe(true);
  });

  it('moves notes, rejects overwriting, and prunes emptied source folders', () => {
    const savePath = makeTempPath();
    createNote(savePath, 'ideas/todo');
    writeNote(savePath, 'ideas/todo.md', '# todo');
    createNote(savePath, 'archive/existing.md');

    expect(() => moveNote(savePath, 'ideas/todo.md', 'archive/existing.md')).toThrow(NoteFileError);

    const moved = moveNote(savePath, 'ideas/todo.md', 'archive/todo.md');
    expect(moved.relativePath).toBe('archive/todo.md');
    expect(fs.existsSync(path.join(getNotesRoot(savePath), 'archive', 'todo.md'))).toBe(true);
    expect(fs.existsSync(path.join(getNotesRoot(savePath), 'ideas'))).toBe(false);
  });

  it('deletes notes and prunes emptied parent folders', () => {
    const savePath = makeTempPath();
    createNote(savePath, 'ideas/nested/todo.md');

    deleteNote(savePath, 'ideas/nested/todo.md');

    expect(fs.existsSync(path.join(getNotesRoot(savePath), 'ideas', 'nested', 'todo.md'))).toBe(false);
    expect(fs.existsSync(path.join(getNotesRoot(savePath), 'ideas'))).toBe(false);
  });

  it('lists and reads note files from the notes root', () => {
    const savePath = makeTempPath();
    createNote(savePath, 'ideas/todo.md');
    writeNote(savePath, 'ideas/todo.md', '# todo');

    expect(listNotes(savePath)).toEqual([
      expect.objectContaining({
        relativePath: 'ideas/todo.md',
        name: 'todo.md',
      }),
    ]);
    expect(readNote(savePath, 'ideas/todo.md')).toEqual({
      content: '# todo',
      savedPath: path.join(getNotesRoot(savePath), 'ideas', 'todo.md'),
    });
  });
});

function makeTempPath(): string {
  const tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'gae-note-'));
  tempPaths.push(tempPath);
  return tempPath;
}
