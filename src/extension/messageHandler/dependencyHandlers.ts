import * as vscode from 'vscode';
import { analyzeDependencies, DependencyCruiserNotFoundError } from '../dependencyService';
import { l10n } from './shared';

export interface AnalyzeDependenciesPayload {
  filePaths?: string[];
  commitHash?: string;
}

export async function handleAnalyzeDependencies(panel: vscode.WebviewPanel, payload: AnalyzeDependenciesPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath) {
    await panel.webview.postMessage({
      type: 'DEPENDENCIES_LOAD_FAILED',
      payload: {
        message: l10n('No Git repository detected'),
      },
    });
    return;
  }

  try {
    const edges = await analyzeDependencies(repoPath, payload.filePaths ?? [], payload.commitHash ?? '');

    await panel.webview.postMessage({
      type: 'DEPENDENCIES_LOADED',
      payload: {
        edges,
      },
    });
  } catch (error) {
    const message =
      error instanceof DependencyCruiserNotFoundError
        ? 'dependency-cruiser is not installed. Run pnpm install and try again.'
        : error instanceof Error
          ? error.message
          : 'Failed to analyze dependencies';

    await panel.webview.postMessage({
      type: 'DEPENDENCIES_LOAD_FAILED',
      payload: {
        message,
      },
    });
  }
}
