import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

interface CommitGroupFilterToggleButtonProps {
  isOpen: boolean;
  isActive: boolean;
  onClick: () => void;
}

export const CommitGroupFilterToggleButton = forwardRef<HTMLButtonElement, CommitGroupFilterToggleButtonProps>(
  function CommitGroupFilterToggleButton({ isOpen, isActive, onClick }, ref) {
    const { t } = useTranslation();

    return (
      <button
        ref={ref}
        className={[
          'relative inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors duration-100 ease-in-out',
          isOpen || isActive
            ? 'bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-accent'
            : 'bg-panel text-muted hover:bg-hover hover:text-text',
        ].join(' ')}
        type="button"
        aria-label={t('commit.group_filter_toggle_aria', {
          state: isOpen ? t('commit.filter_toggle_state_close') : t('commit.filter_toggle_state_open'),
        })}
        aria-expanded={isOpen}
        aria-pressed={isOpen}
        title={t('commit.group_filter_title')}
        onClick={onClick}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <circle cx="5.5" cy="5.5" r="2.5" />
          <circle cx="11" cy="5.5" r="2.5" />
          <circle cx="8.25" cy="10.5" r="2.5" />
        </svg>
        {isActive ? (
          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-accent" aria-hidden="true" />
        ) : null}
      </button>
    );
  },
);
