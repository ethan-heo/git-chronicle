import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SplitViewButton, TopHeader } from '../../shared/components';
import { useAppStore } from '../../store/appStore';
import { DiffViewer } from '../F03/DiffViewer';
import { useFileDiff } from '../F03/useFileDiff';
import { AISummaryViewer } from '../F05/AISummaryViewer';
import { TokenLimitWarning } from '../F05/TokenLimitWarning';
import { useAISummary } from '../F05/useAISummary';

export const S07CodeAndAISummaryScreen: FC = () => {
  const { t } = useTranslation();
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const goBackFromDetail = useAppStore((state) => state.goBackFromDetail);
  const goToSettingsView = useAppStore((state) => state.goToSettingsView);
  const { diffState, loadFileDiff } = useFileDiff({
    isActive: true,
    commitHash: selectedCommit?.hash ?? null,
    filePath: selectedFile?.path ?? null,
    isDeletedFile: selectedFile?.status === 'D',
  });
  const {
    activeAIProvider,
    currentSummaryContent,
    headerContext,
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
  } = useAISummary();

  if (!selectedCommit || !selectedFile) {
    return null;
  }

  return (
    <main className="app-shell flex h-screen min-h-0 flex-col">
      <TopHeader
        title={selectedCommit.message}
        context={headerContext}
        showBackButton
        onBackClick={goBackFromDetail}
        endSlot={<SplitViewButton label={t('ai_summary.split_view')} disabled onClick={() => {}} />}
        showSettingsIcon
        onSettingsClick={goToSettingsView}
      />
      <section className="flex flex-1 min-h-0 overflow-hidden">
        <div className="min-w-[220px] flex-1 overflow-y-auto">
          <DiffViewer
            diffLines={diffState.diffLines}
            filePath={selectedFile.path}
            isLoading={diffState.isLoading}
            error={diffState.error}
            isBinaryFile={diffState.isBinaryFile}
            isDeletedFile={diffState.isDeletedFile}
            onRetry={loadFileDiff}
          />
        </div>
        <div className="min-w-[220px] flex-1 overflow-y-auto border-l border-line">
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
            onGoToSettings={goToSettingsView}
            onRegenerate={onRegenerate}
            onRetry={onRetry}
          />
        </div>
      </section>
    </main>
  );
};
