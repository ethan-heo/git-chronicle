import { randomUUID } from 'node:crypto';
import * as vscode from 'vscode';

const COMMIT_GROUPS_KEY = 'gitChronicle.commitGroups';

export interface CommitGroup {
  id: string;
  name: string;
  commitHashes: string[];
  createdAt: string;
  updatedAt: string;
}

export class CommitGroupNotFoundError extends Error {
  constructor(id: string) {
    super(`Commit group not found: ${id}`);
    this.name = 'CommitGroupNotFoundError';
  }
}

export function loadCommitGroups(context: vscode.ExtensionContext): CommitGroup[] {
  return context.workspaceState.get<CommitGroup[]>(COMMIT_GROUPS_KEY, []);
}

export function findCommitGroup(context: vscode.ExtensionContext, id: string): CommitGroup | null {
  return loadCommitGroups(context).find((group) => group.id === id) ?? null;
}

export async function createCommitGroup(context: vscode.ExtensionContext, name: string, commitHashes: string[]): Promise<CommitGroup> {
  const now = new Date().toISOString();
  const group: CommitGroup = {
    id: randomUUID(),
    name,
    commitHashes,
    createdAt: now,
    updatedAt: now,
  };

  await context.workspaceState.update(COMMIT_GROUPS_KEY, [...loadCommitGroups(context), group]);

  return group;
}

export async function updateCommitGroup(
  context: vscode.ExtensionContext,
  id: string,
  updates: { name?: string; commitHashes?: string[] },
): Promise<CommitGroup> {
  const groups = loadCommitGroups(context);
  const index = groups.findIndex((group) => group.id === id);

  if (index === -1) {
    throw new CommitGroupNotFoundError(id);
  }

  const updatedGroup: CommitGroup = {
    ...groups[index],
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.commitHashes !== undefined ? { commitHashes: updates.commitHashes } : {}),
    updatedAt: new Date().toISOString(),
  };
  const nextGroups = [...groups];
  nextGroups[index] = updatedGroup;

  await context.workspaceState.update(COMMIT_GROUPS_KEY, nextGroups);

  return updatedGroup;
}

export async function deleteCommitGroup(context: vscode.ExtensionContext, id: string): Promise<void> {
  await context.workspaceState.update(COMMIT_GROUPS_KEY, loadCommitGroups(context).filter((group) => group.id !== id));
}
