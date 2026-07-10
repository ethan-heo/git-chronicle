import { memo, type FC, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { IssueStatusBadge } from './IssueStatusBadge';
import type { IssueSummary } from './types';

interface IssueListItemProps {
  issue: IssueSummary;
  isActive: boolean;
  onClick: (issue: IssueSummary) => void;
}

const IssueListItemComponent: FC<IssueListItemProps> = ({ issue, isActive, onClick }) => {
  const { i18n } = useTranslation();

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(issue);
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
      aria-label={`#${issue.number} ${issue.title} by ${issue.author}`}
      onClick={() => onClick(issue)}
      onKeyDown={handleKeyDown}
    >
      <span className={['overflow-hidden text-[13px] leading-[1.35] text-ellipsis whitespace-nowrap', isActive ? 'text-text font-semibold' : 'text-text'].join(' ')}>
        {issue.title}
      </span>
      <span className={['flex min-w-0 flex-wrap items-center gap-[7px] text-[11px] leading-[1.35]', isActive ? 'text-text' : 'text-muted'].join(' ')}>
        <span className="font-mono text-[11px] text-link">#{issue.number}</span>
        <IssueStatusBadge state={issue.state} />
        <span>{issue.author}</span>
        <span aria-hidden="true">·</span>
        <time dateTime={issue.updatedAt}>{formatDate(issue.updatedAt, i18n.language)}</time>
      </span>
    </div>
  );
};

export const IssueListItem = memo(IssueListItemComponent);

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
