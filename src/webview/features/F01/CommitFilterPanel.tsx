import { useState, type FC } from 'react';
import type { FilterState } from '../../types/commit';
import { AuthorDropdown } from './AuthorDropdown';
import { DateRangeFilter } from './DateRangeFilter';
import { KeywordSearchInput } from './KeywordSearchInput';
import { SortOrderToggle } from './SortOrderToggle';

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
  filterExcludeKeyword,
  sortOrder,
  authorList,
  onFilterChange,
  onClearFilters,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const activeFilterCount = [
    filterDateStart,
    filterDateEnd,
    filterAuthor,
    filterKeyword.trim(),
    filterExcludeKeyword.trim(),
  ].filter(Boolean).length;
  const isActive = activeFilterCount > 0;

  return (
    <section className={`commit-filter-panel ${isActive ? 'commit-filter-panel-active' : ''}`} role="search">
      <div className="commit-filter-header">
        <div className="commit-filter-header-leading">
          <button
            className="commit-filter-toggle"
            type="button"
            onClick={() => setIsCollapsed((current) => !current)}
            aria-expanded={!isCollapsed}
          >
            <span aria-hidden="true">{isCollapsed ? '▸' : '▾'}</span>
            <span>필터</span>
          </button>
          <SortOrderToggle
            sortOrder={sortOrder}
            onSortOrderChange={(nextSortOrder) => onFilterChange({ sortOrder: nextSortOrder })}
          />
        </div>
        <div className="active-filter-summary">
          {isActive ? <span>{activeFilterCount} 적용</span> : <span>조건 없음</span>}
          <button className="filter-reset-button" type="button" onClick={onClearFilters}>
            초기화
          </button>
        </div>
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
            id="commit-keyword-filter"
            label="포함 키워드"
            keyword={filterKeyword}
            onKeywordChange={(keyword) => onFilterChange({ filterKeyword: keyword })}
            ariaLabel="커밋 메시지 포함 키워드 검색"
            placeholder="커밋 메시지 포함"
          />
          <KeywordSearchInput
            id="commit-exclude-keyword-filter"
            label="제외 키워드"
            keyword={filterExcludeKeyword}
            onKeywordChange={(keyword) => onFilterChange({ filterExcludeKeyword: keyword })}
            ariaLabel="커밋 메시지 제외 키워드 검색"
            placeholder="쉼표로 구분"
          />
        </div>
      ) : null}
    </section>
  );
};
