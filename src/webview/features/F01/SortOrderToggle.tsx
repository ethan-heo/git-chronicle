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

  return (
    <button
      className="inline-flex h-7 items-center gap-1 whitespace-nowrap rounded-full border border-line bg-elevated px-2 text-[10px] leading-none text-text transition-colors duration-100 ease-in-out hover:border-muted hover:bg-hover"
      type="button"
      onClick={() => onSortOrderChange(nextSortOrder)}
      aria-label={t('commit.sort_aria', { order: orderLabel })}
    >
      <span aria-hidden="true">{isDescending ? '↓' : '↑'}</span>
      <span>{orderLabel}</span>
    </button>
  );
};
