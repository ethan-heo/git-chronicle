import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

interface FilterToggleButtonProps {
  isOpen: boolean;
  activeFilterCount: number;
  onClick: () => void;
}

export const FilterToggleButton = forwardRef<HTMLButtonElement, FilterToggleButtonProps>(function FilterToggleButton(
  { isOpen, activeFilterCount, onClick },
  ref,
) {
  const { t } = useTranslation();
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <button
      ref={ref}
      className={[
        'relative inline-flex size-7 shrink-0 items-center justify-center rounded-md transition-colors duration-100 ease-in-out',
        isOpen || hasActiveFilters
          ? 'bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-accent'
          : 'bg-panel text-muted hover:bg-hover hover:text-text',
      ].join(' ')}
      type="button"
      aria-label={t('commit.filter_toggle_aria', {
        state: isOpen ? t('commit.filter_toggle_state_close') : t('commit.filter_toggle_state_open'),
      })}
      aria-expanded={isOpen}
      aria-pressed={isOpen}
      title={t('commit.filter_title')}
      onClick={onClick}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M2.5 3.5h11" />
        <path d="M4.5 7.5h7" />
        <path d="M6.5 11.5h3" />
      </svg>
      {hasActiveFilters ? (
        <span className="absolute -top-1 -right-1 min-w-4 rounded-full bg-accent px-1 py-px text-[9px] font-bold leading-none text-on-accent">
          {activeFilterCount}
        </span>
      ) : null}
    </button>
  );
});
