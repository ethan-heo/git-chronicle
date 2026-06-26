import type { KeyboardEvent, FC } from 'react';
import type { Commit } from '../../types/commit';

interface CommitListItemProps {
  commit: Commit;
  onClick: (commit: Commit) => void;
}

export const CommitListItem: FC<CommitListItemProps> = ({ commit, onClick }) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(commit);
    }
  };

  return (
    <div
      className="commit-list-item"
      role="listitem"
      tabIndex={0}
      aria-label={`${commit.message} by ${commit.author} on ${formatDate(commit.date)}`}
      onClick={() => onClick(commit)}
      onKeyDown={handleKeyDown}
    >
      <span className="commit-message">{commit.message}</span>
      <span className="commit-meta">
        <span className="commit-hash">{commit.shortHash}</span>
        <span>{commit.author}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={commit.date}>{formatDate(commit.date)}</time>
      </span>
    </div>
  );
};

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
