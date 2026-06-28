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
    <header className="top-header">
      <div className="top-header-leading">
        {showBackButton && onBackClick ? <BackButton onClick={onBackClick} /> : null}
        <div className="top-header-title-group">
          <h1>{title}</h1>
          {context ? <p>{context}</p> : null}
        </div>
      </div>
      <div className="top-header-actions">
        {endSlot}
        {showSettingsIcon ? (
          <button className="top-header-icon-button" type="button" onClick={onSettingsClick} aria-label={t('settings.open_aria')}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <circle cx="8" cy="8" r="2.2" />
              <path d="M8 1.7v1.7M8 12.6v1.7M3.55 3.55l1.2 1.2M11.25 11.25l1.2 1.2M1.7 8h1.7M12.6 8h1.7M3.55 12.45l1.2-1.2M11.25 4.75l1.2-1.2" />
            </svg>
          </button>
        ) : null}
      </div>
    </header>
  );
};
