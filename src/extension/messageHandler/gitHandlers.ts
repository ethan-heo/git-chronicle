import * as vscode from 'vscode';
import { loadAISettingsState } from '../aiProviderService';
import { fetchChangedFiles, fetchCommitCount, fetchCommits, fetchFileDiff, GitRepositoryNotFoundError } from '../gitService';

export interface FetchCommitsPayload {
  page?: number;
  pageSize?: number;
  requestId?: number;
  filterDateStart?: string | null;
  filterDateEnd?: string | null;
  filterAuthor?: string | null;
  filterKeyword?: string;
  filterExcludeKeyword?: string;
  sortOrder?: 'desc' | 'asc';
}

export interface FetchChangedFilesPayload {
  paneId?: string;
  commitHash?: string;
  commitMessage?: string;
  savePath?: string | null;
}

export interface FetchFileDiffPayload {
  commitHash?: string;
  filePath?: string;
}

export async function handleFetchCommits(panel: vscode.WebviewPanel, payload: FetchCommitsPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'GIT_REPOSITORY_NOT_FOUND',
      payload: {
        message: 'No Git repository detected',
      },
    });
    return;
  }

  try {
    const page = payload.page ?? 0;
    const pageSize = payload.pageSize ?? 200;
    const requestId = payload.requestId;
    const excludeKeywords = (payload.filterExcludeKeyword ?? '')
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
    const result = await fetchCommits({
      repoPath,
      page,
      pageSize,
      dateStart: payload.filterDateStart,
      dateEnd: payload.filterDateEnd,
      author: payload.filterAuthor,
      keyword: payload.filterKeyword,
      sortOrder: payload.sortOrder,
      excludeKeywords,
    });
    const filteredCount = result.rawCount;
    const hasMore = payload.sortOrder === 'asc'
      ? (await fetchCommitCount({
          repoPath,
          dateStart: payload.filterDateStart,
          dateEnd: payload.filterDateEnd,
          author: payload.filterAuthor,
          keyword: payload.filterKeyword,
        })) > (page + 1) * pageSize
      : filteredCount >= pageSize;

    await panel.webview.postMessage({
      type: 'COMMITS_LOADED',
      payload: {
        commits: result.commits,
        page,
        pageSize,
        ...(requestId !== undefined ? { requestId } : {}),
        hasMore,
      },
    });
  } catch (error) {
    if (error instanceof GitRepositoryNotFoundError) {
      await panel.webview.postMessage({
        type: 'GIT_REPOSITORY_NOT_FOUND',
        payload: {
          message: 'No Git repository detected',
        },
      });
      return;
    }

    await panel.webview.postMessage({
      type: 'COMMITS_LOAD_FAILED',
      payload: {
        message: error instanceof Error ? error.message : 'Failed to load commit list',
      },
    });
  }
}

export async function handleFetchChangedFiles(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: FetchChangedFilesPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'CHANGED_FILES_LOAD_FAILED',
      payload: {
        message: 'No Git repository detected',
      },
    });
    return;
  }

  if (!payload.commitHash) {
    await panel.webview.postMessage({
      type: 'CHANGED_FILES_LOAD_FAILED',
      payload: {
        message: 'No commit selected',
        commitHash: payload.commitHash,
        paneId: payload.paneId,
      },
    });
    return;
  }

  try {
    const settings = loadAISettingsState(context);
    const changedFiles = await fetchChangedFiles(repoPath, payload.commitHash, payload.savePath ?? settings.savePath, payload.commitMessage);

    await panel.webview.postMessage({
      type: 'CHANGED_FILES_LOADED',
      payload: {
        files: changedFiles.files,
        hasSavedCommitSummary: changedFiles.hasSavedCommitSummary,
        commitHash: payload.commitHash,
        paneId: payload.paneId,
      },
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'CHANGED_FILES_LOAD_FAILED',
      payload: {
        message: error instanceof Error ? error.message : 'Failed to load changed files',
        commitHash: payload.commitHash,
        paneId: payload.paneId,
      },
    });
  }
}

export async function handleFetchFileDiff(panel: vscode.WebviewPanel, payload: FetchFileDiffPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOAD_FAILED',
      payload: {
        message: 'No Git repository detected',
      },
    });
    return;
  }

  if (!payload.commitHash || !payload.filePath) {
    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOAD_FAILED',
      payload: {
        message: 'No file selected',
      },
    });
    return;
  }

  try {
    const diff = await fetchFileDiff(repoPath, payload.commitHash, payload.filePath);

    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOADED',
      payload: diff,
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOAD_FAILED',
      payload: {
        message: error instanceof Error ? error.message : 'Failed to load diff',
      },
    });
  }
}
