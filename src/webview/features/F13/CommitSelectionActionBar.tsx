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

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line bg-panel px-2.5 py-2">
      <span className="text-[11px] text-muted">{t('commit.selection_bar_count', { count: selectedCount })}</span>
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
        autoFocus
      />
      <button
        className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-on-accent disabled:opacity-50"
        type="button"
        disabled={!name.trim() || selectedCount === 0}
        onClick={submit}
      >
        {isEditing ? t('commit.selection_bar_save_update') : t('commit.selection_bar_save_create')}
      </button>
      <button
        className="rounded-md bg-transparent px-2 py-1 text-[11px] text-link hover:underline"
        type="button"
        onClick={onCancel}
      >
        {t('commit.selection_bar_cancel')}
      </button>
    </div>
  );
};
