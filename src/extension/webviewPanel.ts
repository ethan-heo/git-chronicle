import * as fs from 'fs';
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

  public static async createOrShowInNewWindow(context: vscode.ExtensionContext): Promise<void> {
    GitChroniclePanel.createOrShow(context);
    await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
  }

  public static disposeCurrent(): void {
    GitChroniclePanel.currentPanel?.dispose();
  }

  public static closeActiveTab(): void {
    GitChroniclePanel.currentPanel?.panel.webview.postMessage({ type: 'CLOSE_ACTIVE_TAB' });
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
    const scriptPath = vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'assets', 'index.js');
    const stylePath = vscode.Uri.joinPath(extensionUri, 'dist', 'webview', 'assets', 'index.css');
    // vite가 index.js/index.css를 콘텐츠 해시 없이 고정 파일명으로 내보내기 때문에, 빌드를
    // 다시 해도 URI 문자열이 그대로면 webview(Electron/Chromium)가 이전 빌드를 캐시에서 계속
    // 서빙할 수 있다. 빌드 파일의 mtime을 쿼리로 붙여 재빌드마다 URI 자체가 바뀌도록 한다.
    const cacheBuster = getCacheBuster(scriptPath.fsPath);
    const scriptUri = `${webview.asWebviewUri(scriptPath).toString()}?v=${cacheBuster}`;
    const styleUri = `${webview.asWebviewUri(stylePath).toString()}?v=${cacheBuster}`;
    const normalizedLanguage = normalizeLanguage(language);
    const nonce = getNonce();

    return `<!doctype html>
<html lang="${normalizedLanguage}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'strict-dynamic';" />
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

function getCacheBuster(filePath: string): number {
  try {
    return fs.statSync(filePath).mtimeMs;
  } catch {
    return Date.now();
  }
}
