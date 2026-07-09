import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface SettingsToggleButtonProps {
  onClick: () => void;
}

export const SettingsToggleButton: FC<SettingsToggleButtonProps> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <button
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-panel text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text"
      type="button"
      aria-label={t('settings.open_aria')}
      title={t('settings.open_aria')}
      onClick={onClick}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <circle cx="8" cy="8" r="2.2" />
        <path d="M8 1.7v1.7M8 12.6v1.7M3.55 3.55l1.2 1.2M11.25 11.25l1.2 1.2M1.7 8h1.7M12.6 8h1.7M3.55 12.45l1.2-1.2M11.25 4.75l1.2-1.2" />
      </svg>
    </button>
  );
};
