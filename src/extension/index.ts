import * as vscode from 'vscode';
import { GitAuthorExplorerPanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext): void {
  const openCommand = vscode.commands.registerCommand('gitAuthorExplorer.open', () => {
    GitAuthorExplorerPanel.createOrShow(context.extensionUri);
  });

  context.subscriptions.push(openCommand);
}

export function deactivate(): void {
  GitAuthorExplorerPanel.disposeCurrent();
}
