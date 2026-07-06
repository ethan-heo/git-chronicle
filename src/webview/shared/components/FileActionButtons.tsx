import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface FileActionButtonsProps {
  onCodeView: () => void;
  onAIView?: () => void;
  onSymbolGraph?: () => void;
  isSymbolGraphDisabled?: boolean;
  isVisible?: boolean;
  className?: string;
}

export const FileActionButtons: FC<FileActionButtonsProps> = ({
  onCodeView,
  onAIView,
  onSymbolGraph,
  isSymbolGraphDisabled = false,
  isVisible = true,
  className,
}) => {
  const { t } = useTranslation();
  const containerClassName = [
    'inline-flex shrink-0 gap-1 transition-opacity duration-100 ease-in-out',
    isVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  const buttonClassName =
    'inline-flex size-[22px] items-center justify-center rounded-sm border border-line bg-secondary p-0 text-muted transition-colors duration-100 ease-in-out hover:bg-secondary-hi hover:text-text';

  return (
    <div className={containerClassName}>
      <button className={buttonClassName} type="button" aria-label={t('shared.file_code_view')} title={t('shared.file_code_view')} onClick={onCodeView}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
          <path d="M6 5 2.5 8 6 11" />
          <path d="m10 5 3.5 3L10 11" />
        </svg>
      </button>
      {onAIView ? (
        <button
          className={`${buttonClassName} hover:text-accent`}
          type="button"
          aria-label={t('shared.file_ai_view')}
          title={t('shared.file_ai_view')}
          onClick={onAIView}
        >
          <span className="text-[9px] font-bold leading-none" aria-hidden="true">
            AI
          </span>
        </button>
      ) : null}
      {onSymbolGraph ? (
        <button
          className={`${buttonClassName} hover:text-link disabled:cursor-not-allowed disabled:hover:bg-secondary disabled:hover:text-muted disabled:opacity-45`}
          type="button"
          aria-label={t('symbol_graph.open_aria')}
          title={t('symbol_graph.open_aria')}
          disabled={isSymbolGraphDisabled}
          onClick={onSymbolGraph}
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="M3 4h3v3H3zM10 3h3v3h-3zM8 10h3v3H8z" />
            <path d="M6 5.5h4M11.5 6v3.5M6.5 7.5l2 2" />
          </svg>
        </button>
      ) : null}
    </div>
  );
};
