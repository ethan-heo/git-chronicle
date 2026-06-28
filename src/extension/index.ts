import * as vscode from 'vscode';
import { GitRewindPanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext): void {
  const openCommand = vscode.commands.registerCommand('gitRewind.open', () => {
    GitRewindPanel.createOrShow(context);
  });

  context.subscriptions.push(openCommand);
}

export function deactivate(): void {
  GitRewindPanel.disposeCurrent();
}
