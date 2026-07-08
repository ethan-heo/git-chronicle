import { memo, type KeyboardEvent, type FC } from 'react';
import type { Commit } from '../../types/commit';
import { useAppStore } from '../../store/appStore';
import { CopyMarkdownButton } from '../F11';
import { commitToMarkdown } from '../F11';

interface CommitListItemProps {
  commit: Commit;
  onClick: (commit: Commit) => void;
}

const CommitListItemComponent: FC<CommitListItemProps> = ({ commit, onClick }) => {
  const pushToast = useAppStore((state) => state.pushToast);
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(commit);
    }
  };

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(commitToMarkdown(commit));
    pushToast('커밋 마크다운을 복사했습니다', 'success');
  };

  return (
    <div
      className="group relative flex min-h-12 cursor-pointer flex-col justify-center gap-0.5 border-l-2 border-l-transparent px-2.5 py-[5px] hover:bg-hover focus-visible:outline-1 focus-visible:outline-focus focus-visible:outline-offset-[-1px]"
      role="listitem"
      tabIndex={0}
      aria-label={`${commit.message} by ${commit.author} on ${formatDate(commit.date)}`}
      onClick={() => onClick(commit)}
      onKeyDown={handleKeyDown}
    >
      <CopyMarkdownButton className="absolute top-2 right-2 group-hover:opacity-100" onClick={(event) => {
        event.stopPropagation();
        void handleCopy();
      }}
      />
      <span className="overflow-hidden text-[13px] leading-[1.35] text-ellipsis whitespace-nowrap text-text">{commit.message}</span>
      <span className="flex min-w-0 flex-wrap items-center gap-[7px] text-[11px] leading-[1.35] text-muted">
        <span className="font-mono text-[11px] text-link">{commit.shortHash}</span>
        <span>{commit.author}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={commit.date}>{formatDate(commit.date)}</time>
      </span>
    </div>
  );
};

export const CommitListItem = memo(CommitListItemComponent);

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(parsedDate)
    .replaceAll(' ', '');
}
