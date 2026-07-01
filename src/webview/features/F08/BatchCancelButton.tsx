import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface BatchCancelButtonProps {
  disabled: boolean;
  onCancel: () => void;
}

export const BatchCancelButton: FC<BatchCancelButtonProps> = ({ disabled, onCancel }) => {
  const { t } = useTranslation();
  return (
    <button
      className="ml-1 shrink-0 rounded-sm border border-line bg-transparent px-[11px] py-1 text-[11px] text-muted transition-colors duration-[var(--gae-motion-duration-fast)] ease-[var(--gae-motion-easing-default)] hover:border-muted hover:bg-secondary-hi hover:text-text disabled:cursor-progress disabled:opacity-[0.62] disabled:hover:border-line disabled:hover:bg-transparent disabled:hover:text-muted"
      type="button"
      aria-label={t('action_bar.batch_cancel_aria')}
      title={t('action_bar.batch_cancel_title')}
      disabled={disabled}
      onClick={onCancel}
    >
      {disabled ? t('batch.cancelling') : t('batch.cancel')}
    </button>
  );
};
