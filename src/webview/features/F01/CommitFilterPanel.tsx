import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
            <span>{t('commit.filter_title')}</span>
          </button>
          <SortOrderToggle
            sortOrder={sortOrder}
            onSortOrderChange={(nextSortOrder) => onFilterChange({ sortOrder: nextSortOrder })}
          />
        </div>
        <div className="active-filter-summary">
          {isActive ? <span>{t('commit.filter_applied', { count: activeFilterCount })}</span> : <span>{t('commit.filter_none')}</span>}
          <button className="filter-reset-button" type="button" onClick={onClearFilters}>
            {t('commit.clear_filters')}
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
            label={t('commit.filter_include_label')}
            keyword={filterKeyword}
            onKeywordChange={(keyword) => onFilterChange({ filterKeyword: keyword })}
            ariaLabel={t('commit.filter_include_aria')}
            placeholder={t('commit.filter_include_placeholder')}
          />
          <KeywordSearchInput
            id="commit-exclude-keyword-filter"
            label={t('commit.filter_exclude_label')}
            keyword={filterExcludeKeyword}
            onKeywordChange={(keyword) => onFilterChange({ filterExcludeKeyword: keyword })}
            ariaLabel={t('commit.filter_exclude_aria')}
            placeholder={t('commit.filter_exclude_placeholder')}
          />
        </div>
      ) : null}
    </section>
  );
};
