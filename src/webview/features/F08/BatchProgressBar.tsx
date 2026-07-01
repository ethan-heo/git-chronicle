import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { BatchCancelButton } from './BatchCancelButton';
import './BatchProgressBar.css';

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
      className="fixed inset-x-0 top-0 z-40 animate-gae-fade border-b border-line bg-elevated text-text shadow-[0_1px_8px_rgba(0,0,0,0.28)]"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={batchTotal}
      aria-valuenow={batchCompleted}
      aria-label={isCancelling ? t('batch.cancelling') : t('batch.in_progress')}
    >
      <div className="flex min-h-[44px] items-center gap-[10px] px-3 py-2">
        <div
          className={
            isCancelling
              ? 'batch-progress-warning-icon relative h-[13px] w-[13px] shrink-0 rounded-full border-[1.5px] border-warning'
              : 'h-[13px] w-[13px] shrink-0 animate-spin rounded-full border-2 border-[color-mix(in_srgb,var(--gae-border-color-default)_75%,transparent)] border-t-focus'
          }
          aria-hidden="true"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 pr-3">
          <span className="overflow-hidden text-[11.5px] font-medium whitespace-nowrap text-ellipsis text-text">
            {isCancelling ? t('batch.canceling_detail') : t('batch.in_progress')}
          </span>
          <div className="relative h-[3px] overflow-hidden rounded-sm bg-[var(--gae-color-surface-tertiary)]" aria-hidden="true">
            <div className="h-full rounded-[inherit] bg-focus transition-[width] duration-[var(--gae-motion-duration-base)] ease-[var(--gae-motion-easing-default)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span
          className="shrink-0 pl-1 font-mono text-[11.5px] font-bold whitespace-nowrap text-muted tabular-nums"
          aria-label={t('batch.completed', { completed: batchCompleted, total: batchTotal })}
        >
          {batchCompleted} / {batchTotal}
        </span>
        <BatchCancelButton disabled={isCancelling} onCancel={onCancel} />
      </div>
    </section>
  );
};
