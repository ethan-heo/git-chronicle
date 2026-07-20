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
      className="inline-flex items-center gap-1 rounded-md bg-panel px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text disabled:cursor-wait disabled:opacity-80"
      type="button"
      onClick={onClick}
      disabled={isLoading}
      aria-label={t('branch.fetch')}
      title={t('branch.fetch')}
    >
      <span
        className={isLoading ? 'inline-block size-2.5 rounded-full border border-line border-t-link motion-safe:animate-spin' : ''}
        aria-hidden="true"
      >
        {isLoading ? null : '⟳'}
      </span>
      <span>{t('branch.fetch')}</span>
    </button>
  );
};
