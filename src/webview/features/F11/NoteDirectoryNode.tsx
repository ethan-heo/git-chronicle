import { useState, type DragEvent, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { NoteTreeNode } from './noteTreeModel';
import { isNoteDirectoryNode } from './noteTreeModel';
import { NoteFileNode } from './NoteFileNode';
import type { NoteDirectoryNode as NoteDirectoryNodeType } from './noteTreeModel';

interface NoteDirectoryNodeProps {
  node: NoteDirectoryNodeType;
  depth: number;
  activeRelativePath: string | null;
  draggedRelativePath: string | null;
  onOpen: (relativePath: string) => void;
  onDelete: (relativePath: string) => void;
  onMove: (fromRelativePath: string, toRelativePath: string) => void;
  onDragStateChange: (relativePath: string | null) => void;
  onRootDragStateChange: (isDragOver: boolean) => void;
}

export const NoteDirectoryNode: FC<NoteDirectoryNodeProps> = ({
  node,
  depth,
  activeRelativePath,
  draggedRelativePath,
  onOpen,
  onDelete,
  onMove,
  onDragStateChange,
  onRootDragStateChange,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (event: DragEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    event.stopPropagation();
    const fromRelativePath = event.dataTransfer.getData('application/x-git-author-explorer-note');
    setIsDragOver(false);
    onRootDragStateChange(false);

    if (!fromRelativePath) {
      return;
    }

    const fileName = fromRelativePath.split('/').at(-1) ?? fromRelativePath;
    const toRelativePath = `${node.path}/${fileName}`;
    if (toRelativePath !== fromRelativePath) {
      onMove(fromRelativePath, toRelativePath);
    }
  };

  return (
    <div role="treeitem" aria-expanded={isExpanded} aria-label={node.name}>
      <button
        className={[
          'flex min-h-6 w-full min-w-0 items-center gap-[5px] rounded-sm py-[3px] pr-2.5 text-left text-text transition-colors',
          isDragOver
            ? 'bg-[var(--gae-color-surface-drop)] shadow-[inset_2px_0_0_var(--gae-color-accent-primary)]'
            : 'bg-transparent hover:bg-hover',
        ].join(' ')}
        type="button"
        style={{ paddingLeft: `${10 + depth * 16}px` }}
        onClick={() => setIsExpanded((current) => !current)}
        aria-label={t('note.section_title')}
        title={node.name}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragOver(true);
          onRootDragStateChange(false);
        }}
        onDragLeave={(event) => {
          event.stopPropagation();
          setIsDragOver(false);
        }}
        onDrop={handleDrop}
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
          {node.children.map((child: NoteTreeNode) => isNoteDirectoryNode(child) ? (
            <NoteDirectoryNode
              key={child.path}
              node={child}
              depth={depth + 1}
              activeRelativePath={activeRelativePath}
              draggedRelativePath={draggedRelativePath}
              onOpen={onOpen}
              onDelete={onDelete}
              onMove={onMove}
              onDragStateChange={onDragStateChange}
              onRootDragStateChange={onRootDragStateChange}
            />
          ) : (
            <NoteFileNode
              key={child.entry.relativePath}
              relativePath={child.entry.relativePath}
              name={child.name}
              depth={depth + 1}
              isActive={activeRelativePath === child.entry.relativePath}
              isDragging={draggedRelativePath === child.entry.relativePath}
              onOpen={onOpen}
              onDelete={onDelete}
              onDragStateChange={onDragStateChange}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
