import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PrimaryButton, SavedBadge } from '../../shared/components';
import type { Commit } from '../../types/commit';

interface CommitActionBarProps {
  selectedCommit: Commit;
  hasSavedCommitSummary: boolean;
  isLoadingChangedFiles: boolean;
  onCommitAISummary: () => void;
  onCanvasView: () => void;
}

export const CommitActionBar: FC<CommitActionBarProps> = ({
  selectedCommit,
  hasSavedCommitSummary,
  isLoadingChangedFiles,
  onCommitAISummary,
  onCanvasView,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-line bg-surface px-2.5 py-2"
      role="toolbar"
      aria-label={`${selectedCommit.shortHash} ${t('action_bar.commit_ai_aria')}`}
    >
      <div className="inline-flex items-center gap-1.5">
        <PrimaryButton aria-label={t('action_bar.commit_ai_aria')} onClick={onCommitAISummary}>
          {t('action_bar.commit_ai_aria')}
        </PrimaryButton>
        <SavedBadge isVisible={hasSavedCommitSummary} />
      </div>
      <PrimaryButton
        className="border-line !bg-secondary !text-text hover:!bg-secondary-hi"
        aria-label={t('action_bar.canvas_aria')}
        isLoading={isLoadingChangedFiles}
        onClick={onCanvasView}
      >
        {isLoadingChangedFiles ? t('file_tree.loading') : t('action_bar.canvas_aria')}
      </PrimaryButton>
    </div>
  );
};
