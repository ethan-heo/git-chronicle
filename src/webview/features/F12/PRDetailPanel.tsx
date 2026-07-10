import { useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorState, LoadingState } from '../../shared/components';
import { useAppStore } from '../../store/appStore';
import { CommentThread } from './CommentThread';
import { GithubMarkdown } from './GithubMarkdown';
import { PRStatusBadge } from './PRStatusBadge';
import { ReviewSummaryList } from './ReviewSummaryList';
import type { PullRequestDetail } from './types';

interface PRDetailPanelProps {
  prNumber: number;
  isActive: boolean;
}

export const PRDetailPanel: FC<PRDetailPanelProps> = ({ prNumber, isActive }) => {
  const { t } = useTranslation();
  const entry = useAppStore((state) => state.prDetailsByNumber[prNumber]);
  const loadPRDetail = useAppStore((state) => state.loadPRDetail);
  const handlePRDetailLoaded = useAppStore((state) => state.handlePRDetailLoaded);
  const handlePRDetailLoadFailed = useAppStore((state) => state.handlePRDetailLoadFailed);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    loadPRDetail(prNumber);
  }, [isActive, loadPRDetail, prNumber]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{ type: string; payload?: { detail?: PullRequestDetail; number?: number; message?: string } }>,
    ): void => {
      if (event.data.type === 'PR_DETAIL_LOADED' && event.data.payload?.detail) {
        if (event.data.payload.detail.number !== prNumber) {
          return;
        }
        handlePRDetailLoaded(event.data.payload.detail);
        return;
      }

      if (event.data.type === 'PR_DETAIL_LOAD_FAILED') {
        if (event.data.payload?.number !== prNumber) {
          return;
        }
        handlePRDetailLoadFailed({ number: prNumber, message: event.data.payload?.message });
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handlePRDetailLoadFailed, handlePRDetailLoaded, isActive, prNumber]);

  if (!entry || entry.isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <LoadingState label={t('github.detail_loading')} size="lg" />
      </div>
    );
  }

  if (entry.error || !entry.detail) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <ErrorState message={entry.error ?? t('github.detail_error')} onRetry={() => loadPRDetail(prNumber)} />
      </div>
    );
  }

  const { detail } = entry;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="flex flex-col gap-2 border-b border-line px-6 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm text-link">#{detail.number}</span>
          <PRStatusBadge state={detail.state} />
        </div>
        <h2 className="text-lg font-semibold text-text">{detail.title}</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{detail.author}</span>
          {detail.labels.map((label) => (
            <span key={label} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-text">
              {label}
            </span>
          ))}
        </div>
      </div>
      {detail.bodyMarkdown ? (
        <div className="px-6 py-4">
          <GithubMarkdown content={detail.bodyMarkdown} />
        </div>
      ) : null}
      <ReviewSummaryList reviews={detail.reviews} />
      <CommentThread comments={detail.comments} />
    </div>
  );
};
