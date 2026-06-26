import type { FC } from 'react';

interface FileActionButtonsProps {
  onCodeView: () => void;
  onAISummary: () => void;
  isVisible?: boolean;
}

export const FileActionButtons: FC<FileActionButtonsProps> = ({ onCodeView, onAISummary, isVisible = true }) => {
  return (
    <div className={`file-action-buttons${isVisible ? ' file-action-buttons-visible' : ''}`}>
      <button className="secondary-button" type="button" onClick={onCodeView}>
        코드 보기
      </button>
      <button className="secondary-button" type="button" onClick={onAISummary}>
        AI 정리 보기
      </button>
    </div>
  );
};
