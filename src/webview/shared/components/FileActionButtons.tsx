import type { FC } from 'react';

interface FileActionButtonsProps {
  onCodeView: () => void;
  onAISummary: () => void;
  isVisible?: boolean;
}

export const FileActionButtons: FC<FileActionButtonsProps> = ({ onCodeView, onAISummary, isVisible = true }) => {
  return (
    <div className={`file-action-buttons${isVisible ? ' file-action-buttons-visible' : ''}`}>
      <button className="file-action-button" type="button" aria-label="코드 보기" title="코드 보기" onClick={onCodeView}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <path d="M6 5 2.5 8 6 11" />
          <path d="m10 5 3.5 3L10 11" />
        </svg>
      </button>
      <button className="file-action-button" type="button" aria-label="AI 정리 보기" title="AI 정리 보기" onClick={onAISummary}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 1.5 9.4 5l3.6.3-2.7 2.4.8 3.5L8 9.3 4.9 11.2l.8-3.5L3 5.3 6.6 5z" />
        </svg>
      </button>
    </div>
  );
};
