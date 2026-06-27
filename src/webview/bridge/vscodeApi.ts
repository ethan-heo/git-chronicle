interface VSCodeApi {
  postMessage: (message: { type: string; payload?: unknown }) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
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

export function getWebviewState<T>(): T | undefined {
  return vscode?.getState() as T | undefined;
}

export function setWebviewState<T>(state: T): void {
  vscode?.setState(state);
}
