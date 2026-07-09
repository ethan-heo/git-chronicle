import * as vscode from 'vscode';
import { loadNote, saveNote, SummarySaveError } from '../summaryFileService';
import { l10n } from './shared';

export interface NotePayload {
  paneId?: string;
  commitHash?: string;
  commitMessage?: string;
  savePath?: string | null;
  content?: string;
}

export async function handleFetchNote(panel: vscode.WebviewPanel, payload: NotePayload = {}): Promise<void> {
  if (!payload.savePath) {
    await panel.webview.postMessage({
      type: 'NOTE_LOAD_FAILED',
      payload: { message: l10n('저장 경로를 먼저 설정해주세요'), paneId: payload.paneId },
    });
    return;
  }

  if (!payload.commitHash) {
    await panel.webview.postMessage({
      type: 'NOTE_LOAD_FAILED',
      payload: { message: l10n('커밋 정보가 없습니다'), paneId: payload.paneId },
    });
    return;
  }

  const loaded = loadNote(payload.savePath, payload.commitHash, payload.commitMessage);
  await panel.webview.postMessage({
    type: 'NOTE_LOADED',
    payload: {
      content: loaded?.content ?? '',
      savedPath: loaded?.savedPath ?? null,
      hasSavedNote: Boolean(loaded),
      paneId: payload.paneId,
    },
  });
}

export async function handleSaveNote(panel: vscode.WebviewPanel, payload: NotePayload = {}): Promise<void> {
  if (!payload.savePath) {
    await panel.webview.postMessage({
      type: 'NOTE_SAVE_FAILED',
      payload: { message: l10n('저장 경로를 먼저 설정해주세요'), paneId: payload.paneId },
    });
    return;
  }

  if (!payload.commitHash) {
    await panel.webview.postMessage({
      type: 'NOTE_SAVE_FAILED',
      payload: { message: l10n('커밋 정보가 없습니다'), paneId: payload.paneId },
    });
    return;
  }

  try {
    const savedPath = saveNote(payload.savePath, payload.commitHash, payload.content ?? '', payload.commitMessage);
    await panel.webview.postMessage({
      type: 'NOTE_SAVED',
      payload: {
        content: payload.content ?? '',
        savedPath,
        hasSavedNote: true,
        paneId: payload.paneId,
      },
    });
  } catch (error) {
    const message = error instanceof SummarySaveError ? error.message : l10n('노트를 저장하지 못했습니다');
    await panel.webview.postMessage({
      type: 'NOTE_SAVE_FAILED',
      payload: { message, paneId: payload.paneId },
    });
  }
}
