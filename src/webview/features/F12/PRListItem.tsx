import { memo, type FC, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PRStatusBadge } from './PRStatusBadge';
import type { PullRequestSummary } from './types';

interface PRListItemProps {
  pullRequest: PullRequestSummary;
  isActive: boolean;
  onClick: (pullRequest: PullRequestSummary) => void;
}

const PRListItemComponent: FC<PRListItemProps> = ({ pullRequest, isActive, onClick }) => {
  const { i18n } = useTranslation();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(pullRequest);
    }
  };

  return (
    <div
      className={[
        'group relative flex min-h-12 cursor-pointer flex-col justify-center gap-0.5 border-l-2 px-2.5 py-[5px] transition-colors',
        isActive
          ? 'border-l-accent bg-[color-mix(in_srgb,var(--gae-color-accent-primary)_16%,var(--gae-color-surface))]'
          : 'border-l-transparent hover:bg-hover',
        'focus-visible:outline-1 focus-visible:outline-focus focus-visible:outline-offset-[-1px]',
      ].join(' ')}
      role="listitem"
      tabIndex={0}
      aria-current={isActive ? 'true' : undefined}
      aria-label={`#${pullRequest.number} ${pullRequest.title} by ${pullRequest.author}`}
      onClick={() => onClick(pullRequest)}
      onKeyDown={handleKeyDown}
    >
      <span className={['overflow-hidden text-[13px] leading-[1.35] text-ellipsis whitespace-nowrap', isActive ? 'text-text font-semibold' : 'text-text'].join(' ')}>
        {pullRequest.title}
      </span>
      <span className={['flex min-w-0 flex-wrap items-center gap-[7px] text-[11px] leading-[1.35]', isActive ? 'text-text' : 'text-muted'].join(' ')}>
        <span className="font-mono text-[11px] text-link">#{pullRequest.number}</span>
        <PRStatusBadge state={pullRequest.state} />
        <span>{pullRequest.author}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={pullRequest.updatedAt}>{formatDate(pullRequest.updatedAt, i18n.language)}</time>
      </span>
    </div>
  );
};

export const PRListItem = memo(PRListItemComponent);

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
