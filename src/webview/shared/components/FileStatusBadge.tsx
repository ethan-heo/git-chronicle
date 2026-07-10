import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export type FileStatus = 'A' | 'M' | 'D' | 'R';

const STATUS_LABEL_KEYS: Record<FileStatus, string> = {
  A: 'dependency.status_added',
  M: 'dependency.status_modified',
  D: 'dependency.status_deleted',
  R: 'dependency.status_renamed',
};

export const FileStatusBadge: FC<{ status: FileStatus }> = ({ status }) => {
  const { t } = useTranslation();
  const statusColorClassName = {
    A: 'text-added',
    M: 'text-modified',
    D: 'text-deleted',
    R: 'text-renamed',
  }[status];
  const statusLabel = t(STATUS_LABEL_KEYS[status]);

  return (
    <span
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-sm bg-[color-mix(in_srgb,currentColor_14%,transparent)] font-mono text-xs font-bold ${statusColorClassName}`}
      aria-label={t('dependency.file_status', { status: statusLabel })}
      title={statusLabel}
    >
      {status}
    </span>
  );
};
