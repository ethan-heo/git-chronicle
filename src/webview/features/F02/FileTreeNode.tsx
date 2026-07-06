import type { FC, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FileActionButtons, FileStatusBadge } from '../../shared/components';
import type { ChangedFile } from '../../types/commit';
import { ANALYZABLE_FILE_PATTERN } from '../F04/graph';

interface FileTreeNodeProps {
  file: ChangedFile;
  name: string;
  depth: number;
  onCodeView: (file: ChangedFile) => void;
  onAIView: (file: ChangedFile) => void;
  onSymbolGraph: (file: ChangedFile) => void;
}

export const FileTreeNode: FC<FileTreeNodeProps> = ({
  file,
  name,
  depth,
  onCodeView,
  onAIView,
  onSymbolGraph,
}) => {
  const { t } = useTranslation();
  const isSymbolGraphSupported = ANALYZABLE_FILE_PATTERN.test(file.path);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter') {
      onCodeView(file);
    }
  };

  return (
    <div
      className="group relative flex min-w-0 items-center gap-1.5 py-[3px] pr-2 hover:bg-hover focus-visible:bg-hover focus-visible:outline-none"
      style={{ paddingLeft: `${10 + depth * 16}px` }}
      role="treeitem"
      tabIndex={0}
      aria-label={`${file.path} - ${getStatusLabel(file.status, t)}`}
      onKeyDown={onKeyDown}
    >
      <FileStatusBadge status={file.status} />
      <span className="inline-flex shrink-0 text-muted opacity-82" aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M4 1.75h5l3 3v9.5H4z" />
          <path d="M9 1.75v3h3" />
        </svg>
      </span>
      <span
        className={`min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-text ${
          file.status === 'D' ? 'text-muted line-through' : ''
        }`}
        title={file.oldPath ? `${file.oldPath} -> ${file.path}` : file.path}
      >
        {name}
      </span>
      <FileActionButtons
        className="absolute top-1/2 right-2 -translate-y-1/2 group-hover:pointer-events-auto group-hover:opacity-100 group-has-focus-visible:pointer-events-auto group-has-focus-visible:opacity-100"
        isVisible={false}
        onCodeView={() => onCodeView(file)}
        onAIView={() => onAIView(file)}
        onSymbolGraph={() => onSymbolGraph(file)}
        isSymbolGraphDisabled={!isSymbolGraphSupported}
      />
    </div>
  );
};

function getStatusLabel(status: ChangedFile['status'], t: (key: string) => string): string {
  const labels: Record<ChangedFile['status'], string> = {
    A: t('dependency.status_added'),
    M: t('dependency.status_modified'),
    D: t('dependency.status_deleted'),
    R: t('dependency.status_renamed'),
  };

  return labels[status];
}
