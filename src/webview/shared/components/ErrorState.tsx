import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  message: string;
  onRetry?: (() => void) | null;
}

export const ErrorState: FC<ErrorStateProps> = ({ message, onRetry = null }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-[9px] text-sm text-error" role="alert">
      <span>{message}</span>
      {onRetry ? (
        <button
          className="inline-flex items-center justify-center rounded-sm border border-line bg-secondary px-2.5 py-1 text-[11.5px] text-text transition-colors duration-100 ease-in-out hover:bg-secondary-hi"
          type="button"
          onClick={onRetry}
        >
          {t('common.retry')}
        </button>
      ) : null}
    </div>
  );
};
