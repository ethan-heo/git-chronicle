import type { FC } from 'react';
import { BatchCancelButton } from './BatchCancelButton';

interface BatchProgressBarProps {
  batchTotal: number;
  batchCompleted: number;
  isBatchRunning: boolean;
  isCancelling: boolean;
  onCancel: () => void;
}

export const BatchProgressBar: FC<BatchProgressBarProps> = ({ batchTotal, batchCompleted, isBatchRunning, isCancelling, onCancel }) => {
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
      aria-label={isCancelling ? 'AI 정리 일괄 생성 취소 중' : 'AI 정리 일괄 생성 진행 중'}
    >
      <div className="batch-progress-content">
        <div className={isCancelling ? 'batch-progress-warning' : 'batch-progress-spinner'} aria-hidden="true" />
        <div className="batch-progress-main">
          <span className="batch-progress-title">{isCancelling ? '취소하는 중 - 현재 파일 완료 후 중단됩니다' : '전체 파일 AI 정리 생성 중'}</span>
          <div className="batch-progress-track" aria-hidden="true">
            <div className="batch-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="batch-progress-count" aria-label={`${batchCompleted}개 완료, 전체 ${batchTotal}개`}>
          {batchCompleted} / {batchTotal}
        </span>
        <BatchCancelButton disabled={isCancelling} onCancel={onCancel} />
      </div>
    </section>
  );
};
