import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../shared/components';
import { CommentItem } from './CommentItem';
import type { CommentSummary } from './types';

export const CommentThread: FC<{ comments: CommentSummary[] }> = ({ comments }) => {
  const { t } = useTranslation();
  const sortedComments = [...comments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <section className="border-t border-line">
      <h3 className="px-4 pt-4 pb-1 text-xs font-bold tracking-wide text-muted uppercase">{t('github.comments_title')}</h3>
      {sortedComments.length === 0 ? (
        <div className="px-4 pb-4">
          <EmptyState message={t('github.comments_empty')} />
        </div>
      ) : (
        <div className="flex flex-col">
          {sortedComments.map((comment, index) => (
            <CommentItem key={`${comment.author}-${comment.createdAt}-${index}`} comment={comment} />
          ))}
        </div>
      )}
    </section>
  );
};
