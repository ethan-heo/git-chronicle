import { useState, type DragEvent, type FC, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface NoteFileNodeProps {
  relativePath: string;
  name: string;
  depth: number;
  isActive: boolean;
  isDragging?: boolean;
  onOpen: (relativePath: string) => void;
  onDelete: (relativePath: string) => void;
  onDragStateChange?: (relativePath: string | null) => void;
}

export const NoteFileNode: FC<NoteFileNodeProps> = ({
  relativePath,
  name,
  depth,
  isActive,
  isDragging = false,
  onOpen,
  onDelete,
  onDragStateChange,
}) => {
  const { t } = useTranslation();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter') {
      onOpen(relativePath);
    }
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>): void => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('application/x-git-author-explorer-note', relativePath);
    onDragStateChange?.(relativePath);
  };

  return (
    <div
      className={[
        'group flex min-w-0 items-center gap-1.5 rounded-sm py-[3px] pr-2 focus-visible:outline-none',
        isDragging ? 'bg-selected text-text opacity-65' : 'hover:bg-hover focus-visible:bg-hover',
        isActive ? 'bg-hover' : '',
      ].join(' ')}
      style={{ paddingLeft: `${10 + depth * 16}px` }}
      role="treeitem"
      tabIndex={0}
      draggable
      aria-label={relativePath}
      onClick={() => onOpen(relativePath)}
      onKeyDown={handleKeyDown}
      onDragStart={handleDragStart}
      onDragEnd={() => onDragStateChange?.(null)}
    >
      <span className="inline-flex shrink-0 text-muted opacity-82" aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M4 1.75h5l3 3v9.5H4z" />
          <path d="M9 1.75v3h3" />
        </svg>
      </span>
      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-text" title={relativePath}>
        {name}
      </span>
      <button
        type="button"
        className={[
          'shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100',
          isConfirmingDelete ? 'bg-danger/15 text-danger' : 'text-muted hover:bg-hover hover:text-text',
        ].join(' ')}
        aria-label={isConfirmingDelete ? t('note.delete_confirm') : t('note.delete')}
        onClick={(event) => {
          event.stopPropagation();
          if (isConfirmingDelete) {
            onDelete(relativePath);
            setIsConfirmingDelete(false);
            return;
          }

          setIsConfirmingDelete(true);
        }}
        onBlur={() => setIsConfirmingDelete(false)}
      >
        {isConfirmingDelete ? t('note.delete_confirm_short') : t('note.delete_short')}
      </button>
    </div>
  );
};
