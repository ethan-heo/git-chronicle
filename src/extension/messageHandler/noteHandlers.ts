import * as vscode from 'vscode';
import { createNote, deleteNote, ensureAiMdExtension, listNotes, moveNote, NoteFileError, readNote, writeNote } from '../noteFileService';
import { getSummaryLinkByNoteRelativePath, linkSummaryToNote, moveLinkedSummaryNote, removeLinkedSummaryNote, type SummaryLinkContext } from '../summaryNoteLinkService';
import { l10n } from './shared';

export interface NotePayload {
  paneId?: string;
  relativePath?: string;
  fromRelativePath?: string;
  toRelativePath?: string;
  savePath?: string | null;
  content?: string;
  linkContext?: SummaryLinkContext;
}

interface NoteTreeEntryPayload {
  relativePath: string;
  name: string;
  updatedAt: string;
  aiSummaryLink?: {
    commitHash: string;
    filePath?: string | null;
    scope: 'commit' | 'file';
    commitMessage: string;
  } | null;
}

async function postNoteTree(panel: vscode.WebviewPanel, entries: NoteTreeEntryPayload[]): Promise<void> {
  await panel.webview.postMessage({
    type: 'NOTE_TREE_LOADED',
    payload: { entries },
  });
}

function buildNoteTreeEntries(
  context: vscode.ExtensionContext,
  savePath: string,
): NoteTreeEntryPayload[] {
  return listNotes(savePath).map((entry) => ({
    ...entry,
    aiSummaryLink: getSummaryLinkByNoteRelativePath(context, entry.relativePath),
  }));
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

async function postSummaryNoteLinked(
  panel: vscode.WebviewPanel,
  payload: {
    content: string;
    savedPath: string;
    noteRelativePath: string;
    linkContext: SummaryLinkContext;
  },
): Promise<void> {
  await panel.webview.postMessage({
    type: 'AI_SUMMARY_NOTE_LINKED',
    payload,
  });
}

export async function handleSaveNote(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: NotePayload = {}): Promise<void> {
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
    const noteRelativePath = payload.linkContext ? ensureAiMdExtension(payload.relativePath) : payload.relativePath;
    const saved = writeNote(payload.savePath, noteRelativePath, payload.content ?? '');
    if (payload.linkContext) {
      await linkSummaryToNote(context, payload.linkContext, noteRelativePath);
    }
    await panel.webview.postMessage({
      type: 'NOTE_SAVED',
      payload: {
        content: saved.content,
        savedPath: saved.savedPath,
        hasSavedNote: true,
        paneId: payload.paneId,
      },
    });
    if (payload.linkContext) {
      await postSummaryNoteLinked(panel, {
        content: saved.content,
        savedPath: saved.savedPath,
        noteRelativePath,
        linkContext: payload.linkContext,
      });
    }
  } catch (error) {
    await panel.webview.postMessage({
      type: 'NOTE_SAVE_FAILED',
      payload: { message: getNoteErrorMessage(error, '노트를 저장하지 못했습니다'), paneId: payload.paneId },
    });
  }
}

export async function handleFetchNoteTree(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: NotePayload = {}): Promise<void> {
  if (!payload.savePath) {
    await panel.webview.postMessage({
      type: 'NOTE_TREE_LOAD_FAILED',
      payload: { message: l10n('저장 경로를 먼저 설정해주세요') },
    });
    return;
  }

  try {
    await postNoteTree(panel, buildNoteTreeEntries(context, payload.savePath));
  } catch (error) {
    await panel.webview.postMessage({
      type: 'NOTE_TREE_LOAD_FAILED',
      payload: { message: getNoteErrorMessage(error, '노트 목록을 불러오지 못했습니다') },
    });
  }
}

export async function handleCreateNote(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: NotePayload = {}): Promise<void> {
  if (!payload.savePath || !payload.relativePath) {
    await panel.webview.postMessage({
      type: 'NOTE_CREATE_FAILED',
      payload: { message: l10n('노트를 생성할 수 없습니다'), relativePath: payload.relativePath ?? '' },
    });
    return;
  }

  try {
    const noteRelativePath = payload.linkContext ? ensureAiMdExtension(payload.relativePath) : payload.relativePath;
    const entry = createNote(payload.savePath, noteRelativePath);
    if (payload.linkContext) {
      await linkSummaryToNote(context, payload.linkContext, entry.relativePath);
      const saved = writeNote(payload.savePath, entry.relativePath, payload.content ?? '');
      await postSummaryNoteLinked(panel, {
        content: saved.content,
        savedPath: saved.savedPath,
        noteRelativePath: entry.relativePath,
        linkContext: payload.linkContext,
      });
    }
    await panel.webview.postMessage({ type: 'NOTE_CREATED', payload: { entry } });
    await postNoteTree(panel, buildNoteTreeEntries(context, payload.savePath));
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

export async function handleDeleteNote(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: NotePayload = {}): Promise<void> {
  if (!payload.savePath || !payload.relativePath) {
    await panel.webview.postMessage({
      type: 'NOTE_DELETE_FAILED',
      payload: { message: l10n('노트를 삭제할 수 없습니다'), relativePath: payload.relativePath ?? '' },
    });
    return;
  }

  try {
    deleteNote(payload.savePath, payload.relativePath);
    await removeLinkedSummaryNote(context, payload.relativePath);
    await panel.webview.postMessage({ type: 'NOTE_DELETED', payload: { relativePath: payload.relativePath } });
    await postNoteTree(panel, buildNoteTreeEntries(context, payload.savePath));
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

export async function handleMoveNote(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: NotePayload = {}): Promise<void> {
  if (!payload.savePath || !payload.fromRelativePath || !payload.toRelativePath) {
    await panel.webview.postMessage({
      type: 'NOTE_MOVE_FAILED',
      payload: { message: l10n('노트를 이동할 수 없습니다'), fromRelativePath: payload.fromRelativePath ?? '' },
    });
    return;
  }

  try {
    const entry = moveNote(payload.savePath, payload.fromRelativePath, payload.toRelativePath);
    await moveLinkedSummaryNote(context, payload.fromRelativePath, entry.relativePath);
    await panel.webview.postMessage({
      type: 'NOTE_MOVED',
      payload: { fromRelativePath: payload.fromRelativePath, toRelativePath: entry.relativePath },
    });
    await postNoteTree(panel, buildNoteTreeEntries(context, payload.savePath));
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
