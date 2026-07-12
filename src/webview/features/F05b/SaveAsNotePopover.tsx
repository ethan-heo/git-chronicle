import { useMemo, type FC, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Popover, PrimaryButton } from '../../shared/components';
import type { NoteEntry } from '../../types/note';
import { buildNoteTree, isNoteDirectoryNode, type NoteDirectoryNode } from '../F11/noteTreeModel';
import { PathAutocompleteInput } from './PathAutocompleteInput';

interface SaveAsNotePopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  entries: NoteEntry[];
  initialValue: string;
  isOpen: boolean;
  onCancel: () => void;
  onChange: (value: string) => void;
  onConfirm: () => void;
  shouldWarnBeforeOverwrite: boolean;
}

export const SaveAsNotePopover: FC<SaveAsNotePopoverProps> = ({
  anchorRef,
  entries,
  initialValue,
  isOpen,
  onCancel,
  onChange,
  onConfirm,
  shouldWarnBeforeOverwrite,
}) => {
  const { t } = useTranslation();
  const directorySuggestions = useMemo(() => getDirectorySuggestions(entries), [entries]);

  return (
    <Popover isOpen={isOpen} onClose={onCancel} anchorRef={anchorRef} labelledBy="ai-summary-save-note-title">
      <section className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-1">
          <strong id="ai-summary-save-note-title" className="text-sm text-text">{t('ai_summary.save_dialog_title')}</strong>
          <p className="m-0 text-sm text-muted">{t('ai_summary.save_dialog_body')}</p>
        </div>
        {shouldWarnBeforeOverwrite ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-100">
            {t('ai_summary.save_dialog_overwrite_warning')}
          </div>
        ) : null}
        <label className="flex flex-col gap-1.5 text-xs text-muted">
          <span>{t('ai_summary.save_dialog_filename')}</span>
          <PathAutocompleteInput
            value={initialValue}
            onChange={onChange}
            placeholder={t('ai_summary.save_dialog_placeholder')}
            directorySuggestions={directorySuggestions}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            className="inline-flex items-center justify-center rounded-sm border border-line bg-secondary px-2.5 py-1 text-[11.5px] text-text transition-colors duration-100 ease-in-out hover:bg-secondary-hi"
            type="button"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </button>
          <PrimaryButton disabled={!initialValue.trim()} onClick={onConfirm}>
            {t('ai_summary.save')}
          </PrimaryButton>
        </div>
      </section>
    </Popover>
  );
};

export function getDirectorySuggestions(entries: NoteEntry[]): string[] {
  const root = buildNoteTree(entries);
  const scored = collectDirectorySuggestions(root);

  return scored
    .sort((left, right) => {
      if (right.latestUpdatedAt !== left.latestUpdatedAt) {
        return right.latestUpdatedAt - left.latestUpdatedAt;
      }

      return left.path.localeCompare(right.path);
    })
    .map((item) => item.path);
}

function collectDirectorySuggestions(root: NoteDirectoryNode): Array<{ path: string; latestUpdatedAt: number }> {
  const suggestions: Array<{ path: string; latestUpdatedAt: number }> = [];

  const visit = (node: NoteDirectoryNode): number => {
    let latestUpdatedAt = Number.NEGATIVE_INFINITY;

    for (const child of node.children) {
      if (isNoteDirectoryNode(child)) {
        latestUpdatedAt = Math.max(latestUpdatedAt, visit(child));
        continue;
      }

      latestUpdatedAt = Math.max(latestUpdatedAt, Date.parse(child.entry.updatedAt) || 0);
    }

    if (node.path) {
      suggestions.push({
        path: `${node.path}/`,
        latestUpdatedAt: Number.isFinite(latestUpdatedAt) ? latestUpdatedAt : 0,
      });
    }

    return Number.isFinite(latestUpdatedAt) ? latestUpdatedAt : 0;
  };

  visit(root);
  return suggestions;
}
