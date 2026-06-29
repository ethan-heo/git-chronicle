import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { AISummaryViewer } from '../F05/AISummaryViewer';
import { TokenLimitWarning } from '../F05/TokenLimitWarning';
import { useAISummary } from '../F05/useAISummary';

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
    qaError,
    qaStreamingResponse,
    savePath,
    summaryError,
    summaryMode,
    summarySavedPath,
  } = useAISummary({ isActive: isOpen });

  return (
    <aside className={['split-side-panel', isOpen ? 'split-side-panel-open' : 'split-side-panel-closed'].filter(Boolean).join(' ')} aria-hidden={!isOpen}>
      <header className="split-side-panel-header">
        <div className="split-side-panel-title">
          <div className="split-side-panel-file">{filePath}</div>
          <div className="split-side-panel-subtitle">{t('ai_summary.ai_result')}</div>
        </div>
        <button className="split-side-panel-close" type="button" onClick={onClose} aria-label={t('ai_summary.split_panel_close_aria')} title={t('ai_summary.split_panel_close_aria')}>
          ×
        </button>
      </header>
      <div className="split-side-panel-body">
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
          qaError={qaError}
          qaStreamingResponse={qaStreamingResponse}
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
