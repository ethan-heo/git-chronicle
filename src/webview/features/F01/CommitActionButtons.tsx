import type { CSSProperties, FC, MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';

interface CommitActionButtonsProps {
  isAIViewActive: boolean;
  isFileCanvasActive: boolean;
  onOpenAISummary: () => void;
  onOpenFileCanvas: () => void;
  className?: string;
}

export const CommitActionButtons: FC<CommitActionButtonsProps> = ({
  isAIViewActive,
  isFileCanvasActive,
  onOpenAISummary,
  onOpenFileCanvas,
  className,
}) => {
  const { t } = useTranslation();
  const buttonClassName = 'inline-flex size-7 items-center justify-center rounded-sm bg-elevated p-0 text-muted transition hover:bg-hover hover:text-text';

  const getActiveButtonStyle = (color: string, isActive: boolean): CSSProperties | undefined => (
    isActive
      ? {
          backgroundColor: `color-mix(in srgb, ${color} 16%, var(--color-elevated) 84%)`,
          color,
        }
      : undefined
  );

  const handleClick = (event: MouseEvent<HTMLButtonElement>, action: () => void): void => {
    event.stopPropagation();
    action();
  };

  return (
    <div className={['inline-flex items-center gap-1', className].filter(Boolean).join(' ')}>
      <button
        className={[buttonClassName, 'hover:text-accent'].join(' ')}
        style={getActiveButtonStyle('var(--color-accent)', isAIViewActive)}
        type="button"
        aria-label={t('action_bar.commit_ai_aria')}
        title={t('action_bar.commit_ai_aria')}
        onClick={(event) => handleClick(event, onOpenAISummary)}
      >
        <span className="text-[9px] font-bold leading-none" aria-hidden="true">
          AI
        </span>
      </button>
      <button
        className={[buttonClassName, 'hover:text-link'].join(' ')}
        style={getActiveButtonStyle('var(--color-focus)', isFileCanvasActive)}
        type="button"
        aria-label={t('action_bar.canvas_aria')}
        title={t('action_bar.canvas_aria')}
        onClick={(event) => handleClick(event, onOpenFileCanvas)}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <path d="M3 4h3v3H3zM10 3h3v3h-3zM8 10h3v3H8z" />
          <path d="M6 5.5h4M11.5 6v3.5M6.5 7.5l2 2" />
        </svg>
      </button>
    </div>
  );
};
