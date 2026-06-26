import type { FC } from 'react';

export type FileStatus = 'A' | 'M' | 'D' | 'R';

const STATUS_LABELS: Record<FileStatus, string> = {
  A: '추가',
  M: '수정',
  D: '삭제',
  R: '이름 변경',
};

export const FileStatusBadge: FC<{ status: FileStatus }> = ({ status }) => {
  return (
    <span
      className={`file-status-badge file-status-badge-${status.toLowerCase()}`}
      aria-label={`파일 상태: ${STATUS_LABELS[status]}`}
      title={STATUS_LABELS[status]}
    >
      {status}
    </span>
  );
};
