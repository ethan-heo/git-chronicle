import * as vscode from 'vscode';
import { createNote, deleteNote, listNotes, moveNote, NoteFileError, readNote, writeNote, type NoteEntry } from '../noteFileService';
import { l10n } from './shared';

export interface NotePayload {
  paneId?: string;
  relativePath?: string;
  fromRelativePath?: string;
  toRelativePath?: string;
  savePath?: string | null;
  content?: string;
}

async function postNoteTree(panel: vscode.WebviewPanel, entries: NoteEntry[]): Promise<void> {
  await panel.webview.postMessage({
    type: 'NOTE_TREE_LOADED',
    payload: { entries },
  });
}

function getNoteErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof NoteFileError) {
    return error.message;
  }

  return l10n(fallbackMessage);
}

export async function handleFetchNote(panel: vscode.WebviewPanel, payload: NotePayload = {}): Promise<void> {
  if (!payload.savePath) {
    await panel.webview.postMessage({
      type: 'NOTE_LOAD_FAILED',
      payload: { message: l10n('저장 경로를 먼저 설정해주세요'), paneId: payload.paneId },
    });
    return;
  }

  if (!payload.relativePath) {
    await panel.webview.postMessage({
      type: 'NOTE_LOAD_FAILED',
      payload: { message: l10n('노트 경로가 없습니다'), paneId: payload.paneId },
    });
    return;
  }

  try {
    const loaded = readNote(payload.savePath, payload.relativePath);
    await panel.webview.postMessage({
      type: 'NOTE_LOADED',
      payload: {
        content: loaded.content,
        savedPath: loaded.savedPath,
        hasSavedNote: true,
        paneId: payload.paneId,
      },
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'NOTE_LOAD_FAILED',
      payload: { message: getNoteErrorMessage(error, '노트를 불러오지 못했습니다'), paneId: payload.paneId },
    });
  }
}

export async function handleSaveNote(panel: vscode.WebviewPanel, payload: NotePayload = {}): Promise<void> {
  if (!payload.savePath) {
    await panel.webview.postMessage({
      type: 'NOTE_SAVE_FAILED',
      payload: { message: l10n('저장 경로를 먼저 설정해주세요'), paneId: payload.paneId },
    });
    return;
  }

  if (!payload.relativePath) {
    await panel.webview.postMessage({
      type: 'NOTE_SAVE_FAILED',
      payload: { message: l10n('노트 경로가 없습니다'), paneId: payload.paneId },
    });
    return;
  }

  try {
    const saved = writeNote(payload.savePath, payload.relativePath, payload.content ?? '');
    await panel.webview.postMessage({
      type: 'NOTE_SAVED',
      payload: {
        content: saved.content,
        savedPath: saved.savedPath,
        hasSavedNote: true,
        paneId: payload.paneId,
      },
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'NOTE_SAVE_FAILED',
      payload: { message: getNoteErrorMessage(error, '노트를 저장하지 못했습니다'), paneId: payload.paneId },
    });
  }
}

export async function handleFetchNoteTree(panel: vscode.WebviewPanel, payload: NotePayload = {}): Promise<void> {
  if (!payload.savePath) {
    await panel.webview.postMessage({
      type: 'NOTE_TREE_LOAD_FAILED',
      payload: { message: l10n('저장 경로를 먼저 설정해주세요') },
    });
    return;
  }

  try {
    await postNoteTree(panel, listNotes(payload.savePath));
  } catch (error) {
    await panel.webview.postMessage({
      type: 'NOTE_TREE_LOAD_FAILED',
      payload: { message: getNoteErrorMessage(error, '노트 목록을 불러오지 못했습니다') },
    });
  }
}

export async function handleCreateNote(panel: vscode.WebviewPanel, payload: NotePayload = {}): Promise<void> {
  if (!payload.savePath || !payload.relativePath) {
    await panel.webview.postMessage({
      type: 'NOTE_CREATE_FAILED',
      payload: { message: l10n('노트를 생성할 수 없습니다'), relativePath: payload.relativePath ?? '' },
    });
    return;
  }

  try {
    const entry = createNote(payload.savePath, payload.relativePath);
    await panel.webview.postMessage({ type: 'NOTE_CREATED', payload: { entry } });
    await postNoteTree(panel, listNotes(payload.savePath));
  } catch (error) {
    await panel.webview.postMessage({
      type: 'NOTE_CREATE_FAILED',
      payload: {
        message: getNoteErrorMessage(error, '노트를 생성하지 못했습니다'),
        relativePath: payload.relativePath,
      },
    });
  }
}

export async function handleDeleteNote(panel: vscode.WebviewPanel, payload: NotePayload = {}): Promise<void> {
  if (!payload.savePath || !payload.relativePath) {
    await panel.webview.postMessage({
      type: 'NOTE_DELETE_FAILED',
      payload: { message: l10n('노트를 삭제할 수 없습니다'), relativePath: payload.relativePath ?? '' },
    });
    return;
  }

  try {
    deleteNote(payload.savePath, payload.relativePath);
    await panel.webview.postMessage({ type: 'NOTE_DELETED', payload: { relativePath: payload.relativePath } });
    await postNoteTree(panel, listNotes(payload.savePath));
  } catch (error) {
    await panel.webview.postMessage({
      type: 'NOTE_DELETE_FAILED',
      payload: {
        message: getNoteErrorMessage(error, '노트를 삭제하지 못했습니다'),
        relativePath: payload.relativePath,
      },
    });
  }
}

export async function handleMoveNote(panel: vscode.WebviewPanel, payload: NotePayload = {}): Promise<void> {
  if (!payload.savePath || !payload.fromRelativePath || !payload.toRelativePath) {
    await panel.webview.postMessage({
      type: 'NOTE_MOVE_FAILED',
      payload: { message: l10n('노트를 이동할 수 없습니다'), fromRelativePath: payload.fromRelativePath ?? '' },
    });
    return;
  }

  try {
    const entry = moveNote(payload.savePath, payload.fromRelativePath, payload.toRelativePath);
    await panel.webview.postMessage({
      type: 'NOTE_MOVED',
      payload: { fromRelativePath: payload.fromRelativePath, toRelativePath: entry.relativePath },
    });
    await postNoteTree(panel, listNotes(payload.savePath));
  } catch (error) {
    await panel.webview.postMessage({
      type: 'NOTE_MOVE_FAILED',
      payload: {
        message: getNoteErrorMessage(error, '노트를 이동하지 못했습니다'),
        fromRelativePath: payload.fromRelativePath,
      },
    });
  }
}
