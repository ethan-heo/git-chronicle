import type { FC } from 'react';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  message: string;
  ctaLabel?: string | null;
  onCtaClick?: (() => void) | null;
}

export const EmptyState: FC<EmptyStateProps> = ({ message, ctaLabel = null, onCtaClick = null }) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" />
        </svg>
      </div>
      <p>{message}</p>
      {ctaLabel && onCtaClick ? <PrimaryButton onClick={onCtaClick}>{ctaLabel}</PrimaryButton> : null}
    </div>
  );
};
