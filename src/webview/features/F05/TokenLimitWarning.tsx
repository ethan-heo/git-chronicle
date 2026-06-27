import type { FC } from 'react';

interface TokenLimitWarningProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const TokenLimitWarning: FC<TokenLimitWarningProps> = ({ isVisible, onDismiss }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="ai-summary-token-warning" role="status">
      <span>diff가 큽니다. AI가 일부를 생략할 수 있습니다.</span>
      <button type="button" aria-label="토큰 경고 닫기" onClick={onDismiss}>
        접기
      </button>
    </div>
  );
};
