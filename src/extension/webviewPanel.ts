import * as vscode from 'vscode';
import { registerMessageHandler } from './messageHandler';

export class GitChroniclePanel {
  private static currentPanel: GitChroniclePanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this.panel = panel;
    this.panel.webview.html = this.getHtmlForWebview(context.extensionUri, vscode.env.language);

    registerMessageHandler(this.panel, context);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public static createOrShow(context: vscode.ExtensionContext): void {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (GitChroniclePanel.currentPanel) {
      GitChroniclePanel.currentPanel.panel.webview.html = GitChroniclePanel.currentPanel.getHtmlForWebview(
        context.extensionUri,
        vscode.env.language,
      );
      GitChroniclePanel.currentPanel.panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'gitChronicle',
      'GitChronicle',
      column,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview')],
      },
    );

    GitChroniclePanel.currentPanel = new GitChroniclePanel(panel, context);
  }

  public static disposeCurrent(): void {
    GitChroniclePanel.currentPanel?.dispose();
  }

  private dispose(): void {
    GitChroniclePanel.currentPanel = undefined;

    while (this.disposables.length > 0) {
      const disposable = this.disposables.pop();
      disposable?.dispose();
    }
  }

  private getHtmlForWebview(extensionUri: vscode.Uri, language: string): string {
    const webview = this.panel.webview;
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'assets', 'index.js'),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'assets', 'index.css'),
    );
    const normalizedLanguage = normalizeLanguage(language);
    const nonce = getNonce();

    return `<!doctype html>
<html lang="${normalizedLanguage}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';" />
    <link href="${styleUri}" rel="stylesheet" />
    <title>GitChronicle</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}">window.__LANG__ = ${JSON.stringify(normalizedLanguage)};</script>
    <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
  </body>
</html>`;
  }
}

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let nonce = '';

  for (let index = 0; index < 32; index += 1) {
    nonce += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return nonce;
}

function normalizeLanguage(language: string): 'en' | 'ko' {
  return language.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}
