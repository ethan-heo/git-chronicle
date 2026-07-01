import { useCallback, useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import type { Commit } from '../../types/commit';
import { CommitFilterPanel } from './CommitFilterPanel';
import { CommitList } from './CommitList';

export const S01CommitListScreen: FC = () => {
  const { t } = useTranslation();
  const {
    commitList,
    authorList,
    hasMoreCommits,
    isLoadingCommits,
    isGitRepoDetected,
    hasLoadedCommits,
    commitListScrollTop,
    commitLoadError,
    loadMoreError,
    filterDateStart,
    filterDateEnd,
    filterAuthor,
    filterKeyword,
    filterExcludeKeyword,
    sortOrder,
    loadCommits,
    setCommitListScrollTop,
    setFilter,
    clearFilters,
    selectCommit,
    goToSettingsView,
    openRepository,
  } = useAppStore();
  const isRouteSlotActive = useRouteSlotActive();
  const isFilterActive = Boolean(
    filterDateStart || filterDateEnd || filterAuthor || filterKeyword.trim() || filterExcludeKeyword.trim(),
  );

  useEffect(() => {
    if (!isRouteSlotActive) {
      return;
    }

    if (hasLoadedCommits) {
      return;
    }

    loadCommits(true);
  }, [hasLoadedCommits, isRouteSlotActive, loadCommits]);

  useEffect(() => {
    if (!isRouteSlotActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: {
          commits?: Commit[];
          page?: number;
          pageSize?: number;
          hasMore?: boolean;
          requestId?: number;
          message?: string;
        };
      }>,
    ): void => {
      const store = useAppStore.getState();

      if (event.data.type === 'COMMITS_LOADED' && event.data.payload) {
        store.handleCommitsLoaded({
          commits: event.data.payload.commits ?? [],
          page: event.data.payload.page ?? 0,
          pageSize: event.data.payload.pageSize ?? 200,
          hasMore: event.data.payload.hasMore,
          requestId: event.data.payload.requestId,
        });
        return;
      }

      if (event.data.type === 'GIT_REPOSITORY_NOT_FOUND') {
        store.handleRepositoryNotFound();
        return;
      }

      if (event.data.type === 'COMMITS_LOAD_FAILED') {
        store.handleCommitsLoadFailed(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [isRouteSlotActive]);

  const retry = useCallback(() => loadCommits(commitList.length === 0), [commitList.length, loadCommits]);

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
        isLoadingCommits={isLoadingCommits}
        hasMoreCommits={hasMoreCommits}
        isGitRepoDetected={isGitRepoDetected}
        hasLoadedCommits={hasLoadedCommits}
        isFilterActive={isFilterActive}
        commitLoadError={commitLoadError}
        loadMoreError={loadMoreError}
        onCommitClick={selectCommit}
        onLoadMore={() => loadCommits(false)}
        onRetry={retry}
        onOpenRepository={openRepository}
        onClearFilters={clearFilters}
        savedScrollTop={commitListScrollTop}
        onScrollTopChange={setCommitListScrollTop}
      />
    </main>
  );
};
