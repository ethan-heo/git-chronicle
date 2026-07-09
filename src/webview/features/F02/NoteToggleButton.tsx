import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface NoteToggleButtonProps {
  onClick: () => void;
}

export const NoteToggleButton: FC<NoteToggleButtonProps> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <button
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-panel text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text"
      type="button"
      aria-label={t('action_bar.note_aria')}
      title={t('action_bar.note_aria')}
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M3 2.5h7.5L13 5v8.5H3z" />
        <path d="M10.5 2.5V5H13" />
        <path d="M5.2 7.2h5.6M5.2 9.4h5.6M5.2 11.6h3.8" />
      </svg>
    </button>
  );
};
