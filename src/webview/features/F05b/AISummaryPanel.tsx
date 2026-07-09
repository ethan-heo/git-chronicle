import type { FC } from 'react';
import type { ChangedFile, Commit } from '../../types/commit';
import { AISummaryViewer } from './AISummaryViewer';
import { OverwriteConfirmDialog } from './OverwriteConfirmDialog';
import { TokenLimitWarning } from './TokenLimitWarning';
import { useAISummary } from './useAISummary';

interface AISummaryPanelProps {
  isActive: boolean;
  targetFile: ChangedFile | null;
  commit: Commit | null;
  onGoToSettings: () => void;
}

export const AISummaryPanel: FC<AISummaryPanelProps> = ({ isActive, targetFile, commit, onGoToSettings }) => {
  const {
    activeAIProvider,
    currentSummaryContent,
    hasCurrentSavedSummary,
    hasLoadedSettings,
    isDialogOpen,
    isGeneratingQA,
    isGeneratingSummary,
    isLoadingSummary,
    isSummaryTokenLimitExceeded,
    isTokenWarningDismissed,
    onAskQuestion,
    onConfirmRegenerate,
    onRegenerate,
    onRetry,
    qaCompletionCount,
    savePath,
    setIsDialogOpen,
    setIsTokenWarningDismissed,
    summaryError,
    summarySavedPath,
  } = useAISummary({ isActive, targetFile, commit });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TokenLimitWarning
        isVisible={isSummaryTokenLimitExceeded && !isTokenWarningDismissed}
        onDismiss={() => setIsTokenWarningDismissed(true)}
      />
      <AISummaryViewer
        content={currentSummaryContent}
        error={summaryError}
        isLoading={!hasLoadedSettings || isLoadingSummary || !isActive}
        isGenerating={isGeneratingSummary}
        isGeneratingQA={isGeneratingQA}
        hasSavedSummary={hasCurrentSavedSummary}
        hasAIProvider={Boolean(activeAIProvider)}
        hasSavePath={Boolean(savePath)}
        savedPath={summarySavedPath}
        providerLabel={activeAIProvider}
        qaCompletionCount={qaCompletionCount}
        onAskQuestion={onAskQuestion}
        onGoToSettings={onGoToSettings}
        onRegenerate={onRegenerate}
        onRetry={onRetry}
      />
      <OverwriteConfirmDialog
        isOpen={isDialogOpen}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={onConfirmRegenerate}
      />
    </div>
  );
};
