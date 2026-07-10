import { useLayoutEffect, useRef, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, InfiniteScrollTrigger, LoadingState } from '../../shared/components';
import { IssueListItem } from './IssueListItem';
import type { GithubAuthStatus, IssueSummary } from './types';

interface IssueListProps {
  issueList: IssueSummary[];
  activeIssueNumber: number | null;
  githubAuthStatus: GithubAuthStatus;
  isLoadingIssues: boolean;
  hasMoreIssues: boolean;
  hasLoadedIssues: boolean;
  issuesError: string | null;
  onItemClick: (issue: IssueSummary) => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onConnect: () => void;
}

export const IssueList: FC<IssueListProps> = ({
  issueList,
  activeIssueNumber,
  githubAuthStatus,
  isLoadingIssues,
  hasMoreIssues,
  hasLoadedIssues,
  issuesError,
  onItemClick,
  onLoadMore,
  onRetry,
  onConnect,
}) => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (issueList.length === 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [issueList.length]);

  if (githubAuthStatus === 'unauthenticated') {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <EmptyState message={t('github.issues_empty_unauthenticated')} ctaLabel={t('github.connect_cta')} onCtaClick={onConnect} />
      </div>
    );
  }

  if (githubAuthStatus === 'no-remote') {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <EmptyState message={t('github.issues_empty_no_remote')} />
      </div>
    );
  }

  if (isLoadingIssues && issueList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <LoadingState label={t('github.issues_loading')} size="lg" />
      </div>
    );
  }

  if (issuesError && issueList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <ErrorState message={t('github.issues_error')} onRetry={onRetry} />
      </div>
    );
  }

  if (hasLoadedIssues && issueList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <EmptyState message={t('github.issues_empty')} />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollContainerRef}>
      <div className="flex flex-col" role="list">
        {issueList.map((issue) => (
          <IssueListItem
            key={issue.number}
            issue={issue}
            isActive={issue.number === activeIssueNumber}
            onClick={onItemClick}
          />
        ))}
      </div>
      {isLoadingIssues ? (
        <div className="flex items-center justify-center px-3 py-3 text-[11px] text-muted">
          <LoadingState label={t('github.issues_loading')} size="sm" />
        </div>
      ) : null}
      <InfiniteScrollTrigger isEnabled={!isLoadingIssues && hasMoreIssues} onTrigger={onLoadMore} />
    </div>
  );
};
