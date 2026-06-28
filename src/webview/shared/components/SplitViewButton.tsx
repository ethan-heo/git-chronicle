import type { FC } from 'react';

interface SplitViewButtonProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

export const SplitViewButton: FC<SplitViewButtonProps> = ({ label, disabled = false, onClick }) => {
  return (
    <button className="top-header-icon-button split-view-button" type="button" onClick={onClick} aria-label={label} title={label} disabled={disabled}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <rect x="1.6" y="2" width="4.9" height="12" rx="1.1" />
        <rect x="9.5" y="2" width="4.9" height="12" rx="1.1" />
      </svg>
    </button>
  );
};
