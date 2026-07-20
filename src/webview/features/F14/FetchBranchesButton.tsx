import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface FetchBranchesButtonProps {
  isLoading: boolean;
  onClick: () => void;
}

export const FetchBranchesButton: FC<FetchBranchesButtonProps> = ({ isLoading, onClick }) => {
  const { t } = useTranslation();

  return (
    <button
      className="inline-flex size-7 items-center justify-center rounded-md bg-panel text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text disabled:cursor-wait disabled:opacity-80"
      type="button"
      onClick={onClick}
      disabled={isLoading}
      aria-label={t('branch.fetch')}
      title={t('branch.fetch')}
    >
      {isLoading ? (
        <span
          className="inline-block size-3 rounded-full border border-line border-t-link motion-safe:animate-spin"
          aria-hidden="true"
        />
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" aria-hidden="true">
          <path d="M13 5V2.75H10.75" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 2.75A5.75 5.75 0 1 0 14 8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
};
