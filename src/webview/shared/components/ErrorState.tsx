import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  message: string;
  onRetry?: (() => void) | null;
}

export const ErrorState: FC<ErrorStateProps> = ({ message, onRetry = null }) => {
  const { t } = useTranslation();

  return (
    <div className="error-state" role="alert">
      <span>{message}</span>
      {onRetry ? (
        <button className="secondary-button" type="button" onClick={onRetry}>
          {t('common.retry')}
        </button>
      ) : null}
    </div>
  );
};
