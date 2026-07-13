import * as vscode from 'vscode';
import { GitChroniclePanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext): void {
  const openCommand = vscode.commands.registerCommand('gitChronicle.open', () => {
    GitChroniclePanel.createOrShow(context);
  });

  const openInNewWindowCommand = vscode.commands.registerCommand('gitChronicle.openInNewWindow', () => {
    GitChroniclePanel.createOrShowInNewWindow(context);
  });

  const closeActiveTabCommand = vscode.commands.registerCommand('gitChronicle.closeActiveTab', () => {
    GitChroniclePanel.closeActiveTab();
  });

  context.subscriptions.push(openCommand, openInNewWindowCommand, closeActiveTabCommand);
}

export function deactivate(): void {
  GitChroniclePanel.disposeCurrent();
}
