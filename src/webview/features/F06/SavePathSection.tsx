import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface SavePathSectionProps {
  savePath: string | null;
  onPathSelect: () => void;
  onPathDelete: () => void;
}

export const SavePathSection: FC<SavePathSectionProps> = ({ savePath, onPathSelect, onPathDelete }) => {
  const { t } = useTranslation();
  const hasPath = Boolean(savePath);
  const displayPath = savePath ? splitDisplayPath(savePath) : null;

  return (
    <section className="border-b border-line px-[14px] pt-4 pb-[18px]" role="group" aria-label={t('settings.save_path_label')}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-sm font-bold text-muted">{t('settings.save_path_label')}</h2>
          <p className="mt-1 mb-0 text-[11.5px] leading-[1.5] text-muted">{t('settings.save_path_desc')}</p>
        </div>
      </div>
      {hasPath ? (
        <div className="flex w-full flex-wrap items-center gap-2 rounded-md border border-line bg-panel p-0 text-text">
          <button
            className="flex min-h-[42px] min-w-0 flex-1 items-center gap-2 border-none bg-transparent px-[11px] py-2.5 text-text hover:bg-hover"
            type="button"
            aria-label={t('settings.save_path_selected_aria', { path: savePath ?? '' })}
            title={savePath ?? undefined}
            onClick={onPathSelect}
          >
            <FolderIcon />
            <span className="flex min-w-0 flex-1 items-baseline gap-px overflow-hidden font-mono text-[11.5px] text-text whitespace-nowrap" aria-label={t('settings.save_path_current_aria', { path: savePath ?? '' })}>
              <span className="min-w-0 shrink overflow-hidden text-ellipsis text-muted">{displayPath?.head}</span>
              <span className="shrink-0 font-medium text-text">{displayPath?.tail}</span>
            </span>
            <span className="shrink-0 rounded-sm border border-line px-[9px] py-[3px] text-[11.5px] text-muted">{t('settings.change')}</span>
          </button>
          <button
            className="mr-[7px] inline-flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-line bg-transparent text-muted hover:border-[color-mix(in_srgb,var(--color-error)_44%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-error)_12%,transparent)] hover:text-error"
            type="button"
            aria-label={t('settings.save_path_delete_aria')}
            title={t('settings.save_path_delete_title')}
            onClick={onPathDelete}
          >
            <TrashIcon />
          </button>
          <p className="mt-[-1px] mr-[11px] mb-2.5 ml-[37px] flex w-full items-center gap-[5px] text-[11px] leading-[1.5] text-muted">
            <CheckIcon className="shrink-0 text-renamed" />
            <span>
              {t('settings.commit_summary_file', { filename: t('settings.commit_summary_filename') })}
            </span>
          </p>
        </div>
      ) : (
        <button
          className="flex w-full flex-wrap items-center gap-2 rounded-md border border-dashed border-line bg-panel px-[11px] py-2.5 text-left text-text hover:border-link hover:bg-hover"
          type="button"
          aria-label={t('settings.save_path_select_aria')}
          onClick={onPathSelect}
        >
          <FolderIcon className="shrink-0 text-link" />
          <span className="flex-1 text-base text-text">{t('settings.save_path_prompt')}</span>
          <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">{t('settings.unset')}</span>
          <span className="mt-px mr-0 mb-0 ml-[27px] flex w-full items-center gap-[5px] text-[11px] leading-[1.5] text-muted">
            {t('settings.save_path_helper')}
          </span>
        </button>
      )}
    </section>
  );
};

function splitDisplayPath(path: string): { head: string; tail: string } {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  const tail = parts.at(-1) ?? path;
  const head = path.slice(0, Math.max(0, path.length - tail.length));

  return {
    head,
    tail,
  };
}

const FolderIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d="M2 4.5C2 3.7 2.6 3 3.4 3h2.8l1.3 1.6h5.1c.8 0 1.4.7 1.4 1.5v6c0 .8-.6 1.5-1.4 1.5H3.4C2.6 13.6 2 13 2 12.1V4.5Z" />
  </svg>
);

const TrashIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.6 8.5h4.8l.6-8.5" />
  </svg>
);

const CheckIcon: FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M3 8.4 6.3 11.5 13 4.5" />
  </svg>
);
