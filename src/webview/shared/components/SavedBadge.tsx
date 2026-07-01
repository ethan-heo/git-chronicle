import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface SavedBadgeProps {
  isVisible?: boolean;
}

export const SavedBadge: FC<SavedBadgeProps> = ({ isVisible = true }) => {
  const { t } = useTranslation();
  if (!isVisible) {
    return null;
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--color-renamed)_14%,transparent)] px-2 py-0.5 text-xs text-renamed"
      aria-label={t('shared.saved')}
      title={t('shared.saved')}
    >
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 8.4 6.3 11.5 13 4.5" />
      </svg>
      {t('shared.saved')}
    </span>
  );
};
