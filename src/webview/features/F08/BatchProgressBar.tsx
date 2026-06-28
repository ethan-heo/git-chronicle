import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { BatchCancelButton } from './BatchCancelButton';

interface BatchProgressBarProps {
  batchTotal: number;
  batchCompleted: number;
  isBatchRunning: boolean;
  isCancelling: boolean;
  onCancel: () => void;
}

export const BatchProgressBar: FC<BatchProgressBarProps> = ({ batchTotal, batchCompleted, isBatchRunning, isCancelling, onCancel }) => {
  const { t } = useTranslation();
  if (!isBatchRunning) {
    return null;
  }

  const progress = batchTotal > 0 ? Math.min(100, Math.max(0, (batchCompleted / batchTotal) * 100)) : 0;

  return (
    <section
      className="batch-progress-bar"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={batchTotal}
      aria-valuenow={batchCompleted}
      aria-label={isCancelling ? t('batch.cancelling') : t('batch.in_progress')}
    >
      <div className="batch-progress-content">
        <div className={isCancelling ? 'batch-progress-warning' : 'batch-progress-spinner'} aria-hidden="true" />
        <div className="batch-progress-main">
          <span className="batch-progress-title">{isCancelling ? t('batch.canceling_detail') : t('batch.in_progress')}</span>
          <div className="batch-progress-track" aria-hidden="true">
            <div className="batch-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="batch-progress-count" aria-label={t('batch.completed', { completed: batchCompleted, total: batchTotal })}>
          {batchCompleted} / {batchTotal}
        </span>
        <BatchCancelButton disabled={isCancelling} onCancel={onCancel} />
      </div>
    </section>
  );
};
