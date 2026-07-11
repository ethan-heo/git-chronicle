import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface FileAISummaryToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
}

export const FileAISummaryToggleButton: FC<FileAISummaryToggleButtonProps> = ({ isActive, onClick }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'inline-flex size-8 items-center justify-center rounded-md transition-colors',
        isActive
          ? 'bg-[color-mix(in_srgb,var(--color-accent)_16%,var(--color-panel))] text-accent'
          : 'bg-panel text-muted hover:bg-hover hover:text-text',
      ].join(' ')}
      aria-label={t('action_bar.file_ai_toggle_aria')}
      aria-pressed={isActive}
      title={t('action_bar.file_ai_toggle_aria')}
    >
      <span className="text-[11px] font-bold leading-none" aria-hidden="true">AI</span>
    </button>
  );
};
