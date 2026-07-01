import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingStateProps {
  label?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: FC<LoadingStateProps> = ({ label = null, size = 'md' }) => {
  const { t } = useTranslation();
  const spinnerSizeClassName =
    size === 'sm' ? 'size-[13px]' : size === 'lg' ? 'size-5' : 'size-[15px]';

  return (
    <div
      className="inline-flex items-center gap-[9px] text-sm text-muted"
      aria-busy="true"
      aria-label={label ?? t('common.loading')}
      role="status"
    >
      <span
        className={`inline-block rounded-full border-2 border-line border-t-link motion-safe:animate-spin ${spinnerSizeClassName}`}
        aria-hidden="true"
      />
      {label ? <span>{label}</span> : null}
    </div>
  );
};
