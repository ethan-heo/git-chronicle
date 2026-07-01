import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface RegenerateButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export const RegenerateButton: FC<RegenerateButtonProps> = ({ disabled, onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      className="shrink-0 rounded-sm border border-line bg-secondary px-2.5 py-1 text-[11.5px] text-text transition-colors duration-100 ease-in-out hover:bg-secondary-hi disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      aria-label={t('ai_summary.regenerate')}
      disabled={disabled}
      onClick={onClick}
    >
      {t('ai_summary.regenerate')}
    </button>
  );
};
