import { useState, type FC } from 'react';
import type { ChangedFile } from '../../types/commit';
import { FileTreeNode } from './FileTreeNode';
import type { DirectoryTreeNode } from './tree';
import { isDirectoryNode } from './tree';

interface DirectoryNodeProps {
  node: DirectoryTreeNode;
  depth: number;
  onCodeView: (file: ChangedFile) => void;
  onAIView: (file: ChangedFile) => void;
  onSymbolGraph: (file: ChangedFile) => void;
}

export const DirectoryNode: FC<DirectoryNodeProps> = ({
  node,
  depth,
  onCodeView,
  onAIView,
  onSymbolGraph,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div role="treeitem" aria-expanded={isExpanded} aria-label={node.name}>
      <button
        className="flex min-h-6 w-full min-w-0 items-center gap-[5px] bg-transparent py-[3px] pr-2.5 text-left text-text hover:bg-hover"
        type="button"
        style={{ paddingLeft: `${10 + depth * 16}px` }}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <span className="inline-flex w-3 shrink-0 justify-center text-xs text-muted" aria-hidden="true">
          {isExpanded ? '▾' : '▸'}
        </span>
        <span className="inline-flex shrink-0 text-link opacity-85" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1.75 3.25c0-.55.45-1 1-1h3.1l1.3 1.35h6.1c.55 0 1 .45 1 1v7.15c0 .55-.45 1-1 1H2.75c-.55 0-1-.45-1-1z" />
          </svg>
        </span>
        <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{node.name}</span>
      </button>
      {isExpanded ? (
        <div role="group">
          {node.children.map((child) =>
            isDirectoryNode(child) ? (
              <DirectoryNode
                key={child.path}
                node={child}
                depth={depth + 1}
                onCodeView={onCodeView}
                onAIView={onAIView}
                onSymbolGraph={onSymbolGraph}
              />
            ) : (
              <FileTreeNode
                key={child.file.path}
                file={child.file}
                name={child.name}
                depth={depth + 1}
                onCodeView={onCodeView}
                onAIView={onAIView}
                onSymbolGraph={onSymbolGraph}
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
};
