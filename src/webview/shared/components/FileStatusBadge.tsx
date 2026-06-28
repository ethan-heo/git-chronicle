import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

export type FileStatus = 'A' | 'M' | 'D' | 'R';

const STATUS_LABELS: Record<FileStatus, string> = {
  A: '추가',
  M: '수정',
  D: '삭제',
  R: '이름 변경',
};

export const FileStatusBadge: FC<{ status: FileStatus }> = ({ status }) => {
  const { t } = useTranslation();
  return (
    <span
      className={`file-status-badge file-status-badge-${status.toLowerCase()}`}
      aria-label={t('dependency.file_status', { status: STATUS_LABELS[status] })}
      title={STATUS_LABELS[status]}
    >
      {status}
    </span>
  );
};
