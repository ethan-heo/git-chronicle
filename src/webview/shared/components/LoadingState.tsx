import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingStateProps {
  label?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: FC<LoadingStateProps> = ({ label = null, size = 'md' }) => {
  const { t } = useTranslation();

  return (
    <div className="loading-state" aria-busy="true" aria-label={label ?? t('common.loading')} role="status">
      <span className={`loading-state-spinner loading-state-spinner-${size}`} aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </div>
  );
};
