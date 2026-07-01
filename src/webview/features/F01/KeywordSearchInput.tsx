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
    <div className={['flex min-w-0 flex-col gap-1', className].filter(Boolean).join(' ')}>
      <label className="text-[11px] text-muted" htmlFor={id}>
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-2 inline-flex text-muted" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
            <circle cx="7" cy="7" r="4.5" />
            <path d="m10.5 10.5 3 3" />
          </svg>
        </span>
        <input
          className="w-full min-w-0 rounded-sm border border-transparent bg-[var(--vscode-input-background,#3c3c3c)] py-[5px] pr-[26px] pl-7 text-sm text-[var(--vscode-input-foreground,var(--color-text))] [color-scheme:dark] focus:border-focus focus:outline-none"
          id={id}
          type="search"
          value={localValue}
          onChange={(event) => setLocalValue(event.target.value)}
          aria-label={ariaLabel}
          placeholder={placeholder ?? t('commit.filter_include_placeholder')}
        />
        {localValue ? (
          <button
            className="absolute right-1.5 inline-flex size-4 items-center justify-center rounded-sm bg-transparent text-[11px] leading-none text-muted hover:bg-hover hover:text-text"
            type="button"
            onClick={clearKeyword}
            aria-label={t('commit.search_clear_aria')}
          >
            x
          </button>
        ) : null}
      </div>
    </div>
  );
};
