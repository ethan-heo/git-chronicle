import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '../../shared/components';
import type { Commit } from '../../types/commit';

interface CommitActionBarProps {
  selectedCommit: Commit;
  isBatchRunning: boolean;
  isLoadingChangedFiles: boolean;
  onCommitAISummary: () => void;
  onBatchAISummary: () => void;
  onCanvasView: () => void;
}

export const CommitActionBar: FC<CommitActionBarProps> = ({
  selectedCommit,
  isBatchRunning,
  isLoadingChangedFiles,
  onCommitAISummary,
  onBatchAISummary,
  onCanvasView,
}) => {
  const { t } = useTranslation();
  return (
    <div className="commit-action-bar" role="toolbar" aria-label={`${selectedCommit.shortHash} ${t('action_bar.commit_ai_aria')}`}>
      <PrimaryButton aria-label={t('action_bar.commit_ai_aria')} onClick={onCommitAISummary}>
        {t('action_bar.commit_ai_aria')}
      </PrimaryButton>
      <PrimaryButton className="primary-button-secondary" aria-label={t('action_bar.batch_ai_aria')} disabled={isBatchRunning} onClick={onBatchAISummary}>
        {isBatchRunning ? t('batch.in_progress') : t('action_bar.batch_ai_aria')}
      </PrimaryButton>
      <PrimaryButton className="primary-button-secondary" aria-label={t('action_bar.canvas_aria')} isLoading={isLoadingChangedFiles} onClick={onCanvasView}>
        {isLoadingChangedFiles ? t('file_tree.loading') : t('action_bar.canvas_aria')}
      </PrimaryButton>
    </div>
  );
};
