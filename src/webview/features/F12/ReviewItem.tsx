import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from './formatDateTime';
import { GithubMarkdown } from './GithubMarkdown';
import type { ReviewSummary } from './types';

const STATE_LABEL_KEYS: Record<ReviewSummary['state'], string> = {
  APPROVED: 'github.review_state_approved',
  CHANGES_REQUESTED: 'github.review_state_changes_requested',
  COMMENTED: 'github.review_state_commented',
};

const STATE_COLOR_CLASSNAME: Record<ReviewSummary['state'], string> = {
  APPROVED: 'text-added',
  CHANGES_REQUESTED: 'text-deleted',
  COMMENTED: 'text-muted',
};

export const ReviewItem: FC<{ review: ReviewSummary }> = ({ review }) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-col gap-1.5 border-b border-line px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className="font-semibold text-text">{review.author}</span>
        <span className={`text-[11px] font-semibold uppercase ${STATE_COLOR_CLASSNAME[review.state]}`}>
          {t(STATE_LABEL_KEYS[review.state])}
        </span>
        <time className="text-muted" dateTime={review.submittedAt}>
          {formatDateTime(review.submittedAt, i18n.language)}
        </time>
      </div>
      {review.bodyMarkdown ? <GithubMarkdown content={review.bodyMarkdown} /> : null}
    </div>
  );
};
