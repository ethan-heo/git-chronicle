import * as vscode from 'vscode';
import { CommitGroupNotFoundError, createCommitGroup, deleteCommitGroup, loadCommitGroups, updateCommitGroup } from '../commitGroupService';
import { l10n } from './shared';

export interface CommitGroupPayload {
  id?: string;
  name?: string;
  commitHashes?: string[];
}

async function postCommitGroups(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
  await panel.webview.postMessage({
    type: 'COMMIT_GROUPS_LOADED',
    payload: { groups: loadCommitGroups(context) },
  });
}

export async function handleFetchCommitGroups(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<void> {
  await postCommitGroups(panel, context);
}

export async function handleCreateCommitGroup(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: CommitGroupPayload = {}): Promise<void> {
  if (!payload.name?.trim() || !payload.commitHashes?.length) {
    await panel.webview.postMessage({
      type: 'COMMIT_GROUP_CREATE_FAILED',
      payload: { message: l10n('그룹을 생성할 수 없습니다') },
    });
    return;
  }

  const group = await createCommitGroup(context, payload.name.trim(), payload.commitHashes);

  await panel.webview.postMessage({ type: 'COMMIT_GROUP_CREATED', payload: { group } });
  await postCommitGroups(panel, context);
}

export async function handleUpdateCommitGroup(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: CommitGroupPayload = {}): Promise<void> {
  if (!payload.id) {
    await panel.webview.postMessage({
      type: 'COMMIT_GROUP_UPDATE_FAILED',
      payload: { message: l10n('그룹을 수정할 수 없습니다') },
    });
    return;
  }

  try {
    const group = await updateCommitGroup(context, payload.id, {
      ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
      ...(payload.commitHashes !== undefined ? { commitHashes: payload.commitHashes } : {}),
    });

    await panel.webview.postMessage({ type: 'COMMIT_GROUP_UPDATED', payload: { group } });
    await postCommitGroups(panel, context);
  } catch (error) {
    await panel.webview.postMessage({
      type: 'COMMIT_GROUP_UPDATE_FAILED',
      payload: { message: getCommitGroupErrorMessage(error, '그룹을 수정하지 못했습니다'), id: payload.id },
    });
  }
}

export async function handleDeleteCommitGroup(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: CommitGroupPayload = {}): Promise<void> {
  if (!payload.id) {
    await panel.webview.postMessage({
      type: 'COMMIT_GROUP_DELETE_FAILED',
      payload: { message: l10n('그룹을 삭제할 수 없습니다') },
    });
    return;
  }

  await deleteCommitGroup(context, payload.id);
  await panel.webview.postMessage({ type: 'COMMIT_GROUP_DELETED', payload: { id: payload.id } });
  await postCommitGroups(panel, context);
}

function getCommitGroupErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof CommitGroupNotFoundError) {
    return l10n('그룹을 찾을 수 없습니다');
  }

  return l10n(fallbackMessage);
}
