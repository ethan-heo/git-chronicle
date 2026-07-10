import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ReviewItem } from './ReviewItem';
import type { ReviewSummary } from './types';

export const ReviewSummaryList: FC<{ reviews: ReviewSummary[] }> = ({ reviews }) => {
  const { t } = useTranslation();

  if (reviews.length === 0) {
    return null;
  }

  const sortedReviews = [...reviews].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  return (
    <section className="border-t border-line">
      <h3 className="px-4 pt-4 pb-1 text-xs font-bold tracking-wide text-muted uppercase">{t('github.reviews_title')}</h3>
      <div className="flex flex-col">
        {sortedReviews.map((review, index) => (
          <ReviewItem key={`${review.author}-${review.submittedAt}-${index}`} review={review} />
        ))}
      </div>
    </section>
  );
};
