import type { FC } from 'react';
import { PrimaryButton } from '../../shared/components';

interface OverwriteConfirmDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const OverwriteConfirmDialog: FC<OverwriteConfirmDialogProps> = ({ isOpen, onCancel, onConfirm }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="ai-summary-dialog-backdrop" role="presentation" onClick={onCancel}>
      <section className="ai-summary-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-summary-overwrite-title" onClick={(event) => event.stopPropagation()}>
        <div className="ai-summary-dialog-body">
          <strong id="ai-summary-overwrite-title">기존 저장본을 덮어쓰시겠습니까?</strong>
          <p>동일한 diff로 AI를 다시 호출하여 현재 저장된 정리 내용을 새 결과로 교체합니다.</p>
        </div>
        <div className="ai-summary-dialog-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            취소
          </button>
          <PrimaryButton onClick={onConfirm}>확인</PrimaryButton>
        </div>
      </section>
    </div>
  );
};
