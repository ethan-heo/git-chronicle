import * as vscode from 'vscode';
import { GitChroniclePanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext): void {
  const openCommand = vscode.commands.registerCommand('gitChronicle.open', () => {
    GitChroniclePanel.createOrShow(context);
  });

  context.subscriptions.push(openCommand);
}

export function deactivate(): void {
  GitChroniclePanel.disposeCurrent();
}
