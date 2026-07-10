import { memo, type FC, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Commit } from '../../types/commit';

interface RelatedCommitItemProps {
  commit: Commit;
  isSelected: boolean;
  onClick: (commit: Commit) => void;
}

const RelatedCommitItemComponent: FC<RelatedCommitItemProps> = ({ commit, isSelected, onClick }) => {
  const { i18n } = useTranslation();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(commit);
    }
  };

  return (
    <div
      className={[
        'group relative flex min-h-12 cursor-pointer flex-col justify-center gap-0.5 border-l-2 px-3 py-[7px] transition-colors',
        isSelected
          ? 'border-l-accent bg-[color-mix(in_srgb,var(--gae-color-accent-primary)_16%,var(--gae-color-surface))]'
          : 'border-l-transparent hover:bg-hover',
        'focus-visible:outline-1 focus-visible:outline-focus focus-visible:outline-offset-[-1px]',
      ].join(' ')}
      role="listitem"
      tabIndex={0}
      aria-current={isSelected ? 'true' : undefined}
      aria-label={`${commit.shortHash} ${commit.message} by ${commit.author}`}
      onClick={() => onClick(commit)}
      onKeyDown={handleKeyDown}
    >
      <span className={['overflow-hidden text-[13px] leading-[1.35] text-ellipsis whitespace-nowrap', isSelected ? 'text-text font-semibold' : 'text-text'].join(' ')}>
        {commit.shortHash}
        <span className="mx-1.5 text-muted">·</span>
        {commit.message}
      </span>
      <span className={['flex min-w-0 flex-wrap items-center gap-[7px] text-[11px] leading-[1.35]', isSelected ? 'text-text' : 'text-muted'].join(' ')}>
        <span>{commit.author}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={commit.date}>{formatDate(commit.date, i18n.language)}</time>
      </span>
    </div>
  );
};

export const RelatedCommitItem = memo(RelatedCommitItemComponent);

function formatDate(date: string, language: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  if (language.startsWith('ko')) {
    return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .format(parsedDate)
      .replaceAll(' ', '');
  }

  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(parsedDate);
}
