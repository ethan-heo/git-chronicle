import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ResizableSplitPane, SplitViewButton, TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import { AISummaryViewer } from './AISummaryViewer';
import { OverwriteConfirmDialog } from './OverwriteConfirmDialog';
import { TokenLimitWarning } from './TokenLimitWarning';
import { useAISummary } from './useAISummary';
import { DiffViewerPanel } from '../F09/DiffViewerPanel';

export const S04AISummaryViewerScreen: FC = () => {
  const { t } = useTranslation();
  const goBackFromDetail = useAppStore((state) => state.goBackFromDetail);
  const goToSettingsView = useAppStore((state) => state.goToSettingsView);
  const isSplitPanelOpen = useAppStore((state) => state.isSplitPanelOpen);
  const openSplitPanel = useAppStore((state) => state.openSplitPanel);
  const closeSplitPanel = useAppStore((state) => state.closeSplitPanel);
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
    selectedFile,
    setIsDialogOpen,
    setIsTokenWarningDismissed,
    summaryError,
    summaryMode,
    summarySavedPath,
  } = useAISummary({ isActive: isRouteSlotActive });

  if (!selectedCommit || (summaryMode === 'file' && !selectedFile)) {
    return null;
  }

  return (
    <main className="app-shell relative flex h-screen min-h-0 flex-col overflow-hidden bg-surface">
      <TopHeader
        title={selectedCommit.message}
        context={headerContext}
        showBackButton
        onBackClick={goBackFromDetail}
        endSlot={<SplitViewButton label={t(isSplitPanelOpen ? 'ai_summary.split_panel_hide' : 'ai_summary.split_view')} disabled={summaryMode !== 'file'} onClick={isSplitPanelOpen ? closeSplitPanel : openSplitPanel} />}
        showSettingsIcon
        onSettingsClick={goToSettingsView}
      />
      <ResizableSplitPane
        isOpen={isSplitPanelOpen}
        className="min-h-0 flex-1"
        left={(
          <>
          <TokenLimitWarning isVisible={isSummaryTokenLimitExceeded && !isTokenWarningDismissed} onDismiss={() => setIsTokenWarningDismissed(true)} />
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
            summaryMode={summaryMode}
            onAskQuestion={onAskQuestion}
            onGoToSettings={goToSettingsView}
            onRegenerate={onRegenerate}
            onRetry={onRetry}
          />
        </>
        )}
        right={selectedFile ? <DiffViewerPanel isOpen={isSplitPanelOpen} filePath={selectedFile.path} commitHash={selectedCommit.hash} isDeletedFile={selectedFile.status === 'D'} onClose={closeSplitPanel} /> : null}
      />
      <OverwriteConfirmDialog isOpen={isDialogOpen} onCancel={() => setIsDialogOpen(false)} onConfirm={onConfirmRegenerate} />
    </main>
  );
};
