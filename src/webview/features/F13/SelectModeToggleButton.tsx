import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface SelectModeToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
}

export const SelectModeToggleButton: FC<SelectModeToggleButtonProps> = ({ isActive, onClick }) => {
  const { t } = useTranslation();

  return (
    <button
      className={[
        'relative inline-flex size-6 shrink-0 items-center justify-center rounded-md transition-colors duration-100 ease-in-out',
        isActive
          ? 'bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-accent'
          : 'bg-panel text-muted hover:bg-hover hover:text-text',
      ].join(' ')}
      type="button"
      aria-label={t('commit.select_mode_toggle_aria', {
        state: isActive ? t('commit.filter_toggle_state_close') : t('commit.filter_toggle_state_open'),
      })}
      aria-pressed={isActive}
      title={t('commit.select_mode_title')}
      onClick={onClick}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
        <path d="M5 8.2l2 2 4-4.4" />
      </svg>
    </button>
  );
};
