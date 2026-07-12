import { useEffect, useId, useMemo, useRef, useState, type FC, type KeyboardEvent, type ReactNode } from 'react';

interface PathAutocompleteInputProps {
  value: string;
  placeholder: string;
  directorySuggestions: string[];
  onChange: (value: string) => void;
}

export const PathAutocompleteInput: FC<PathAutocompleteInputProps> = ({
  value,
  placeholder,
  directorySuggestions,
  onChange,
}) => {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const matches = useMemo(
    () => getMatchingSuggestions(value, directorySuggestions),
    [value, directorySuggestions],
  );
  const isOpen = isFocused && !isDismissed && matches.length > 0;

  useEffect(() => {
    setActiveIndex(-1);
    setIsDismissed(false);
  }, [value, directorySuggestions]);

  const selectSuggestion = (suggestion: string): void => {
    onChange(suggestion);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (!isOpen) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, matches.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(matches[activeIndex]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setActiveIndex(-1);
      setIsDismissed(true);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        className="w-full rounded-md border border-line bg-panel/80 px-3 py-2 text-sm text-text outline-none focus:border-focus"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        aria-autocomplete="list"
      />
      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          className="mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-line bg-panel/80"
        >
          {matches.map((suggestion, index) => (
            <li
              key={suggestion}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              className={`cursor-pointer px-3 py-1.5 text-sm text-text ${index === activeIndex ? 'bg-hover' : ''}`}
              onMouseDown={(event) => {
                event.preventDefault();
                selectSuggestion(suggestion);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {renderHighlighted(suggestion, value)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export function getMatchingSuggestions(value: string, directorySuggestions: string[]): string[] {
  const normalizedValue = value.replaceAll('\\', '/').toLowerCase();

  if (!normalizedValue) {
    return [];
  }

  return directorySuggestions.filter((candidate) => candidate.toLowerCase().includes(normalizedValue));
}

function renderHighlighted(suggestion: string, value: string): ReactNode {
  const normalizedValue = value.replaceAll('\\', '/').toLowerCase();

  if (!normalizedValue) {
    return suggestion;
  }

  const matchIndex = suggestion.toLowerCase().indexOf(normalizedValue);
  if (matchIndex === -1) {
    return suggestion;
  }

  const before = suggestion.slice(0, matchIndex);
  const match = suggestion.slice(matchIndex, matchIndex + normalizedValue.length);
  const after = suggestion.slice(matchIndex + normalizedValue.length);

  return [
    before,
    <mark key="match" className="rounded-sm bg-accent/25 text-text">{match}</mark>,
    after,
  ];
}
