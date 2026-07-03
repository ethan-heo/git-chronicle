import type { FC } from 'react';
import { TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import { AISummaryViewer } from './AISummaryViewer';
import { OverwriteConfirmDialog } from './OverwriteConfirmDialog';
import { TokenLimitWarning } from './TokenLimitWarning';
import { useAISummary } from './useAISummary';

export const S04AISummaryViewerScreen: FC = () => {
  const goBackFromDetail = useAppStore((state) => state.goBackFromDetail);
  const goToSettingsView = useAppStore((state) => state.goToSettingsView);
  const isRouteSlotActive = useRouteSlotActive();
  const {
    activeAIProvider,
    currentSummaryContent,
    headerContext,
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
    selectedCommit,
    setIsDialogOpen,
    setIsTokenWarningDismissed,
    summaryError,
    summarySavedPath,
  } = useAISummary({ isActive: isRouteSlotActive });

  if (!selectedCommit) {
    return null;
  }

  return (
    <main className="app-shell relative flex h-screen min-h-0 flex-col overflow-hidden bg-surface">
      <TopHeader
        title={selectedCommit.message}
        context={headerContext}
        showBackButton
        onBackClick={goBackFromDetail}
        showSettingsIcon
        onSettingsClick={goToSettingsView}
      />
      <div className="min-h-0 flex-1">
        <TokenLimitWarning isVisible={isSummaryTokenLimitExceeded && !isTokenWarningDismissed} onDismiss={() => setIsTokenWarningDismissed(true)} />
        <div className="flex h-full min-h-0 flex-col">
          <AISummaryViewer
            content={currentSummaryContent}
            error={summaryError}
            isLoading={!hasLoadedSettings || isLoadingSummary || !isRouteSlotActive}
            isGenerating={isGeneratingSummary}
            isGeneratingQA={isGeneratingQA}
            hasSavedSummary={hasCurrentSavedSummary}
            hasAIProvider={Boolean(activeAIProvider)}
            hasSavePath={Boolean(savePath)}
            savedPath={summarySavedPath}
            providerLabel={activeAIProvider}
            qaCompletionCount={qaCompletionCount}
            onAskQuestion={onAskQuestion}
            onGoToSettings={goToSettingsView}
            onRegenerate={onRegenerate}
            onRetry={onRetry}
          />
        </div>
      </div>
      <OverwriteConfirmDialog isOpen={isDialogOpen} onCancel={() => setIsDialogOpen(false)} onConfirm={onConfirmRegenerate} />
    </main>
  );
};
