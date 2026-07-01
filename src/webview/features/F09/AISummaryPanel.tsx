import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AISummaryViewer } from '../F05/AISummaryViewer';
import { TokenLimitWarning } from '../F05/TokenLimitWarning';
import { useAISummary } from '../F05/useAISummary';
import './SplitSidePanel.css';

interface AISummaryPanelProps {
  isOpen: boolean;
  filePath: string;
  onClose: () => void;
  onGoToSettings: () => void;
}

export const AISummaryPanel: FC<AISummaryPanelProps> = ({ isOpen, filePath, onClose, onGoToSettings }) => {
  const { t } = useTranslation();
  const {
    activeAIProvider,
    currentSummaryContent,
    hasCurrentSavedSummary,
    hasLoadedSettings,
    isGeneratingQA,
    isGeneratingSummary,
    isLoadingSummary,
    isSummaryTokenLimitExceeded,
    isTokenWarningDismissed,
    dismissTokenWarning,
    onAskQuestion,
    onRegenerate,
    onRetry,
    qaCompletionCount,
    savePath,
    summaryError,
    summaryMode,
    summarySavedPath,
  } = useAISummary({ isActive: isOpen });

  return (
    <aside
      className={[
        'split-side-panel flex min-h-0 min-w-0 flex-col overflow-hidden bg-panel',
        isOpen ? 'split-side-panel-open opacity-100 pointer-events-auto' : 'split-side-panel-closed opacity-0 pointer-events-none',
      ].join(' ')}
      aria-hidden={!isOpen}
    >
      <header className="flex items-start justify-between gap-md border-b border-line px-lg py-md">
        <div className="min-w-0">
          <div className="overflow-hidden text-sm font-bold whitespace-nowrap text-ellipsis">{filePath}</div>
          <div className="mt-0.5 text-xs text-muted">{t('ai_summary.ai_result')}</div>
        </div>
        <button className="rounded-sm bg-transparent px-xs text-[20px] leading-none text-muted transition-colors hover:bg-hover hover:text-text" type="button" onClick={onClose} aria-label={t('ai_summary.split_panel_close_aria')} title={t('ai_summary.split_panel_close_aria')}>
          ×
        </button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <TokenLimitWarning isVisible={isSummaryTokenLimitExceeded && !isTokenWarningDismissed} onDismiss={dismissTokenWarning} />
        <AISummaryViewer
          content={currentSummaryContent}
          error={summaryError}
          isLoading={!hasLoadedSettings || isLoadingSummary}
          isGenerating={isGeneratingSummary}
          isGeneratingQA={isGeneratingQA}
          hasSavedSummary={hasCurrentSavedSummary}
          hasAIProvider={Boolean(activeAIProvider)}
          hasSavePath={Boolean(savePath)}
          savedPath={summarySavedPath}
          providerLabel={activeAIProvider}
          qaCompletionCount={qaCompletionCount}
          summaryMode={summaryMode}
          onAskQuestion={onAskQuestion}
          onGoToSettings={onGoToSettings}
          onRegenerate={onRegenerate}
          onRetry={onRetry}
        />
      </div>
    </aside>
  );
};
