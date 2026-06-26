import { useEffect, useState, type FC } from 'react';

interface KeywordSearchInputProps {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  debounceMs?: number;
}

export const KeywordSearchInput: FC<KeywordSearchInputProps> = ({
  keyword,
  onKeywordChange,
  debounceMs = 300,
}) => {
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
    <div className="commit-filter-field">
      <label className="commit-filter-label" htmlFor="commit-keyword-filter">
        키워드
      </label>
      <div className="keyword-search-input">
        <span className="keyword-search-icon" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
        </span>
        <input
          id="commit-keyword-filter"
          type="search"
          value={localValue}
          onChange={(event) => setLocalValue(event.target.value)}
          aria-label="커밋 메시지 키워드 검색"
          placeholder="커밋 메시지 검색"
        />
        {localValue ? (
          <button className="keyword-clear-button" type="button" onClick={clearKeyword} aria-label="검색어 지우기">
            x
          </button>
        ) : null}
      </div>
    </div>
  );
};
