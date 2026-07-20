import * as vscode from 'vscode';
import { loadAISettingsState } from '../aiProviderService';
import { findCommitGroup } from '../commitGroupService';
import { fetchBranches, fetchChangedFiles, fetchCommitCount, fetchCommits, fetchFileDiff, GitRepositoryNotFoundError } from '../gitService';

export interface FetchCommitsPayload {
  page?: number;
  pageSize?: number;
  requestId?: number;
  filterBranch?: string | null;
  filterDateStart?: string | null;
  filterDateEnd?: string | null;
  filterAuthor?: string | null;
  filterKeyword?: string;
  filterExcludeKeyword?: string;
  filterGroupId?: string | null;
  sortOrder?: 'desc' | 'asc';
}

export interface FetchBranchesPayload {
  refresh?: boolean;
}

export interface FetchChangedFilesPayload {
  paneId?: string;
  commitHash?: string;
  commitMessage?: string;
  savePath?: string | null;
}

export interface FetchFileDiffPayload {
  tabId?: string;
  commitHash?: string;
  filePath?: string;
}

export async function handleFetchCommits(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: FetchCommitsPayload = {}): Promise<void> {
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

    let commitHashes: string[] | undefined;
    if (payload.filterGroupId) {
      commitHashes = findCommitGroup(context, payload.filterGroupId)?.commitHashes ?? [];

      if (commitHashes.length === 0) {
        await panel.webview.postMessage({
          type: 'COMMITS_LOADED',
          payload: {
            commits: [],
            page: 0,
            pageSize,
            ...(requestId !== undefined ? { requestId } : {}),
            hasMore: false,
          },
        });
        return;
      }
    }

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
      branch: commitHashes ? null : payload.filterBranch,
      commitHashes,
    });
    const filteredCount = result.rawCount;
    const hasMore = commitHashes
      ? false
      : payload.sortOrder === 'asc'
        ? (await fetchCommitCount({
            repoPath,
            branch: payload.filterBranch,
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
        page: commitHashes ? 0 : page,
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

export async function handleFetchBranches(panel: vscode.WebviewPanel, payload: FetchBranchesPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'BRANCHES_LOAD_FAILED',
      payload: {
        message: 'No Git repository detected',
        refresh: payload.refresh ?? false,
      },
    });
    return;
  }

  try {
    const branches = await fetchBranches(repoPath, { refresh: payload.refresh });

    await panel.webview.postMessage({
      type: 'BRANCHES_LOADED',
      payload: {
        branches,
        refresh: payload.refresh ?? false,
      },
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'BRANCHES_LOAD_FAILED',
      payload: {
        message: error instanceof Error ? error.message : 'Failed to load branches',
        refresh: payload.refresh ?? false,
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
        tabId: payload.tabId,
      },
    });
    return;
  }

  if (!payload.commitHash || !payload.filePath) {
    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOAD_FAILED',
      payload: {
        message: 'No file selected',
        tabId: payload.tabId,
      },
    });
    return;
  }

  try {
    const diff = await fetchFileDiff(repoPath, payload.commitHash, payload.filePath);

    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOADED',
      payload: {
        ...diff,
        tabId: payload.tabId,
      },
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'FILE_DIFF_LOAD_FAILED',
      payload: {
        message: error instanceof Error ? error.message : 'Failed to load diff',
        tabId: payload.tabId,
      },
    });
  }
}
