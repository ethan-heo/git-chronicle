import { describe, expect, it } from 'vitest';
import type * as vscode from 'vscode';
import { createCommitGroup, deleteCommitGroup, loadCommitGroups, updateCommitGroup } from '../../src/extension/commitGroupService';

interface MementoLike {
  get<T>(key: string, defaultValue?: T): T | undefined;
  update(key: string, value: unknown): Promise<void>;
}

function createMemento(initialState: Record<string, unknown> = {}): MementoLike {
  const state = { ...initialState };

  return {
    get<T>(key: string, defaultValue?: T): T | undefined {
      return key in state ? (state[key] as T) : defaultValue;
    },
    async update(key: string, value: unknown): Promise<void> {
      state[key] = value;
    },
  };
}

function createContext(workspaceState: Record<string, unknown> = {}): vscode.ExtensionContext {
  return {
    workspaceState: createMemento(workspaceState),
  } as unknown as vscode.ExtensionContext;
}

describe('commitGroupService', () => {
  it('returns an empty list when no groups have been saved yet', () => {
    const context = createContext();

    expect(loadCommitGroups(context)).toEqual([]);
  });

  it('creates a group and persists it into workspaceState', async () => {
    const context = createContext();

    const group = await createCommitGroup(context, 'release prep', ['abc123', 'def456']);

    expect(group.name).toBe('release prep');
    expect(group.commitHashes).toEqual(['abc123', 'def456']);
    expect(loadCommitGroups(context)).toEqual([group]);
  });

  it('updates a group name and commit hashes without touching other groups', async () => {
    const context = createContext();
    const first = await createCommitGroup(context, 'first', ['a']);
    await createCommitGroup(context, 'second', ['b']);

    const updated = await updateCommitGroup(context, first.id, { name: 'first renamed', commitHashes: ['a', 'c'] });

    expect(updated.name).toBe('first renamed');
    expect(updated.commitHashes).toEqual(['a', 'c']);
    const groups = loadCommitGroups(context);
    expect(groups).toHaveLength(2);
    expect(groups.find((group) => group.id === first.id)?.name).toBe('first renamed');
    expect(groups.find((group) => group.name === 'second')?.commitHashes).toEqual(['b']);
  });

  it('throws when updating a group that does not exist', async () => {
    const context = createContext();

    await expect(updateCommitGroup(context, 'missing-id', { name: 'x' })).rejects.toThrow('Commit group not found: missing-id');
  });

  it('deletes a group by id', async () => {
    const context = createContext();
    const group = await createCommitGroup(context, 'temp', ['a']);

    await deleteCommitGroup(context, group.id);

    expect(loadCommitGroups(context)).toEqual([]);
  });
});
