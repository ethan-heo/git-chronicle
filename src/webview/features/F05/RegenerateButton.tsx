import type { FC } from 'react';

interface RegenerateButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export const RegenerateButton: FC<RegenerateButtonProps> = ({ disabled, onClick }) => {
  return (
    <button className="secondary-button ai-summary-regenerate-button" type="button" aria-label="AI 정리 재생성" disabled={disabled} onClick={onClick}>
      재생성
    </button>
  );
};
