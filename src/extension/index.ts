import * as vscode from 'vscode';
import { GitChroniclePanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext): void {
  const openCommand = vscode.commands.registerCommand('gitChronicle.open', () => {
    GitChroniclePanel.createOrShow(context);
  });

  const openInNewWindowCommand = vscode.commands.registerCommand('gitChronicle.openInNewWindow', () => {
    GitChroniclePanel.createOrShowInNewWindow(context);
  });

  context.subscriptions.push(openCommand, openInNewWindowCommand);
}

export function deactivate(): void {
  GitChroniclePanel.disposeCurrent();
}
