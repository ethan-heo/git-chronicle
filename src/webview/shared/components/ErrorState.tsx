import type { FC } from 'react';

interface ErrorStateProps {
  message: string;
  onRetry?: (() => void) | null;
}

export const ErrorState: FC<ErrorStateProps> = ({ message, onRetry = null }) => {
  return (
    <div className="error-state" role="alert">
      <span>{message}</span>
      {onRetry ? (
        <button className="secondary-button" type="button" onClick={onRetry}>
          재시도
        </button>
      ) : null}
    </div>
  );
};
