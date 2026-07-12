import * as vscode from 'vscode';

export type SummaryScope = 'commit' | 'file';

export interface SummaryLinkContext {
  commitHash: string;
  filePath?: string | null;
  scope: SummaryScope;
  commitMessage?: string;
}

export interface StoredSummaryLink {
  relativePath: string;
  commitHash: string;
  filePath?: string | null;
  scope: SummaryScope;
  commitMessage?: string;
}

export interface ResolvedSummaryNoteLink {
  commitHash: string;
  filePath?: string | null;
  scope: SummaryScope;
  commitMessage: string;
}

type StoredSummaryLinks = Record<string, string | StoredSummaryLink>;

const SUMMARY_NOTE_LINKS_KEY = 'gitChronicle.summaryNoteLinks';

function toSummaryTargetKey(commitHash: string, filePath?: string | null): string {
  return `${commitHash}::${filePath ?? '__commit__'}`;
}

export function getSummaryTargetKey(context: SummaryLinkContext): string {
  return toSummaryTargetKey(context.commitHash, context.filePath);
}

function getStoredLinks(extensionContext: vscode.ExtensionContext): StoredSummaryLinks {
  return extensionContext.workspaceState.get<StoredSummaryLinks>(SUMMARY_NOTE_LINKS_KEY, {});
}

function normalizeStoredLink(
  targetKey: string,
  storedLink: string | StoredSummaryLink,
): StoredSummaryLink {
  if (typeof storedLink !== 'string') {
    return storedLink;
  }

  const [commitHash, rawFilePath = '__commit__'] = targetKey.split('::');
  return {
    relativePath: storedLink,
    commitHash,
    filePath: rawFilePath === '__commit__' ? null : rawFilePath,
    scope: rawFilePath === '__commit__' ? 'commit' : 'file',
  };
}

export function getLinkedNoteRelativePath(
  extensionContext: vscode.ExtensionContext,
  context: Omit<SummaryLinkContext, 'scope'>,
): string | null {
  const storedLink = getStoredLinks(extensionContext)[toSummaryTargetKey(context.commitHash, context.filePath)];
  return storedLink ? normalizeStoredLink(toSummaryTargetKey(context.commitHash, context.filePath), storedLink).relativePath : null;
}

export function getSummaryLinkByNoteRelativePath(
  extensionContext: vscode.ExtensionContext,
  relativePath: string,
): ResolvedSummaryNoteLink | null {
  const links = getStoredLinks(extensionContext);

  for (const [targetKey, storedLink] of Object.entries(links)) {
    const normalized = normalizeStoredLink(targetKey, storedLink);
    if (normalized.relativePath === relativePath && normalized.commitMessage) {
      return {
        commitHash: normalized.commitHash,
        filePath: normalized.filePath,
        scope: normalized.scope,
        commitMessage: normalized.commitMessage,
      };
    }
  }

  return null;
}

export async function linkSummaryToNote(
  extensionContext: vscode.ExtensionContext,
  context: SummaryLinkContext,
  relativePath: string,
): Promise<void> {
  const links = getStoredLinks(extensionContext);
  links[getSummaryTargetKey(context)] = {
    relativePath,
    commitHash: context.commitHash,
    filePath: context.filePath ?? null,
    scope: context.scope,
    commitMessage: context.commitMessage,
  };
  await extensionContext.workspaceState.update(SUMMARY_NOTE_LINKS_KEY, links);
}

export async function moveLinkedSummaryNote(
  extensionContext: vscode.ExtensionContext,
  fromRelativePath: string,
  toRelativePath: string,
): Promise<void> {
  const links = getStoredLinks(extensionContext);
  let didChange = false;

  for (const [targetKey, storedLink] of Object.entries(links)) {
    const normalized = normalizeStoredLink(targetKey, storedLink);
    if (normalized.relativePath === fromRelativePath) {
      links[targetKey] = typeof storedLink === 'string'
        ? toRelativePath
        : { ...storedLink, relativePath: toRelativePath };
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

  for (const [targetKey, storedLink] of Object.entries(links)) {
    if (normalizeStoredLink(targetKey, storedLink).relativePath === relativePath) {
      delete links[targetKey];
      didChange = true;
    }
  }

  if (didChange) {
    await extensionContext.workspaceState.update(SUMMARY_NOTE_LINKS_KEY, links);
  }
}
