import { useState, type FC } from 'react';
import type { FilterState } from '../../types/commit';
import { AuthorDropdown } from './AuthorDropdown';
import { DateRangeFilter } from './DateRangeFilter';
import { KeywordSearchInput } from './KeywordSearchInput';

interface CommitFilterPanelProps extends FilterState {
  authorList: string[];
  onFilterChange: (filter: Partial<FilterState>) => void;
  onClearFilters: () => void;
}

export const CommitFilterPanel: FC<CommitFilterPanelProps> = ({
  filterDateStart,
  filterDateEnd,
  filterAuthor,
  filterKeyword,
  authorList,
  onFilterChange,
  onClearFilters,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeFilterCount = [filterDateStart, filterDateEnd, filterAuthor, filterKeyword.trim()].filter(Boolean).length;
  const isActive = activeFilterCount > 0;

  return (
    <section className={`commit-filter-panel ${isActive ? 'commit-filter-panel-active' : ''}`} role="search">
      <div className="commit-filter-header">
        <button
          className="commit-filter-toggle"
          type="button"
          onClick={() => setIsCollapsed((current) => !current)}
          aria-expanded={!isCollapsed}
        >
          <span aria-hidden="true">{isCollapsed ? '▸' : '▾'}</span>
          <span>필터</span>
        </button>
        {isActive ? (
          <span className="active-filter-summary">
            <span>{activeFilterCount} 적용</span>
            <button className="filter-reset-button" type="button" onClick={onClearFilters}>
              초기화
            </button>
          </span>
        ) : null}
      </div>
      {!isCollapsed ? (
        <div className="commit-filter-body">
          <DateRangeFilter
            startDate={filterDateStart}
            endDate={filterDateEnd}
            onStartDateChange={(date) => onFilterChange({ filterDateStart: date })}
            onEndDateChange={(date) => onFilterChange({ filterDateEnd: date })}
          />
          <AuthorDropdown
            authorList={authorList}
            selectedAuthor={filterAuthor}
            onAuthorChange={(author) => onFilterChange({ filterAuthor: author })}
          />
          <KeywordSearchInput
            keyword={filterKeyword}
            onKeywordChange={(keyword) => onFilterChange({ filterKeyword: keyword })}
          />
        </div>
      ) : null}
    </section>
  );
};
