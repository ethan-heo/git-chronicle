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
    <section className="save-path-section" role="group" aria-label={t('settings.save_path_label')}>
      <div className="settings-section-heading">
        <div>
          <h2>{t('settings.save_path_label')}</h2>
          <p>{t('settings.save_path_desc')}</p>
        </div>
      </div>
      {hasPath ? (
        <div className="save-path-selector save-path-selector-set">
          <button
            className="save-path-display-button"
            type="button"
            aria-label={t('settings.save_path_selected_aria', { path: savePath ?? '' })}
            title={savePath ?? undefined}
            onClick={onPathSelect}
          >
            <FolderIcon />
            <span className="save-path-display" aria-label={t('settings.save_path_current_aria', { path: savePath ?? '' })}>
              <span className="save-path-display-head">{displayPath?.head}</span>
              <span className="save-path-display-tail">{displayPath?.tail}</span>
            </span>
            <span className="save-path-change-label">{t('settings.change')}</span>
          </button>
          <button
            className="save-path-delete-button"
            type="button"
            aria-label={t('settings.save_path_delete_aria')}
            title={t('settings.save_path_delete_title')}
            onClick={onPathDelete}
          >
            <TrashIcon />
          </button>
          <p className="save-path-helper save-path-helper-set">
            <CheckIcon />
            <span>
              {t('settings.commit_summary_file')}
            </span>
          </p>
        </div>
      ) : (
        <button className="save-path-selector save-path-selector-unset" type="button" aria-label={t('settings.save_path_select_aria')} onClick={onPathSelect}>
          <FolderIcon />
          <span>{t('settings.save_path_prompt')}</span>
          <span className="save-path-empty-label">{t('settings.unset')}</span>
          <span className="save-path-helper">{t('settings.save_path_helper')}</span>
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

const FolderIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
    <path d="M2 4.5C2 3.7 2.6 3 3.4 3h2.8l1.3 1.6h5.1c.8 0 1.4.7 1.4 1.5v6c0 .8-.6 1.5-1.4 1.5H3.4C2.6 13.6 2 13 2 12.1V4.5Z" />
  </svg>
);

const TrashIcon: FC = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M5 4.5l.6 8.5h4.8l.6-8.5" />
  </svg>
);

const CheckIcon: FC = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M3 8.4 6.3 11.5 13 4.5" />
  </svg>
);
