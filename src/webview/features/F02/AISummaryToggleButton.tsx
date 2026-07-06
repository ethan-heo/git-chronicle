import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface AISummaryToggleButtonProps {
  hasSavedSummary: boolean;
  isActive: boolean;
  onClick: () => void;
}

export const AISummaryToggleButton: FC<AISummaryToggleButtonProps> = ({
  hasSavedSummary,
  isActive,
  onClick,
}) => {
  const { t } = useTranslation();

  return (
    <button
      className={[
        'inline-flex size-9 items-center justify-center rounded-md border transition-colors duration-100 ease-in-out',
        hasSavedSummary || isActive
          ? 'border-accent bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-accent'
          : 'border-line bg-panel text-muted hover:bg-hover hover:text-text',
      ].join(' ')}
      type="button"
      aria-label={t('action_bar.commit_ai_aria')}
      title={t('action_bar.commit_ai_aria')}
      onClick={onClick}
    >
      {hasSavedSummary ? (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <path d="M8 1.5 9.35 5l3.65.15-2.86 2.28.97 3.52L8 9.55l-3.11 1.4.97-3.52L3 5.15 6.65 5z" />
          <circle cx="12.7" cy="3.3" r="1.1" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M8 1.5 9.35 5l3.65.15-2.86 2.28.97 3.52L8 9.55l-3.11 1.4.97-3.52L3 5.15 6.65 5z" />
          <circle cx="12.7" cy="3.3" r="1.1" />
        </svg>
      )}
    </button>
  );
};
