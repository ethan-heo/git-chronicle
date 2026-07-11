import * as vscode from 'vscode';

export type SummaryScope = 'commit' | 'file';

export interface SummaryLinkContext {
  commitHash: string;
  filePath?: string | null;
  scope: SummaryScope;
}

const SUMMARY_NOTE_LINKS_KEY = 'gitChronicle.summaryNoteLinks';

function toSummaryTargetKey(commitHash: string, filePath?: string | null): string {
  return `${commitHash}::${filePath ?? '__commit__'}`;
}

export function getSummaryTargetKey(context: SummaryLinkContext): string {
  return toSummaryTargetKey(context.commitHash, context.filePath);
}

function getStoredLinks(extensionContext: vscode.ExtensionContext): Record<string, string> {
  return extensionContext.workspaceState.get<Record<string, string>>(SUMMARY_NOTE_LINKS_KEY, {});
}

export function getLinkedNoteRelativePath(
  extensionContext: vscode.ExtensionContext,
  context: Omit<SummaryLinkContext, 'scope'>,
): string | null {
  return getStoredLinks(extensionContext)[toSummaryTargetKey(context.commitHash, context.filePath)] ?? null;
}

export async function linkSummaryToNote(
  extensionContext: vscode.ExtensionContext,
  context: SummaryLinkContext,
  relativePath: string,
): Promise<void> {
  const links = getStoredLinks(extensionContext);
  links[getSummaryTargetKey(context)] = relativePath;
  await extensionContext.workspaceState.update(SUMMARY_NOTE_LINKS_KEY, links);
}

export async function moveLinkedSummaryNote(
  extensionContext: vscode.ExtensionContext,
  fromRelativePath: string,
  toRelativePath: string,
): Promise<void> {
  const links = getStoredLinks(extensionContext);
  let didChange = false;

  for (const [targetKey, relativePath] of Object.entries(links)) {
    if (relativePath === fromRelativePath) {
      links[targetKey] = toRelativePath;
      didChange = true;
    }
  }

  if (didChange) {
    await extensionContext.workspaceState.update(SUMMARY_NOTE_LINKS_KEY, links);
  }
}

export async function removeLinkedSummaryNote(
  extensionContext: vscode.ExtensionContext,
  relativePath: string,
): Promise<void> {
  const links = getStoredLinks(extensionContext);
  let didChange = false;

  for (const [targetKey, linkedPath] of Object.entries(links)) {
    if (linkedPath === relativePath) {
      delete links[targetKey];
      didChange = true;
    }
  }

  if (didChange) {
    await extensionContext.workspaceState.update(SUMMARY_NOTE_LINKS_KEY, links);
  }
}
