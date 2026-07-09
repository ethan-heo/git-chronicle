import * as vscode from 'vscode';
import { analyzeSymbolGraph } from '../intraFileDependencyService';
import { l10n } from './shared';

export interface AnalyzeSymbolGraphPayload {
  paneId?: string;
  filePath?: string;
  commitHash?: string;
}

export async function handleAnalyzeSymbolGraph(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, payload: AnalyzeSymbolGraphPayload = {}): Promise<void> {
  const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (!repoPath || !payload.filePath) {
    await panel.webview.postMessage({
      type: 'SYMBOL_GRAPH_LOAD_FAILED',
      payload: { message: l10n('Failed to analyze symbol graph'), paneId: payload.paneId },
    });
    return;
  }

  try {
    const commitHash = payload.commitHash ?? '';
    const result = await analyzeSymbolGraph(repoPath, payload.filePath, commitHash);
    await panel.webview.postMessage({
      type: 'SYMBOL_GRAPH_LOADED',
      payload: {
        ...result,
        paneId: payload.paneId,
      },
    });
  } catch (error) {
    await panel.webview.postMessage({
      type: 'SYMBOL_GRAPH_LOAD_FAILED',
      payload: { message: error instanceof Error ? error.message : l10n('Failed to analyze symbol graph'), paneId: payload.paneId },
    });
  }
  void context;
}
