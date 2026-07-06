import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface FileCanvasToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
}

export const FileCanvasToggleButton: FC<FileCanvasToggleButtonProps> = ({
  isActive,
  onClick,
}) => {
  const { t } = useTranslation();

  return (
    <button
      className={[
        'inline-flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors duration-100 ease-in-out',
        isActive
          ? 'border-focus bg-[color-mix(in_srgb,var(--color-focus)_16%,transparent)] text-text'
          : 'border-line bg-panel text-muted hover:bg-hover hover:text-text',
      ].join(' ')}
      type="button"
      aria-label={t('action_bar.canvas_aria')}
      title={t('action_bar.canvas_aria')}
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <path d="M3 4h3v3H3zM10 3h3v3h-3zM8 10h3v3H8z" />
        <path d="M6 5.5h4M11.5 6v3.5M6.5 7.5l2 2" />
      </svg>
    </button>
  );
};
