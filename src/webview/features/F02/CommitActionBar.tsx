import type { FC } from 'react';
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
  return (
    <div className="commit-action-bar" role="toolbar" aria-label={`${selectedCommit.shortHash} 커밋 액션`}>
      <PrimaryButton aria-label="커밋 전체 AI 정리" onClick={onCommitAISummary}>
        커밋 AI 정리
      </PrimaryButton>
      <PrimaryButton className="primary-button-secondary" aria-label="전체 파일 AI 정리" disabled={isBatchRunning} onClick={onBatchAISummary}>
        {isBatchRunning ? '일괄 생성 중' : '전체 파일 AI 정리'}
      </PrimaryButton>
      <PrimaryButton className="primary-button-secondary" aria-label="의존성 캔버스 보기" isLoading={isLoadingChangedFiles} onClick={onCanvasView}>
        {isLoadingChangedFiles ? '파일 불러오는 중' : '캔버스 보기'}
      </PrimaryButton>
    </div>
  );
};
