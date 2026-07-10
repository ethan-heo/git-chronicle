import { useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarSection } from '../../shared/components';
import { useAppStore } from '../../store/appStore';
import { IssueList } from './IssueList';
import type { IssueSummary } from './types';

interface IssuesSectionProps {
  isActive: boolean;
  activeIssueNumber: number | null;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSelectIssue: (issue: IssueSummary) => void;
}

export const IssuesSection: FC<IssuesSectionProps> = ({ isActive, activeIssueNumber, isExpanded, onToggleExpanded, onSelectIssue }) => {
  const { t } = useTranslation();
  const issueList = useAppStore((state) => state.issueList);
  const githubAuthStatus = useAppStore((state) => state.githubAuthStatus);
  const isLoadingIssues = useAppStore((state) => state.isLoadingIssues);
  const hasMoreIssues = useAppStore((state) => state.hasMoreIssues);
  const hasLoadedIssues = useAppStore((state) => state.hasLoadedIssues);
  const issuesError = useAppStore((state) => state.issuesError);
  const loadIssues = useAppStore((state) => state.loadIssues);
  const connectGithub = useAppStore((state) => state.connectGithub);
  const handleIssuesLoaded = useAppStore((state) => state.handleIssuesLoaded);
  const handleIssuesLoadFailed = useAppStore((state) => state.handleIssuesLoadFailed);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: { items?: IssueSummary[]; hasMore?: boolean; page?: number; message?: string };
      }>,
    ): void => {
      if (event.data.type === 'ISSUES_LOADED' && event.data.payload) {
        handleIssuesLoaded({
          items: event.data.payload.items ?? [],
          hasMore: event.data.payload.hasMore ?? false,
          page: event.data.payload.page ?? 1,
        });
        return;
      }

      if (event.data.type === 'ISSUES_LOAD_FAILED') {
        handleIssuesLoadFailed(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleIssuesLoadFailed, handleIssuesLoaded, isActive]);

  return (
    <SidebarSection
      title={t('github.issues_title')}
      isExpanded={isExpanded}
      onToggle={onToggleExpanded}
      badge={issueList.length > 0 ? (
        <strong className="rounded-full bg-secondary px-[7px] py-px text-xs font-medium text-text">
          {issueList.length}
        </strong>
      ) : undefined}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <IssueList
          issueList={issueList}
          activeIssueNumber={activeIssueNumber}
          githubAuthStatus={githubAuthStatus}
          isLoadingIssues={isLoadingIssues}
          hasMoreIssues={hasMoreIssues}
          hasLoadedIssues={hasLoadedIssues}
          issuesError={issuesError}
          onItemClick={onSelectIssue}
          onLoadMore={() => loadIssues(false)}
          onRetry={() => loadIssues(issueList.length === 0)}
          onConnect={connectGithub}
        />
      </div>
    </SidebarSection>
  );
};
