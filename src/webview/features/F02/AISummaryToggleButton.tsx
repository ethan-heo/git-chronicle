import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface AISummaryToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
}

export const AISummaryToggleButton: FC<AISummaryToggleButtonProps> = ({
  isActive,
  onClick,
}) => {
  const { t } = useTranslation();

  return (
    <button
      className={[
        'inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-colors duration-100 ease-in-out',
        isActive
          ? 'bg-[color-mix(in_srgb,var(--color-accent)_18%,transparent)] text-accent'
          : 'bg-panel text-muted hover:bg-hover hover:text-text',
      ].join(' ')}
      type="button"
      aria-label={t('action_bar.commit_ai_aria')}
      title={t('action_bar.commit_ai_aria')}
      onClick={onClick}
    >
      <span className="text-[11px] font-bold leading-none" aria-hidden="true">
        AI
      </span>
    </button>
  );
};
