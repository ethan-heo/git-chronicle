import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface TokenLimitWarningProps {
  isVisible: boolean;
  onDismiss: () => void;
}

export const TokenLimitWarning: FC<TokenLimitWarningProps> = ({ isVisible, onDismiss }) => {
  const { t } = useTranslation();
  if (!isVisible) {
    return null;
  }

  return (
    <div className="ai-summary-token-warning" role="status">
      <span>diff가 큽니다. AI가 일부를 생략할 수 있습니다.</span>
      <button type="button" aria-label={t('ai_summary.token_warning_dismiss_aria')} onClick={onDismiss}>
        {t('common.cancel')}
      </button>
    </div>
  );
};
