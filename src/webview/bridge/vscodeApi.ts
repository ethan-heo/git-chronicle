interface VSCodeApi {
  postMessage: (message: { type: string; payload?: unknown }) => void;
}

declare global {
  interface Window {
    acquireVsCodeApi?: () => VSCodeApi;
  }
}

const vscode = window.acquireVsCodeApi?.();

export function postMessage(type: string, payload?: unknown): void {
  vscode?.postMessage({ type, payload });
}

export function isVSCodeRuntime(): boolean {
  return Boolean(vscode);
}
