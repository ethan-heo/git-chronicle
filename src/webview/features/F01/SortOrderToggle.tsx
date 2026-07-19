import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import type { FilterState } from '../../types/commit';

interface SortOrderToggleProps {
  sortOrder: FilterState['sortOrder'];
  onSortOrderChange: (sortOrder: FilterState['sortOrder']) => void;
}

export const SortOrderToggle: FC<SortOrderToggleProps> = ({ sortOrder, onSortOrderChange }) => {
  const { t } = useTranslation();
  const isDescending = sortOrder === 'desc';
  const nextSortOrder: FilterState['sortOrder'] = isDescending ? 'asc' : 'desc';
  const orderLabel = isDescending ? t('commit.sort_desc') : t('commit.sort_asc');
  const ariaLabel = t('commit.sort_aria', { order: orderLabel });

  return (
    <button
      className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-panel text-[11px] leading-none text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text"
      type="button"
      onClick={() => onSortOrderChange(nextSortOrder)}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <span aria-hidden="true">{isDescending ? '↓' : '↑'}</span>
    </button>
  );
};
