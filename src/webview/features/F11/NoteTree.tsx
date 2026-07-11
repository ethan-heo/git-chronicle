import { useState, type DragEvent, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import type { NoteEntry } from '../../types/note';
import { NoteDirectoryNode } from './NoteDirectoryNode';
import { buildNoteTree, isNoteDirectoryNode } from './noteTreeModel';
import { NoteFileNode } from './NoteFileNode';

interface NoteTreeProps {
  entries: NoteEntry[];
  isLoading: boolean;
  error: string | null;
  activeRelativePath: string | null;
  onRetry: () => void;
  onOpen: (relativePath: string) => void;
  onDelete: (relativePath: string) => void;
  onMove: (fromRelativePath: string, toRelativePath: string) => void;
}

export const NoteTree: FC<NoteTreeProps> = ({
  entries,
  isLoading,
  error,
  activeRelativePath,
  onRetry,
  onOpen,
  onDelete,
  onMove,
}) => {
  const { t } = useTranslation();
  const [draggedRelativePath, setDraggedRelativePath] = useState<string | null>(null);
  const [isRootDragOver, setIsRootDragOver] = useState(false);

  if (isLoading) {
    return <div className="flex min-h-0 flex-1 items-center justify-center p-6"><LoadingState label={t('note.tree_loading')} size="lg" /></div>;
  }

  if (error) {
    return <div className="flex min-h-0 flex-1 items-center justify-center p-6"><ErrorState message={error} onRetry={onRetry} /></div>;
  }

  if (entries.length === 0) {
    return <div className="flex min-h-0 flex-1 items-center justify-center p-6"><EmptyState message={t('note.tree_empty')} /></div>;
  }

  const root = buildNoteTree(entries);

  const handleRootDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const fromRelativePath = event.dataTransfer.getData('application/x-git-author-explorer-note');

    setIsRootDragOver(false);
    setDraggedRelativePath(null);

    if (!fromRelativePath) {
      return;
    }

    const fileName = fromRelativePath.split('/').at(-1) ?? fromRelativePath;
    if (fileName !== fromRelativePath) {
      onMove(fromRelativePath, fileName);
    }
  };

  return (
    <div
      role="tree"
      className={[
        'min-h-0 flex-1 overflow-auto rounded-sm py-1 transition-colors',
        draggedRelativePath && isRootDragOver
          ? 'bg-[var(--gae-color-surface-drop)] shadow-[inset_2px_0_0_var(--gae-color-accent-primary)]'
          : 'bg-transparent',
      ].join(' ')}
      onDragEnd={() => setDraggedRelativePath(null)}
      onDragOver={(event) => {
        event.preventDefault();
        setIsRootDragOver(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsRootDragOver(false);
        }
      }}
      onDrop={handleRootDrop}
    >
      {root.children.map((child) => isNoteDirectoryNode(child) ? (
        <NoteDirectoryNode
          key={child.path}
          node={child}
          depth={0}
          activeRelativePath={activeRelativePath}
          draggedRelativePath={draggedRelativePath}
          onOpen={onOpen}
          onDelete={onDelete}
          onMove={onMove}
          onDragStateChange={setDraggedRelativePath}
          onRootDragStateChange={setIsRootDragOver}
        />
      ) : (
        <NoteFileNode
          key={child.entry.relativePath}
          relativePath={child.entry.relativePath}
          name={child.name}
          depth={0}
          isActive={activeRelativePath === child.entry.relativePath}
          isDragging={draggedRelativePath === child.entry.relativePath}
          onOpen={onOpen}
          onDelete={onDelete}
          onDragStateChange={setDraggedRelativePath}
        />
      ))}
    </div>
  );
};
