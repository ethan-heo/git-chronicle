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
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-text transition-colors duration-100 ease-in-out hover:bg-secondary-hi disabled:cursor-not-allowed disabled:opacity-50"
      type="button"
      aria-label={t('ai_summary.regenerate')}
      title={t('ai_summary.regenerate')}
      disabled={disabled}
      onClick={onClick}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13.2 8a5.2 5.2 0 1 1-1.52-3.68" />
        <path d="M13.2 3.3v3.24H9.96" />
      </svg>
    </button>
  );
};
