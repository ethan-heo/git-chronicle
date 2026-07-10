import { useState, type FC, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface PaneActionsGroupProps {
  children: ReactNode;
}

export const PaneActionsGroup: FC<PaneActionsGroupProps> = ({ children }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex shrink-0 items-center gap-2">
      {isExpanded ? children : null}
      <button
        className={[
          'inline-flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors duration-100 ease-in-out',
          isExpanded
            ? 'border-focus bg-[color-mix(in_srgb,var(--color-focus)_16%,transparent)] text-text'
            : 'border-line bg-panel text-muted hover:bg-hover hover:text-text',
        ].join(' ')}
        type="button"
        aria-label={t('action_bar.actions_group_aria')}
        aria-expanded={isExpanded}
        title={t('action_bar.actions_group_aria')}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <circle cx="4" cy="8" r="1.2" />
          <circle cx="8" cy="8" r="1.2" />
          <circle cx="12" cy="8" r="1.2" />
        </svg>
      </button>
    </div>
  );
};
