import { useState, type FC } from 'react';
import { useTranslation } from 'react-i18next';

interface CommitSelectionActionBarProps {
  selectedCount: number;
  isEditing: boolean;
  initialName?: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export const CommitSelectionActionBar: FC<CommitSelectionActionBarProps> = ({
  selectedCount,
  isEditing,
  initialName = '',
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);

  const submit = (): void => {
    if (!name.trim() || selectedCount === 0) {
      return;
    }

    onSave(name.trim());
  };

  const saveLabel = isEditing ? t('commit.selection_bar_save_update') : t('commit.selection_bar_save_create');
  const countLabel = t('commit.selection_bar_count', { count: selectedCount });

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b border-line bg-panel px-2 py-1.5">
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-secondary px-1.5 py-px text-[10px] font-medium text-muted"
        aria-label={countLabel}
        title={countLabel}
      >
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
          <path d="M5 8.2l2 2 4-4.4" />
        </svg>
        {selectedCount}
      </span>
      <input
        className="min-w-0 flex-1 rounded-md border border-line bg-panel px-2 py-1 text-xs text-text outline-none focus:border-focus"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            submit();
          }
        }}
        placeholder={t('commit.selection_bar_name_placeholder')}
        aria-label={t('commit.selection_bar_name_aria')}
        title={t('commit.selection_bar_name_aria')}
        autoFocus
      />
      <button
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-on-accent transition-opacity duration-100 ease-in-out disabled:opacity-40"
        type="button"
        disabled={!name.trim() || selectedCount === 0}
        onClick={submit}
        aria-label={saveLabel}
        title={saveLabel}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M3 8.4 6.3 11.5 13 4.5" />
        </svg>
      </button>
      <button
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-panel text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text"
        type="button"
        onClick={onCancel}
        aria-label={t('commit.selection_bar_cancel')}
        title={t('commit.selection_bar_cancel')}
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
};
