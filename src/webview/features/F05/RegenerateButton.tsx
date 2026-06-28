import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface RegenerateButtonProps {
  disabled: boolean;
  onClick: () => void;
}

export const RegenerateButton: FC<RegenerateButtonProps> = ({ disabled, onClick }) => {
  const { t } = useTranslation();
  return (
    <button className="secondary-button ai-summary-regenerate-button" type="button" aria-label={t('ai_summary.regenerate')} disabled={disabled} onClick={onClick}>
      {t('ai_summary.regenerate')}
    </button>
  );
};
