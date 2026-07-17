import { useLayoutEffect, useRef, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState, InfiniteScrollTrigger, LoadingState } from '../../shared/components';
import type { Commit } from '../../types/commit';
import { CommitListItem } from './CommitListItem';

interface CommitListProps {
  commitList: Commit[];
  selectedCommitHash: string | null;
  isLoadingCommits: boolean;
  hasMoreCommits: boolean;
  isGitRepoDetected: boolean;
  hasLoadedCommits: boolean;
  isFilterActive: boolean;
  commitLoadError: string | null;
  loadMoreError: string | null;
  onCommitClick: (commit: Commit) => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onOpenRepository: () => void;
  onClearFilters: () => void;
  savedScrollTop: number;
  onScrollTopChange: (top: number) => void;
  onOpenAISummary: () => void;
  onOpenFileCanvas: () => void;
  isAIViewActive: boolean;
  isFileCanvasActive: boolean;
  isSelectModeActive?: boolean;
  selectedCommitHashesForGroup?: Set<string>;
  onToggleCheckForGroup?: (hash: string) => void;
}

export const CommitList: FC<CommitListProps> = ({
  commitList,
  selectedCommitHash,
  isLoadingCommits,
  hasMoreCommits,
  isGitRepoDetected,
  hasLoadedCommits,
  isFilterActive,
  commitLoadError,
  loadMoreError,
  onCommitClick,
  onLoadMore,
  onRetry,
  onOpenRepository,
  onClearFilters,
  savedScrollTop,
  onScrollTopChange,
  onOpenAISummary,
  onOpenFileCanvas,
  isAIViewActive,
  isFileCanvasActive,
  isSelectModeActive = false,
  selectedCommitHashesForGroup,
  onToggleCheckForGroup,
}) => {
  const { t } = useTranslation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasRestoredScrollRef = useRef(false);

  useLayoutEffect(() => {
    hasRestoredScrollRef.current = false;
  }, [commitList.length]);

  useLayoutEffect(() => {
    if (hasRestoredScrollRef.current) {
      return;
    }

    const element = scrollContainerRef.current;

    if (!element || commitList.length === 0 || savedScrollTop === 0) {
      return;
    }

    element.scrollTop = savedScrollTop;
    hasRestoredScrollRef.current = true;
  }, [commitList.length, savedScrollTop]);

  useLayoutEffect(() => {
    const element = scrollContainerRef.current;

    return () => {
      if (element) {
        onScrollTopChange(element.scrollTop);
      }
    };
  }, [onScrollTopChange]);

  const handleScroll = (): void => {
    const element = scrollContainerRef.current;

    if (element) {
      onScrollTopChange(element.scrollTop);
    }
  };

  if (isLoadingCommits && commitList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <LoadingState label={t('commit.loading')} size="lg" />
      </div>
    );
  }

  if (commitLoadError) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <ErrorState message={t('commit.error')} onRetry={onRetry} />
      </div>
    );
  }

  if (!isGitRepoDetected) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <EmptyState message={t('commit.empty_no_repo')} ctaLabel={t('commit.open_repo')} onCtaClick={onOpenRepository} />
      </div>
    );
  }

  if (hasLoadedCommits && commitList.length === 0 && isFilterActive) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <EmptyState message={t('commit.empty_no_result')} ctaLabel={t('commit.clear_filters')} onCtaClick={onClearFilters} />
      </div>
    );
  }

  if (hasLoadedCommits && commitList.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <EmptyState message={t('commit.empty_no_history')} />
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto" ref={scrollContainerRef} onScroll={handleScroll}>
      <div className="flex flex-col" role="list">
        {commitList.map((commit) => (
          <CommitListItem
            key={commit.hash}
            commit={commit}
            isSelected={commit.hash === selectedCommitHash}
            onClick={onCommitClick}
            onOpenAISummary={onOpenAISummary}
            onOpenFileCanvas={onOpenFileCanvas}
            isAIViewActive={isAIViewActive}
            isFileCanvasActive={isFileCanvasActive}
            isSelectModeActive={isSelectModeActive}
            isCheckedForGroup={selectedCommitHashesForGroup?.has(commit.hash) ?? false}
            onToggleCheckForGroup={onToggleCheckForGroup}
          />
        ))}
      </div>
      {loadMoreError ? <div className="flex items-center justify-center px-3 py-3 text-[11px] text-error">{loadMoreError}</div> : null}
      {isLoadingCommits ? (
        <div className="flex items-center justify-center px-3 py-3 text-[11px] text-muted">
          <LoadingState label={t('commit.load_more')} size="sm" />
        </div>
      ) : null}
      <InfiniteScrollTrigger isEnabled={!isLoadingCommits && hasMoreCommits} onTrigger={onLoadMore} />
      {!hasMoreCommits && commitList.length > 0 ? (
        <div className="flex items-center justify-center px-3 py-3 text-[11px] text-muted opacity-72">
          {t('commit.all_loaded')}
        </div>
      ) : null}
    </div>
  );
};
