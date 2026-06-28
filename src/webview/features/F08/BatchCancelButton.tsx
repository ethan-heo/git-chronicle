import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface BatchCancelButtonProps {
  disabled: boolean;
  onCancel: () => void;
}

export const BatchCancelButton: FC<BatchCancelButtonProps> = ({ disabled, onCancel }) => {
  const { t } = useTranslation();
  return (
    <button className="batch-cancel-button" type="button" aria-label={t('action_bar.batch_cancel_aria')} title={t('action_bar.batch_cancel_title')} disabled={disabled} onClick={onCancel}>
      {disabled ? t('batch.cancelling') : t('batch.cancel')}
    </button>
  );
};
