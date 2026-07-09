import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import { CommitFilterPanel } from './CommitFilterPanel';
import { CommitList } from './CommitList';
import { useCommitList } from './useCommitList';

export const S01CommitListScreen: FC = () => {
  const { t } = useTranslation();
  const isRouteSlotActive = useRouteSlotActive();
  const {
    commitList,
    hasMoreCommits,
    isLoadingCommits,
    isGitRepoDetected,
    hasLoadedCommits,
    commitListScrollTop,
    commitLoadError,
    loadMoreError,
    setCommitListScrollTop,
    selectCommit,
    onLoadMore,
    retry,
  } = useCommitList({ isActive: isRouteSlotActive });

  const authorList = useAppStore((state) => state.authorList);
  const filterDateStart = useAppStore((state) => state.filterDateStart);
  const filterDateEnd = useAppStore((state) => state.filterDateEnd);
  const filterAuthor = useAppStore((state) => state.filterAuthor);
  const filterKeyword = useAppStore((state) => state.filterKeyword);
  const filterExcludeKeyword = useAppStore((state) => state.filterExcludeKeyword);
  const sortOrder = useAppStore((state) => state.sortOrder);
  const setFilter = useAppStore((state) => state.setFilter);
  const clearFilters = useAppStore((state) => state.clearFilters);
  const goToSettingsView = useAppStore((state) => state.goToSettingsView);
  const openRepository = useAppStore((state) => state.openRepository);
  const selectedCommitHash = useAppStore((state) => state.selectedCommit?.hash ?? null);

  const isFilterActive = Boolean(
    filterDateStart || filterDateEnd || filterAuthor || filterKeyword.trim() || filterExcludeKeyword.trim(),
  );

  return (
    <main className="app-shell flex h-screen min-h-0 flex-col overflow-hidden">
      <TopHeader title="GitChronicle" context={t('commit.list_title')} showSettingsIcon onSettingsClick={goToSettingsView} />
      <CommitFilterPanel
        filterDateStart={filterDateStart}
        filterDateEnd={filterDateEnd}
        filterAuthor={filterAuthor}
        filterKeyword={filterKeyword}
        filterExcludeKeyword={filterExcludeKeyword}
        sortOrder={sortOrder}
        authorList={authorList}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
      />
      <CommitList
        commitList={commitList}
        selectedCommitHash={selectedCommitHash}
        isLoadingCommits={isLoadingCommits}
        hasMoreCommits={hasMoreCommits}
        isGitRepoDetected={isGitRepoDetected}
        hasLoadedCommits={hasLoadedCommits}
        isFilterActive={isFilterActive}
        commitLoadError={commitLoadError}
        loadMoreError={loadMoreError}
        onCommitClick={selectCommit}
        onLoadMore={onLoadMore}
        onRetry={retry}
        onOpenRepository={openRepository}
        onClearFilters={clearFilters}
        savedScrollTop={commitListScrollTop}
        onScrollTopChange={setCommitListScrollTop}
      />
    </main>
  );
};
