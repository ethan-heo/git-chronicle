import type { ChangedFile } from '../../types/commit';

export interface DirectoryTreeNode {
  name: string;
  path: string;
  children: TreeNode[];
}

export interface FileTreeLeaf {
  name: string;
  file: ChangedFile;
}

export type TreeNode = DirectoryTreeNode | FileTreeLeaf;

export function buildFileTree(files: ChangedFile[]): DirectoryTreeNode {
  const root: DirectoryTreeNode = { name: '', path: '', children: [] };

  for (const file of files) {
    const parts = file.path.split('/').filter(Boolean);

    if (parts.length === 0) {
      continue;
    }

    let current = root;

    for (let index = 0; index < parts.length - 1; index += 1) {
      const dirName = parts[index];
      const dirPath = parts.slice(0, index + 1).join('/');
      let child = current.children.find((node): node is DirectoryTreeNode => isDirectoryNode(node) && node.path === dirPath);

      if (!child) {
        child = { name: dirName, path: dirPath, children: [] };
        current.children.push(child);
      }

      current = child;
    }

    current.children.push({ name: parts[parts.length - 1], file });
  }

  sortTree(root);

  return root;
}

export function isDirectoryNode(node: TreeNode): node is DirectoryTreeNode {
  return 'children' in node;
}

function sortTree(node: DirectoryTreeNode): void {
  node.children.sort((left, right) => {
    const leftIsDir = isDirectoryNode(left);
    const rightIsDir = isDirectoryNode(right);

    if (leftIsDir !== rightIsDir) {
      return leftIsDir ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });

  for (const child of node.children) {
    if (isDirectoryNode(child)) {
      sortTree(child);
    }
  }
}
