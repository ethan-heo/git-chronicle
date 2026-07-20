import * as fs from 'fs';
import * as vscode from 'vscode';
import { registerMessageHandler } from './messageHandler';

export class GitChroniclePanel {
  private static currentPanel: GitChroniclePanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private appliedScriptFile: string;

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this.panel = panel;
    const entry = readManifestEntry(context.extensionUri);
    this.appliedScriptFile = entry.file;
    this.panel.webview.html = this.getHtmlForWebview(context.extensionUri, vscode.env.language, entry);

    registerMessageHandler(this.panel, context);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public static createOrShow(context: vscode.ExtensionContext): void {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    if (GitChroniclePanel.currentPanel) {
      const current = GitChroniclePanel.currentPanel;
      const latestEntry = readManifestEntry(context.extensionUri);

      // 웹뷰가 이미 최신 빌드를 서빙 중이면 webview.html을 다시 대입하지 않는다. html 재대입은
      // 웹뷰 스크립트 전체를 처음부터 다시 실행시키므로(acquireVsCodeApi() 재호출 등), 그 사이
      // 이전 스크립트 컨텍스트에서 진행 중이던 작업(AI 요약 스트리밍, Mermaid 렌더링 등)과
      // 경쟁하며 "An instance of the VS Code API has already been acquired" 같은 오류를 낼 수 있다.
      if (latestEntry.file !== current.appliedScriptFile) {
        current.appliedScriptFile = latestEntry.file;
        current.panel.webview.html = current.getHtmlForWebview(context.extensionUri, vscode.env.language, latestEntry);
      }

      current.panel.reveal(column);
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

  private getHtmlForWebview(extensionUri: vscode.Uri, language: string, entry: ManifestEntry): string {
    const webview = this.panel.webview;
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview', entry.file)).toString();
    const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'dist', 'webview', entry.css[0])).toString();
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

interface ManifestEntry {
  file: string;
  css: string[];
}

// Vite가 콘텐츠 해시를 파일명에 포함시켜 내보내므로(예: index-B7CiKlxg.js), 빌드가 바뀌면
// 파일명 자체가 바뀌어 별도의 캐시 버스팅 없이도 항상 최신 빌드가 로드된다. 이 해시 파일명은
// Mermaid 다이어그램 청크 등 다른 청크가 엔트리를 참조할 때도 Rollup이 동일하게 사용하므로,
// 엔트리 스크립트 URL에 쿼리 스트링을 임의로 붙이면 청크의 상대 경로 import("./index-*.js")와
// URL이 어긋나 브라우저가 엔트리를 두 번 로드·실행하게 된다(acquireVsCodeApi() 중복 호출로 인한
// "already been acquired" 오류의 원인이었다). 그래서 manifest에 기록된 실제 파일명을 그대로 쓴다.
function readManifestEntry(extensionUri: vscode.Uri): ManifestEntry {
  const manifestPath = vscode.Uri.joinPath(extensionUri, 'dist', 'webview', '.vite', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath.fsPath, 'utf-8')) as Record<string, ManifestEntry>;

  return manifest['index.html'];
}
