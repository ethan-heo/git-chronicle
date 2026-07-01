import type { FC } from 'react';
import { PrimaryButton } from './PrimaryButton';

interface EmptyStateProps {
  message: string;
  ctaLabel?: string | null;
  onCtaClick?: (() => void) | null;
}

export const EmptyState: FC<EmptyStateProps> = ({ message, ctaLabel = null, onCtaClick = null }) => {
  return (
    <div className="flex flex-col items-center gap-[9px] py-2 text-center">
      <div
        className="inline-flex size-[34px] items-center justify-center rounded-full border-[1.5px] border-line text-dim"
        aria-hidden="true"
      >
        <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" />
        </svg>
      </div>
      <p className="m-0 text-sm text-muted">{message}</p>
      {ctaLabel && onCtaClick ? <PrimaryButton onClick={onCtaClick}>{ctaLabel}</PrimaryButton> : null}
    </div>
  );
};
