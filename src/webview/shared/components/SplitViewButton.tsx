import type { FC } from 'react';

interface SplitViewButtonProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

export const SplitViewButton: FC<SplitViewButtonProps> = ({ label, disabled = false, onClick }) => {
  return (
    <button
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm bg-transparent text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-45"
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <rect x="1.6" y="2" width="4.9" height="12" rx="1.1" />
        <rect x="9.5" y="2" width="4.9" height="12" rx="1.1" />
      </svg>
    </button>
  );
};
