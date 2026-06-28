import type { FC, KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { FileActionButtons, FileStatusBadge, SavedBadge } from '../../shared/components';
import type { ChangedFile } from '../../types/commit';

interface FileTreeNodeProps {
  file: ChangedFile;
  name: string;
  depth: number;
  onCodeView: (file: ChangedFile) => void;
  onAISummary: (file: ChangedFile) => void;
}

export const FileTreeNode: FC<FileTreeNodeProps> = ({ file, name, depth, onCodeView, onAISummary }) => {
  const { t } = useTranslation();
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter') {
      onCodeView(file);
      return;
    }

    if (event.key.toLowerCase() === 'a') {
      onAISummary(file);
    }
  };

  return (
    <div
      className={`changed-file-row changed-file-row-${file.status.toLowerCase()}`}
      style={{ paddingLeft: `${10 + depth * 16}px` }}
      role="treeitem"
      tabIndex={0}
      aria-label={`${file.path} - ${getStatusLabel(file.status, t)}`}
      onKeyDown={onKeyDown}
    >
      <FileStatusBadge status={file.status} />
      <span className="changed-file-icon" aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M4 1.75h5l3 3v9.5H4z" />
          <path d="M9 1.75v3h3" />
        </svg>
      </span>
      <span className="changed-file-name" title={file.oldPath ? `${file.oldPath} -> ${file.path}` : file.path}>
        {name}
      </span>
      <SavedBadge isVisible={file.hasSavedSummary} />
      <FileActionButtons isVisible={false} onCodeView={() => onCodeView(file)} onAISummary={() => onAISummary(file)} />
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
