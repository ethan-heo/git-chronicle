import type { FC } from 'react';
import type { FilterState } from '../../types/commit';

interface SortOrderToggleProps {
  sortOrder: FilterState['sortOrder'];
  onSortOrderChange: (sortOrder: FilterState['sortOrder']) => void;
}

export const SortOrderToggle: FC<SortOrderToggleProps> = ({ sortOrder, onSortOrderChange }) => {
  const isDescending = sortOrder === 'desc';
  const nextSortOrder: FilterState['sortOrder'] = isDescending ? 'asc' : 'desc';

  return (
    <button
      className="commit-filter-sort-toggle"
      type="button"
      onClick={() => onSortOrderChange(nextSortOrder)}
      aria-label={`정렬 순서 변경, 현재 ${isDescending ? '최신순' : '오래된순'}`}
    >
      <span aria-hidden="true">{isDescending ? '↓' : '↑'}</span>
      <span>{isDescending ? '최신순' : '오래된순'}</span>
    </button>
  );
};
