import { useCallback, useState, type FC } from 'react';
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
  variant?: 'standalone' | 'embedded';
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
  variant = 'standalone',
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
  const handleKeywordChange = useCallback(
    (keyword: string) => onFilterChange({ filterKeyword: keyword }),
    [onFilterChange],
  );
  const handleExcludeKeywordChange = useCallback(
    (keyword: string) => onFilterChange({ filterExcludeKeyword: keyword }),
    [onFilterChange],
  );

  if (variant === 'embedded') {
    return (
      <div className="flex min-h-0 flex-1 flex-col px-3 py-3" role="search">
        <div className="grid grid-cols-1 gap-2.5">
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
            onKeywordChange={handleKeywordChange}
            ariaLabel={t('commit.filter_include_aria')}
            placeholder={t('commit.filter_include_placeholder')}
          />
          <KeywordSearchInput
            id="commit-exclude-keyword-filter"
            label={t('commit.filter_exclude_label')}
            keyword={filterExcludeKeyword}
            onKeywordChange={handleExcludeKeywordChange}
            ariaLabel={t('commit.filter_exclude_aria')}
            placeholder={t('commit.filter_exclude_placeholder')}
          />
        </div>
        <div className="flex justify-end pt-3">
          <button
            className="bg-transparent px-1 py-0.5 text-[11px] text-link hover:underline"
            type="button"
            onClick={onClearFilters}
          >
            {t('commit.clear_filters')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <section
      className={`shrink-0 border-b border-line bg-panel ${isActive ? 'shadow-[inset_2px_0_0_var(--color-accent)]' : ''}`}
      role="search"
    >
      <div className="flex min-h-[31px] items-center justify-between gap-2 px-2.5 py-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            className="inline-flex min-w-0 items-center gap-1.5 bg-transparent py-[3px] text-left text-text"
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
        <div className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-[11px] text-link">
          {isActive ? (
            <span className="rounded-full bg-accent px-[7px] py-px text-xs font-medium text-on-accent">
              {t('commit.filter_applied', { count: activeFilterCount })}
            </span>
          ) : (
            <span>{t('commit.filter_none')}</span>
          )}
          <button
            className="bg-transparent px-1 py-0.5 text-[11px] text-link hover:underline"
            type="button"
            onClick={onClearFilters}
          >
            {t('commit.clear_filters')}
          </button>
        </div>
      </div>
      {!isCollapsed ? (
        <div className="grid grid-cols-2 gap-2.5 px-2.5 pt-0.5 pb-3">
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
            onKeywordChange={handleKeywordChange}
            ariaLabel={t('commit.filter_include_aria')}
            placeholder={t('commit.filter_include_placeholder')}
          />
          <KeywordSearchInput
            id="commit-exclude-keyword-filter"
            label={t('commit.filter_exclude_label')}
            keyword={filterExcludeKeyword}
            onKeywordChange={handleExcludeKeywordChange}
            ariaLabel={t('commit.filter_exclude_aria')}
            placeholder={t('commit.filter_exclude_placeholder')}
          />
        </div>
      ) : null}
    </section>
  );
};
