import { useEffect, useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';

interface KeywordSearchInputProps {
  id: string;
  label: string;
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  placeholder?: string;
  ariaLabel: string;
  className?: string;
  debounceMs?: number;
}

export const KeywordSearchInput: FC<KeywordSearchInputProps> = ({
  id,
  label,
  keyword,
  onKeywordChange,
  placeholder,
  ariaLabel,
  className,
  debounceMs = 300,
}) => {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(keyword);

  useEffect(() => {
    setLocalValue(keyword);
  }, [keyword]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (localValue !== keyword) {
        onKeywordChange(localValue);
      }
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, keyword, localValue, onKeywordChange]);

  const clearKeyword = (): void => {
    setLocalValue('');
    onKeywordChange('');
  };

  return (
    <div className={`commit-filter-field ${className ?? ''}`.trim()}>
      <label className="commit-filter-label" htmlFor={id}>
        {label}
      </label>
      <div className="keyword-search-input">
        <span className="keyword-search-icon" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
        </span>
        <input
          id={id}
          type="search"
          value={localValue}
          onChange={(event) => setLocalValue(event.target.value)}
          aria-label={ariaLabel}
          placeholder={placeholder ?? t('commit.filter_include_placeholder')}
        />
        {localValue ? (
          <button className="keyword-clear-button" type="button" onClick={clearKeyword} aria-label={t('commit.search_clear_aria')}>
            x
          </button>
        ) : null}
      </div>
    </div>
  );
};
