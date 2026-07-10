import * as vscode from 'vscode';
import {
  connectToGithub,
  fetchIssueDetail,
  fetchIssues,
  fetchPullRequestDetail,
  fetchPullRequests,
  getGithubAuthStatus,
} from '../githubService';

export interface FetchPullRequestsPayload {
  page?: number;
}

export interface FetchIssuesPayload {
  page?: number;
}

export interface FetchPRDetailPayload {
  number?: number;
}

export interface FetchIssueDetailPayload {
  number?: number;
}

function getRepoPath(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

export async function handleFetchGithubAuthState(panel: vscode.WebviewPanel): Promise<void> {
  const repoPath = getRepoPath();
  const status = repoPath ? await getGithubAuthStatus(repoPath) : 'no-remote';

  await panel.webview.postMessage({
    type: 'GITHUB_AUTH_STATE',
    payload: { status },
  });
}

export async function handleConnectGithub(panel: vscode.WebviewPanel): Promise<void> {
  const repoPath = getRepoPath();
  const status = repoPath ? await connectToGithub(repoPath) : 'no-remote';

  await panel.webview.postMessage({
    type: 'GITHUB_AUTH_STATE',
    payload: { status },
  });
}

export async function handleFetchPullRequests(panel: vscode.WebviewPanel, payload: FetchPullRequestsPayload = {}): Promise<void> {
  const repoPath = getRepoPath();

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'PULL_REQUESTS_LOAD_FAILED',
      payload: { message: 'No Git repository detected' },
    });
    return;
  }

  try {
    const page = payload.page ?? 1;
    const result = await fetchPullRequests(repoPath, page);
    await panel.webview.postMessage({
      type: 'PULL_REQUESTS_LOADED',
      payload: { items: result.items, hasMore: result.hasMore, page },
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'PULL_REQUESTS_LOAD_FAILED',
      payload: { message: error instanceof Error ? error.message : 'Failed to load pull requests' },
    });
  }
}

export async function handleFetchIssues(panel: vscode.WebviewPanel, payload: FetchIssuesPayload = {}): Promise<void> {
  const repoPath = getRepoPath();

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'ISSUES_LOAD_FAILED',
      payload: { message: 'No Git repository detected' },
    });
    return;
  }

  try {
    const page = payload.page ?? 1;
    const result = await fetchIssues(repoPath, page);
    await panel.webview.postMessage({
      type: 'ISSUES_LOADED',
      payload: { items: result.items, hasMore: result.hasMore, page },
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'ISSUES_LOAD_FAILED',
      payload: { message: error instanceof Error ? error.message : 'Failed to load issues' },
    });
  }
}

export async function handleFetchPRDetail(panel: vscode.WebviewPanel, payload: FetchPRDetailPayload = {}): Promise<void> {
  const repoPath = getRepoPath();

  if (!repoPath || !payload.number) {
    await panel.webview.postMessage({
      type: 'PR_DETAIL_LOAD_FAILED',
      payload: { number: payload.number, message: 'No pull request selected' },
    });
    return;
  }

  try {
    const detail = await fetchPullRequestDetail(repoPath, payload.number);
    await panel.webview.postMessage({
      type: 'PR_DETAIL_LOADED',
      payload: { detail },
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'PR_DETAIL_LOAD_FAILED',
      payload: { number: payload.number, message: error instanceof Error ? error.message : 'Failed to load pull request' },
    });
  }
}

export async function handleFetchIssueDetail(panel: vscode.WebviewPanel, payload: FetchIssueDetailPayload = {}): Promise<void> {
  const repoPath = getRepoPath();

  if (!repoPath || !payload.number) {
    await panel.webview.postMessage({
      type: 'ISSUE_DETAIL_LOAD_FAILED',
      payload: { number: payload.number, message: 'No issue selected' },
    });
    return;
  }

  try {
    const detail = await fetchIssueDetail(repoPath, payload.number);
    await panel.webview.postMessage({
      type: 'ISSUE_DETAIL_LOADED',
      payload: { detail },
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'ISSUE_DETAIL_LOAD_FAILED',
      payload: { number: payload.number, message: error instanceof Error ? error.message : 'Failed to load issue' },
    });
  }
}
