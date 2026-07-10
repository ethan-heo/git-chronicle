import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from './formatDateTime';
import { GithubMarkdown } from './GithubMarkdown';
import type { CommentSummary } from './types';

export const CommentItem: FC<{ comment: CommentSummary }> = ({ comment }) => {
  const { i18n } = useTranslation();

  return (
    <div className="flex flex-col gap-1.5 border-b border-line px-4 py-3 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className="font-semibold text-text">{comment.author}</span>
        <time className="text-muted" dateTime={comment.createdAt}>
          {formatDateTime(comment.createdAt, i18n.language)}
        </time>
      </div>
      <GithubMarkdown content={comment.bodyMarkdown} />
    </div>
  );
};
