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
  const statusColorClassName = {
    A: 'text-added',
    M: 'text-modified',
    D: 'text-deleted',
    R: 'text-renamed',
  }[status];

  return (
    <span
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-sm bg-[color-mix(in_srgb,currentColor_14%,transparent)] font-mono text-xs font-bold ${statusColorClassName}`}
      aria-label={t('dependency.file_status', { status: STATUS_LABELS[status] })}
      title={STATUS_LABELS[status]}
    >
      {status}
    </span>
  );
};
