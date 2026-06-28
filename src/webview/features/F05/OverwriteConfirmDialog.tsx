import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '../../shared/components';

interface OverwriteConfirmDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const OverwriteConfirmDialog: FC<OverwriteConfirmDialogProps> = ({ isOpen, onCancel, onConfirm }) => {
  const { t } = useTranslation();
  if (!isOpen) {
    return null;
  }

  return (
    <div className="ai-summary-dialog-backdrop" role="presentation" onClick={onCancel}>
      <section className="ai-summary-dialog" role="dialog" aria-modal="true" aria-labelledby="ai-summary-overwrite-title" onClick={(event) => event.stopPropagation()}>
        <div className="ai-summary-dialog-body">
          <strong id="ai-summary-overwrite-title">{t('ai_summary.overwrite_title')}</strong>
          <p>{t('ai_summary.overwrite_body')}</p>
        </div>
        <div className="ai-summary-dialog-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <PrimaryButton onClick={onConfirm}>{t('common.confirm')}</PrimaryButton>
        </div>
      </section>
    </div>
  );
};
