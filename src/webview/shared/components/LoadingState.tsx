import type { FC } from 'react';

interface LoadingStateProps {
  label?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: FC<LoadingStateProps> = ({ label = null, size = 'md' }) => {
  return (
    <div className="loading-state" aria-busy="true" aria-label={label ?? '로딩 중'} role="status">
      <span className={`loading-state-spinner loading-state-spinner-${size}`} aria-hidden="true" />
      {label ? <span>{label}</span> : null}
    </div>
  );
};
