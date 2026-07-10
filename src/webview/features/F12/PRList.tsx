import { useLayoutEffect, useRef, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, InfiniteScrollTrigger, LoadingState } from '../../shared/components';
import { PRListItem } from './PRListItem';
import type { GithubAuthStatus, PullRequestSummary } from './types';

interface PRListProps {
  pullRequestList: PullRequestSummary[];
  activePRNumber: number | null;
  githubAuthStatus: GithubAuthStatus;
  isLoadingPullRequests: boolean;
  hasMorePullRequests: boolean;
  hasLoadedPullRequests: boolean;
  pullRequestsError: string | null;
  onItemClick: (pullRequest: PullRequestSummary) => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onConnect: () => void;
}

export const PRList: FC<PRListProps> = ({
  pullRequestList,
  activePRNumber,
  githubAuthStatus,
  isLoadingPullRequests,
  hasMorePullRequests,
  hasLoadedPullRequests,
  pullRequestsError,
  onItemClick,
  onLoadMore,
  onRetry,
  onConnect,
}) => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // pullRequestList가 처음부터 다시 로드되면 스크롤 위치를 초기화한다.
    if (pullRequestList.length === 0 && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [pullRequestList.length]);

  if (githubAuthStatus === 'unauthenticated') {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <EmptyState message={t('github.prs_empty_unauthenticated')} ctaLabel={t('github.connect_cta')} onCtaClick={onConnect} />
      </div>
    );
  }

  if (githubAuthStatus === 'no-remote') {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <EmptyState message={t('github.prs_empty_no_remote')} />
      </div>
    );
  }

  if (isLoadingPullRequests && pullRequestList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <LoadingState label={t('github.prs_loading')} size="lg" />
      </div>
    );
  }

  if (pullRequestsError && pullRequestList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <ErrorState message={t('github.prs_error')} onRetry={onRetry} />
      </div>
    );
  }

  if (hasLoadedPullRequests && pullRequestList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <EmptyState message={t('github.prs_empty')} />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollContainerRef}>
      <div className="flex flex-col" role="list">
        {pullRequestList.map((pullRequest) => (
          <PRListItem
            key={pullRequest.number}
            pullRequest={pullRequest}
            isActive={pullRequest.number === activePRNumber}
            onClick={onItemClick}
          />
        ))}
      </div>
      {isLoadingPullRequests ? (
        <div className="flex items-center justify-center px-3 py-3 text-[11px] text-muted">
          <LoadingState label={t('github.prs_loading')} size="sm" />
        </div>
      ) : null}
      <InfiniteScrollTrigger isEnabled={!isLoadingPullRequests && hasMorePullRequests} onTrigger={onLoadMore} />
    </div>
  );
};
