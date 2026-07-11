import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { BackButton } from './BackButton';

interface TopHeaderProps {
  title: string;
  context?: string;
  showSettingsIcon?: boolean;
  showBackButton?: boolean;
  endSlot?: React.ReactNode;
  onSettingsClick?: () => void;
  onBackClick?: () => void;
}

export const TopHeader: FC<TopHeaderProps> = ({
  title,
  context,
  showSettingsIcon = false,
  showBackButton = false,
  endSlot,
  onSettingsClick,
  onBackClick,
}) => {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-panel px-6 py-3">
      <div className="flex min-w-0 items-center gap-2">
        {showBackButton && onBackClick ? <BackButton onClick={onBackClick} /> : null}
        <div className="min-w-0">
          <h1 className="m-0 overflow-hidden text-md font-bold text-text text-ellipsis whitespace-nowrap">{title}</h1>
          {context ? <p className="mt-1 mb-0 overflow-hidden text-sm text-muted text-ellipsis whitespace-nowrap">{context}</p> : null}
        </div>
      </div>
      <div className="ml-auto flex items-center gap-1">
        {endSlot}
        {showSettingsIcon ? (
          <button
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-panel text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-45"
            type="button"
            onClick={onSettingsClick}
            aria-label={t('settings.open_aria')}
            title={t('settings.open_aria')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <circle cx="8" cy="8" r="2.2" />
              <path d="M8 1.7v1.7M8 12.6v1.7M3.55 3.55l1.2 1.2M11.25 11.25l1.2 1.2M1.7 8h1.7M12.6 8h1.7M3.55 12.45l1.2-1.2M11.25 4.75l1.2-1.2" />
            </svg>
          </button>
        ) : null}
      </div>
    </header>
  );
};
