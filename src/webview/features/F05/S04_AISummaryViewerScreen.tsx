import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SplitViewButton, TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import { AISummaryViewer } from './AISummaryViewer';
import { OverwriteConfirmDialog } from './OverwriteConfirmDialog';
import { TokenLimitWarning } from './TokenLimitWarning';
import { useAISummary } from './useAISummary';

export const S04AISummaryViewerScreen: FC = () => {
  const { t } = useTranslation();
  const goBackFromDetail = useAppStore((state) => state.goBackFromDetail);
  const goToSettingsView = useAppStore((state) => state.goToSettingsView);
  const goToSplitView = useAppStore((state) => state.goToSplitView);
  const isRouteSlotActive = useRouteSlotActive();
  const {
    activeAIProvider,
    currentSummaryContent,
    headerContext,
    hasCurrentSavedSummary,
    hasLoadedSettings,
    isDialogOpen,
    isGeneratingSummary,
    isLoadingSummary,
    isSummaryTokenLimitExceeded,
    isTokenWarningDismissed,
    onConfirmRegenerate,
    onRegenerate,
    onRetry,
    savePath,
    selectedCommit,
    selectedFile,
    setIsDialogOpen,
    setIsTokenWarningDismissed,
    summaryError,
    summaryMode,
    summarySavedPath,
  } = useAISummary();

  if (!selectedCommit || (summaryMode === 'file' && !selectedFile)) {
    return null;
  }

  return (
    <main className="app-shell commit-log-shell ai-summary-shell">
      <TopHeader
        title={selectedCommit.message}
        context={headerContext}
        showBackButton
        onBackClick={goBackFromDetail}
        endSlot={<SplitViewButton label={t('ai_summary.split_view')} disabled={summaryMode !== 'file'} onClick={goToSplitView} />}
        showSettingsIcon
        onSettingsClick={goToSettingsView}
      />
      <section className="ai-summary-screen">
        <TokenLimitWarning isVisible={isSummaryTokenLimitExceeded && !isTokenWarningDismissed} onDismiss={() => setIsTokenWarningDismissed(true)} />
        <AISummaryViewer
          content={currentSummaryContent}
          error={summaryError}
          isLoading={!hasLoadedSettings || isLoadingSummary || !isRouteSlotActive}
          isGenerating={isGeneratingSummary}
          hasSavedSummary={hasCurrentSavedSummary}
          hasAIProvider={Boolean(activeAIProvider)}
          hasSavePath={Boolean(savePath)}
          savedPath={summarySavedPath}
          providerLabel={activeAIProvider}
          summaryMode={summaryMode}
          onGoToSettings={goToSettingsView}
          onRegenerate={onRegenerate}
          onRetry={onRetry}
        />
      </section>
      <OverwriteConfirmDialog isOpen={isDialogOpen} onCancel={() => setIsDialogOpen(false)} onConfirm={onConfirmRegenerate} />
    </main>
  );
};
