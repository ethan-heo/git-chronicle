import * as fs from 'fs';
import * as path from 'path';

export interface NoteEntry {
  relativePath: string;
  name: string;
  updatedAt: string;
}

export type NoteFileErrorCode = 'INVALID_PATH' | 'ALREADY_EXISTS' | 'NOT_FOUND' | 'IO_ERROR';

export class NoteFileError extends Error {
  constructor(
    public readonly code: NoteFileErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'NoteFileError';
  }
}

export function getNotesRoot(savePath: string): string {
  return savePath;
}

export function sanitizeRelativePath(relativePath: string): string {
  if (relativePath.includes('\0')) {
    throw new NoteFileError('INVALID_PATH', '유효하지 않은 경로입니다');
  }

  const normalized = relativePath.replaceAll('\\', '/').trim();
  if (!normalized || normalized.startsWith('/')) {
    throw new NoteFileError('INVALID_PATH', '유효하지 않은 경로입니다');
  }

  const segments = normalized.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..' || /^[A-Za-z]:$/.test(segment))) {
    throw new NoteFileError('INVALID_PATH', '유효하지 않은 경로입니다');
  }

  return segments.join('/');
}

export function ensureMdExtension(relativePath: string): string {
  const normalized = sanitizeRelativePath(relativePath);
  const segments = normalized.split('/');
  const fileName = segments.at(-1) ?? '';

  if (fileName.includes('.')) {
    return normalized;
  }

  segments[segments.length - 1] = `${fileName}.md`;
  return segments.join('/');
}

export function ensureAiMdExtension(relativePath: string): string {
  const normalized = sanitizeRelativePath(relativePath);
  const segments = normalized.split('/');
  const fileName = segments.at(-1) ?? '';
  const suffixless = fileName.includes('.') ? fileName.split('.')[0] : fileName;

  segments[segments.length - 1] = `${suffixless}.ai.md`;
  return segments.join('/');
}

export function listNotes(savePath: string): NoteEntry[] {
  const notesRoot = getNotesRoot(savePath);
  if (!fs.existsSync(notesRoot)) {
    return [];
  }

  try {
    const entries: NoteEntry[] = [];
    walkNotes(notesRoot, notesRoot, entries);
    return entries.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  } catch (error) {
    throw new NoteFileError('IO_ERROR', '노트 목록을 불러오지 못했습니다', error);
  }
}

export function createNote(savePath: string, relativePath: string): NoteEntry {
  const safeRelativePath = ensureMdExtension(relativePath);
  const absolutePath = toAbsolutePath(savePath, safeRelativePath);

  if (fs.existsSync(absolutePath)) {
    throw new NoteFileError('ALREADY_EXISTS', '같은 경로의 노트가 이미 존재합니다');
  }

  try {
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, '', 'utf8');
    const stats = fs.statSync(absolutePath);
    return toNoteEntry(safeRelativePath, stats.mtime);
  } catch (error) {
    throw new NoteFileError('IO_ERROR', '노트를 생성하지 못했습니다', error);
  }
}

export function deleteNote(savePath: string, relativePath: string): void {
  const safeRelativePath = sanitizeRelativePath(relativePath);
  const absolutePath = toAbsolutePath(savePath, safeRelativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new NoteFileError('NOT_FOUND', '노트를 찾을 수 없습니다');
  }

  try {
    fs.unlinkSync(absolutePath);
    pruneEmptyDirectories(path.dirname(absolutePath), getNotesRoot(savePath));
  } catch (error) {
    throw new NoteFileError('IO_ERROR', '노트를 삭제하지 못했습니다', error);
  }
}

export function moveNote(savePath: string, fromRelativePath: string, toRelativePath: string): NoteEntry {
  const safeFrom = sanitizeRelativePath(fromRelativePath);
  const safeTo = ensureMdExtension(toRelativePath);
  const fromAbsolutePath = toAbsolutePath(savePath, safeFrom);
  const toAbsolutePathValue = toAbsolutePath(savePath, safeTo);

  if (!fs.existsSync(fromAbsolutePath)) {
    throw new NoteFileError('NOT_FOUND', '이동할 노트를 찾을 수 없습니다');
  }

  if (fs.existsSync(toAbsolutePathValue)) {
    throw new NoteFileError('ALREADY_EXISTS', '대상 경로에 같은 이름의 노트가 이미 존재합니다');
  }

  try {
    fs.mkdirSync(path.dirname(toAbsolutePathValue), { recursive: true });
    fs.renameSync(fromAbsolutePath, toAbsolutePathValue);
    pruneEmptyDirectories(path.dirname(fromAbsolutePath), getNotesRoot(savePath));
    const stats = fs.statSync(toAbsolutePathValue);
    return toNoteEntry(safeTo, stats.mtime);
  } catch (error) {
    throw new NoteFileError('IO_ERROR', '노트를 이동하지 못했습니다', error);
  }
}

export interface NoteFileResult {
  content: string;
  savedPath: string;
}

export function readNote(savePath: string, relativePath: string): NoteFileResult {
  const safeRelativePath = sanitizeRelativePath(relativePath);
  const absolutePath = toAbsolutePath(savePath, safeRelativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new NoteFileError('NOT_FOUND', '노트를 찾을 수 없습니다');
  }

  try {
    return {
      content: fs.readFileSync(absolutePath, 'utf8'),
      savedPath: absolutePath,
    };
  } catch (error) {
    throw new NoteFileError('IO_ERROR', '노트를 불러오지 못했습니다', error);
  }
}

export function writeNote(savePath: string, relativePath: string, content: string): NoteFileResult {
  const safeRelativePath = sanitizeRelativePath(relativePath);
  const absolutePath = toAbsolutePath(savePath, safeRelativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new NoteFileError('NOT_FOUND', '노트를 찾을 수 없습니다');
  }

  try {
    fs.writeFileSync(absolutePath, content, 'utf8');
    return {
      content,
      savedPath: absolutePath,
    };
  } catch (error) {
    throw new NoteFileError('IO_ERROR', '노트를 저장하지 못했습니다', error);
  }
}

function toAbsolutePath(savePath: string, relativePath: string): string {
  return path.join(getNotesRoot(savePath), ...relativePath.split('/'));
}

function walkNotes(rootPath: string, currentPath: string, entries: NoteEntry[]): void {
  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    const entryPath = path.join(currentPath, entry.name);

    if (entry.isDirectory()) {
      walkNotes(rootPath, entryPath, entries);
      continue;
    }

    const relativePath = path.relative(rootPath, entryPath).split(path.sep).join('/');
    const stats = fs.statSync(entryPath);
    entries.push(toNoteEntry(relativePath, stats.mtime));
  }
}

function toNoteEntry(relativePath: string, updatedAt: Date): NoteEntry {
  return {
    relativePath,
    name: path.posix.basename(relativePath),
    updatedAt: updatedAt.toISOString(),
  };
}

function pruneEmptyDirectories(startPath: string, stopPath: string): void {
  let currentPath = startPath;
  const normalizedStopPath = path.resolve(stopPath);

  while (path.resolve(currentPath).startsWith(normalizedStopPath) && path.resolve(currentPath) !== normalizedStopPath) {
    if (!fs.existsSync(currentPath)) {
      currentPath = path.dirname(currentPath);
      continue;
    }

    if (fs.readdirSync(currentPath).length > 0) {
      return;
    }

    fs.rmdirSync(currentPath);
    currentPath = path.dirname(currentPath);
  }
}
