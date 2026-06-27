import type { FC } from 'react';

interface BatchCancelButtonProps {
  disabled: boolean;
  onCancel: () => void;
}

export const BatchCancelButton: FC<BatchCancelButtonProps> = ({ disabled, onCancel }) => {
  return (
    <button className="batch-cancel-button" type="button" aria-label="AI 정리 일괄 생성 취소" title="현재 파일 완료 후 중단" disabled={disabled} onClick={onCancel}>
      {disabled ? '취소 중' : '취소'}
    </button>
  );
};
