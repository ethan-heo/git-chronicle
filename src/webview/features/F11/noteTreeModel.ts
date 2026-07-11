import type { NoteEntry } from '../../types/note';

export interface NoteDirectoryNode {
  kind: 'directory';
  name: string;
  path: string;
  children: NoteTreeNode[];
}

export interface NoteFileLeaf {
  kind: 'file';
  name: string;
  entry: NoteEntry;
}

export type NoteTreeNode = NoteDirectoryNode | NoteFileLeaf;

export function buildNoteTree(entries: NoteEntry[]): NoteDirectoryNode {
  const root: NoteDirectoryNode = { kind: 'directory', name: '', path: '', children: [] };

  for (const entry of entries) {
    const parts = entry.relativePath.split('/').filter(Boolean);
    if (parts.length === 0) {
      continue;
    }

    let current = root;

    for (let index = 0; index < parts.length - 1; index += 1) {
      const dirName = parts[index];
      const dirPath = parts.slice(0, index + 1).join('/');
      let child = current.children.find((node): node is NoteDirectoryNode => isNoteDirectoryNode(node) && node.path === dirPath);

      if (!child) {
        child = { kind: 'directory', name: dirName, path: dirPath, children: [] };
        current.children.push(child);
      }

      current = child;
    }

    current.children.push({
      kind: 'file',
      name: parts[parts.length - 1],
      entry,
    });
  }

  sortNoteTree(root);
  return root;
}

export function isNoteDirectoryNode(node: NoteTreeNode): node is NoteDirectoryNode {
  return node.kind === 'directory';
}

function sortNoteTree(node: NoteDirectoryNode): void {
  node.children.sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === 'directory' ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });

  for (const child of node.children) {
    if (child.kind === 'directory') {
      sortNoteTree(child);
    }
  }
}
