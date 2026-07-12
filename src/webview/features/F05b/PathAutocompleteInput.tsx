import { useEffect, useMemo, useState, type FC, type KeyboardEvent } from 'react';

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
  const [caretAtEnd, setCaretAtEnd] = useState(true);
  const [isSuggestionDismissed, setIsSuggestionDismissed] = useState(false);

  useEffect(() => {
    setIsSuggestionDismissed(false);
  }, [value]);

  const suggestion = useMemo(() => {
    if (!caretAtEnd || isSuggestionDismissed) {
      return null;
    }

    return getActiveSuggestion(value, directorySuggestions);
  }, [caretAtEnd, directorySuggestions, isSuggestionDismissed, value]);

  const handleSelectionState = (input: HTMLInputElement): void => {
    const selectionEnd = input.selectionEnd ?? input.value.length;
    const selectionStart = input.selectionStart ?? selectionEnd;
    setCaretAtEnd(selectionStart === selectionEnd && selectionEnd === input.value.length);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Tab' && suggestion) {
      const completed = applyAutocompleteSegment(value, suggestion);
      if (completed !== value) {
        event.preventDefault();
        onChange(completed);
        setIsSuggestionDismissed(false);
      }
      return;
    }

    if (event.key === 'Escape' && suggestion) {
      event.preventDefault();
      event.stopPropagation();
      setIsSuggestionDismissed(true);
    }
  };

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-md border border-transparent px-3 py-2 text-sm whitespace-pre"
      >
        <span className="invisible">{value}</span>
        {suggestion ? <span className="text-muted/70">{suggestion.slice(value.length)}</span> : null}
      </div>
      <input
        className="relative z-[1] w-full rounded-md border border-line bg-panel/80 px-3 py-2 text-sm text-text outline-none focus:border-focus"
        value={value}
        onChange={(event) => {
          setIsSuggestionDismissed(false);
          onChange(event.target.value);
        }}
        onClick={(event) => handleSelectionState(event.currentTarget)}
        onKeyDown={handleKeyDown}
        onKeyUp={(event) => handleSelectionState(event.currentTarget)}
        onSelect={(event) => handleSelectionState(event.currentTarget)}
        placeholder={placeholder}
        autoFocus
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
      />
    </div>
  );
};

export function getActiveSuggestion(value: string, directorySuggestions: string[]): string | null {
  if (!value) {
    return directorySuggestions[0] ?? null;
  }

  const normalizedValue = value.replaceAll('\\', '/');
  const matches = directorySuggestions.filter((candidate) => (
    candidate.startsWith(normalizedValue) && candidate.length > normalizedValue.length
  ));

  return matches[0] ?? null;
}

export function applyAutocompleteSegment(value: string, suggestion: string): string {
  if (!suggestion.startsWith(value) || suggestion.length <= value.length) {
    return value;
  }

  const remainder = suggestion.slice(value.length);
  const nextSlashIndex = remainder.indexOf('/');

  if (nextSlashIndex === -1) {
    return `${value}${remainder}`;
  }

  return `${value}${remainder.slice(0, nextSlashIndex + 1)}`;
}
