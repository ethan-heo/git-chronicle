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
    <div
      className="mx-6 mt-3 flex items-center justify-between gap-2 rounded-sm border border-[color-mix(in_srgb,var(--color-warning)_42%,transparent)] border-l-[3px] bg-[color-mix(in_srgb,var(--color-warning)_12%,var(--color-panel))] px-3 py-[9px] text-sm text-text"
      role="status"
    >
      <span className="min-w-0">diff가 큽니다. AI가 일부를 생략할 수 있습니다.</span>
      <button
        className="shrink-0 rounded-sm border border-[color-mix(in_srgb,var(--color-warning)_38%,transparent)] bg-transparent px-2 py-0.5 text-text hover:bg-[color-mix(in_srgb,var(--color-warning)_16%,transparent)]"
        type="button"
        aria-label={t('ai_summary.token_warning_dismiss_aria')}
        onClick={onDismiss}
      >
        {t('common.cancel')}
      </button>
    </div>
  );
};
