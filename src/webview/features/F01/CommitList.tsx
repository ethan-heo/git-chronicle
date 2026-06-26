import type { FC } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import type { Commit } from '../../types/commit';
import { CommitListItem } from './CommitListItem';
import { InfiniteScrollTrigger } from './InfiniteScrollTrigger';

interface CommitListProps {
  commitList: Commit[];
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
}

export const CommitList: FC<CommitListProps> = ({
  commitList,
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
}) => {
  if (isLoadingCommits && commitList.length === 0) {
    return (
      <div className="commit-list-state">
        <LoadingState label="커밋을 불러오는 중..." size="lg" />
      </div>
    );
  }

  if (commitLoadError) {
    return (
      <div className="commit-list-state">
        <ErrorState message="커밋 목록을 불러오지 못했습니다" onRetry={onRetry} />
      </div>
    );
  }

  if (!isGitRepoDetected) {
    return (
      <div className="commit-list-state">
        <EmptyState message="Git 저장소가 감지되지 않았습니다" ctaLabel="레포 열기" onCtaClick={onOpenRepository} />
      </div>
    );
  }

  if (hasLoadedCommits && commitList.length === 0 && isFilterActive) {
    return (
      <div className="commit-list-state">
        <EmptyState message="조건에 맞는 커밋이 없습니다" ctaLabel="필터 초기화" onCtaClick={onClearFilters} />
      </div>
    );
  }

  if (hasLoadedCommits && commitList.length === 0) {
    return (
      <div className="commit-list-state">
        <EmptyState message="커밋 이력이 없습니다" />
      </div>
    );
  }

  return (
    <div className="commit-list-scroll">
      <div className="commit-list" role="list">
        {commitList.map((commit) => (
          <CommitListItem key={commit.hash} commit={commit} onClick={onCommitClick} />
        ))}
      </div>
      {loadMoreError ? <div className="commit-list-inline-error">{loadMoreError}</div> : null}
      {isLoadingCommits ? (
        <div className="commit-list-footer">
          <LoadingState label="더 불러오는 중..." size="sm" />
        </div>
      ) : null}
      <InfiniteScrollTrigger isEnabled={!isLoadingCommits && hasMoreCommits} onTrigger={onLoadMore} />
      {!hasMoreCommits && commitList.length > 0 ? <div className="commit-list-end">모든 커밋을 불러왔습니다</div> : null}
    </div>
  );
};
