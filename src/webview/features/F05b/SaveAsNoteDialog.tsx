import { useMemo, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { PrimaryButton } from '../../shared/components';
import type { NoteEntry } from '../../types/note';
import { buildNoteTree, isNoteDirectoryNode, type NoteDirectoryNode } from '../F11/noteTreeModel';

interface SaveAsNoteDialogProps {
  entries: NoteEntry[];
  initialValue: string;
  isOpen: boolean;
  onCancel: () => void;
  onChange: (value: string) => void;
  onConfirm: () => void;
  shouldWarnBeforeOverwrite: boolean;
}

export const SaveAsNoteDialog: FC<SaveAsNoteDialogProps> = ({
  entries,
  initialValue,
  isOpen,
  onCancel,
  onChange,
  onConfirm,
  shouldWarnBeforeOverwrite,
}) => {
  const { t } = useTranslation();
  const root = useMemo(() => buildNoteTree(entries), [entries]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[rgba(0,0,0,0.5)] p-6" role="presentation" onClick={onCancel}>
      <section
        className="flex w-full max-w-[540px] flex-col gap-4 overflow-hidden rounded-xl border border-line bg-elevated p-4 shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-summary-save-note-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <strong id="ai-summary-save-note-title" className="text-sm text-text">{t('ai_summary.save_dialog_title')}</strong>
          <p className="m-0 text-sm text-muted">{t('ai_summary.save_dialog_body')}</p>
        </div>
        <div className="grid min-h-0 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="min-h-[220px] overflow-auto rounded-lg border border-line bg-panel px-2 py-2">
            <FolderTree
              nodes={root.children.filter(isNoteDirectoryNode)}
              onPick={(directoryPath) => {
                const fileName = extractFileName(initialValue);
                onChange(directoryPath ? `${directoryPath}/${fileName}` : fileName);
              }}
            />
          </div>
          <div className="flex flex-col gap-3">
            {shouldWarnBeforeOverwrite ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-100">
                {t('ai_summary.save_dialog_overwrite_warning')}
              </div>
            ) : null}
            <label className="flex flex-col gap-1.5 text-xs text-muted">
              <span>{t('ai_summary.save_dialog_filename')}</span>
              <input
                className="rounded-md border border-line bg-panel px-3 py-2 text-sm text-text outline-none focus:border-focus"
                value={initialValue}
                onChange={(event) => onChange(event.target.value)}
                placeholder={t('ai_summary.save_dialog_placeholder')}
                autoFocus
              />
            </label>
          </div>
        </div>
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
    </div>
  );
};

const FolderTree: FC<{ nodes: NoteDirectoryNode[]; depth?: number; onPick: (directoryPath: string) => void }> = ({ nodes, depth = 0, onPick }) => (
  <div className="flex flex-col">
    {depth === 0 ? (
      <button
        type="button"
        className="rounded-sm px-2 py-1 text-left text-xs text-muted transition-colors hover:bg-hover hover:text-text"
        onClick={() => onPick('')}
      >
        /
      </button>
    ) : null}
    {nodes.map((node) => (
      <div key={node.path} className="flex flex-col">
        <button
          type="button"
          className="rounded-sm px-2 py-1 text-left text-sm text-text transition-colors hover:bg-hover"
          style={{ paddingLeft: `${8 + depth * 14}px` }}
          onClick={() => onPick(node.path)}
        >
          {node.name}
        </button>
        <FolderTree nodes={node.children.filter(isNoteDirectoryNode)} depth={depth + 1} onPick={onPick} />
      </div>
    ))}
  </div>
);

function extractFileName(relativePath: string): string {
  const trimmed = relativePath.trim().replaceAll('\\', '/');
  return trimmed.split('/').filter(Boolean).at(-1) ?? '';
}
