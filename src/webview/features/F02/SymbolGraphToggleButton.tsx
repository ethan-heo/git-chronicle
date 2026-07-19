import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface SymbolGraphToggleButtonProps {
  isActive: boolean;
  disabled: boolean;
  onClick: () => void;
}

export const SymbolGraphToggleButton: FC<SymbolGraphToggleButtonProps> = ({ isActive, disabled, onClick }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'inline-flex size-8 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        isActive
          ? 'bg-[color-mix(in_srgb,var(--color-accent)_16%,var(--color-panel))] text-accent'
          : 'bg-panel text-muted hover:bg-hover hover:text-text disabled:hover:bg-panel disabled:hover:text-muted',
      ].join(' ')}
      aria-label={t('symbol_graph.open_aria')}
      aria-pressed={isActive}
      title={t('symbol_graph.open_aria')}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        <path d="M3 4h3v3H3zM10 3h3v3h-3zM8 10h3v3H8z" />
        <path d="M6 5.5h4M11.5 6v3.5M6.5 7.5l2 2" />
      </svg>
    </button>
  );
};
