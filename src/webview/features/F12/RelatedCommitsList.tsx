import { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorState, InfiniteScrollTrigger, LoadingState } from '../../shared/components';
import type { Commit } from '../../types/commit';
import { RelatedCommitItem } from './RelatedCommitItem';

interface RelatedCommitsListProps {
  commits: Commit[];
  isLoading: boolean;
  hasMore: boolean;
  hasLoaded: boolean;
  error: string | null;
  selectedHash: string | null;
  onSelectCommit: (commit: Commit) => void;
  onLoadMore: () => void;
  onRetry: () => void;
}

export const RelatedCommitsList: FC<RelatedCommitsListProps> = ({
  commits,
  isLoading,
  hasMore,
  hasLoaded,
  error,
  selectedHash,
  onSelectCommit,
  onLoadMore,
  onRetry,
}) => {
  const { t } = useTranslation();

  if (isLoading && commits.length === 0 && !error) {
    return null;
  }

  if (hasLoaded && commits.length === 0 && !hasMore) {
    return null;
  }

  return (
    <section className="border-t border-line px-6 py-4" aria-label={t('github.related_commits_title')}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold tracking-wide text-muted uppercase">{t('github.related_commits_title')}</h3>
      </div>

      {error && commits.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface px-4 py-5">
          <ErrorState message={error} onRetry={onRetry} />
        </div>
      ) : null}

      {commits.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-line bg-surface" role="list">
          {commits.map((commit) => (
            <RelatedCommitItem
              key={commit.hash}
              commit={commit}
              isSelected={commit.hash === selectedHash}
              onClick={onSelectCommit}
            />
          ))}
        </div>
      ) : null}

      {isLoading && commits.length > 0 ? (
        <div className="flex items-center justify-center px-3 py-3 text-[11px] text-muted">
          <LoadingState label={t('github.related_commits_loading')} size="sm" />
        </div>
      ) : null}

      <InfiniteScrollTrigger isEnabled={!isLoading && hasMore} onTrigger={onLoadMore} />
    </section>
  );
};
