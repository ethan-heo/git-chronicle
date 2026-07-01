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
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(0,0,0,0.5)] p-6" role="presentation" onClick={onCancel}>
      <section
        className="w-full max-w-[300px] overflow-hidden rounded-md border border-line bg-elevated shadow-[0_8px_30px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-summary-overwrite-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-[14px]">
          <strong id="ai-summary-overwrite-title" className="mb-2.5 block text-[13.5px] text-text">{t('ai_summary.overwrite_title')}</strong>
          <p className="m-0 text-sm leading-[1.55] text-muted">{t('ai_summary.overwrite_body')}</p>
        </div>
        <div className="flex justify-end gap-2 px-4 pb-4">
          <button
            className="inline-flex items-center justify-center rounded-sm border border-line bg-secondary px-2.5 py-1 text-[11.5px] text-text transition-colors duration-100 ease-in-out hover:bg-secondary-hi"
            type="button"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </button>
          <PrimaryButton onClick={onConfirm}>{t('common.confirm')}</PrimaryButton>
        </div>
      </section>
    </div>
  );
};
