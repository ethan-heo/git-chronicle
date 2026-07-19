import { useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarSection } from '../../shared/components';
import { useAppStore } from '../../store/appStore';
import { PRList } from './PRList';
import type { PullRequestSummary } from './types';

interface PRsSectionProps {
  isActive: boolean;
  activePRNumber: number | null;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSelectPullRequest: (pullRequest: PullRequestSummary) => void;
}

export const PRsSection: FC<PRsSectionProps> = ({ isActive, activePRNumber, isExpanded, onToggleExpanded, onSelectPullRequest }) => {
  const { t } = useTranslation();
  const pullRequestList = useAppStore((state) => state.pullRequestList);
  const githubAuthStatus = useAppStore((state) => state.githubAuthStatus);
  const isLoadingPullRequests = useAppStore((state) => state.isLoadingPullRequests);
  const hasMorePullRequests = useAppStore((state) => state.hasMorePullRequests);
  const hasLoadedPullRequests = useAppStore((state) => state.hasLoadedPullRequests);
  const pullRequestsError = useAppStore((state) => state.pullRequestsError);
  const loadPullRequests = useAppStore((state) => state.loadPullRequests);
  const connectGithub = useAppStore((state) => state.connectGithub);
  const handlePullRequestsLoaded = useAppStore((state) => state.handlePullRequestsLoaded);
  const handlePullRequestsLoadFailed = useAppStore((state) => state.handlePullRequestsLoadFailed);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: { items?: PullRequestSummary[]; hasMore?: boolean; page?: number; message?: string };
      }>,
    ): void => {
      if (event.data.type === 'PULL_REQUESTS_LOADED' && event.data.payload) {
        handlePullRequestsLoaded({
          items: event.data.payload.items ?? [],
          hasMore: event.data.payload.hasMore ?? false,
          page: event.data.payload.page ?? 1,
        });
        return;
      }

      if (event.data.type === 'PULL_REQUESTS_LOAD_FAILED') {
        handlePullRequestsLoadFailed(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handlePullRequestsLoadFailed, handlePullRequestsLoaded, isActive]);

  return (
    <SidebarSection
      title={t('github.prs_title')}
      isExpanded={isExpanded}
      onToggle={onToggleExpanded}
      badge={pullRequestList.length > 0 ? (
        <strong className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-medium leading-none text-text">
          {pullRequestList.length}
        </strong>
      ) : undefined}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PRList
          pullRequestList={pullRequestList}
          activePRNumber={activePRNumber}
          githubAuthStatus={githubAuthStatus}
          isLoadingPullRequests={isLoadingPullRequests}
          hasMorePullRequests={hasMorePullRequests}
          hasLoadedPullRequests={hasLoadedPullRequests}
          pullRequestsError={pullRequestsError}
          onItemClick={onSelectPullRequest}
          onLoadMore={() => loadPullRequests(false)}
          onRetry={() => loadPullRequests(pullRequestList.length === 0)}
          onConnect={connectGithub}
        />
      </div>
    </SidebarSection>
  );
};
