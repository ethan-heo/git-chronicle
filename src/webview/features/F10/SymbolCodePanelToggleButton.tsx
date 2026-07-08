import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface SymbolCodePanelToggleButtonProps {
  isOpen: boolean;
  disabled: boolean;
  onClick: () => void;
}

export const SymbolCodePanelToggleButton: FC<SymbolCodePanelToggleButtonProps> = ({ isOpen, disabled, onClick }) => {
  const { t } = useTranslation();
  const label = isOpen ? t('symbol_graph.code_panel_hide') : t('symbol_graph.code_panel_show');

  return (
    <button
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-panel text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-45"
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <rect x="1.6" y="2" width="4.9" height="12" rx="1.1" />
        <rect x="9.5" y="2" width="4.9" height="12" rx="1.1" />
      </svg>
    </button>
  );
};
