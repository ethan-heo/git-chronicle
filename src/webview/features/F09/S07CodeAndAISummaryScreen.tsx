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
    isGeneratingSummary,
    isLoadingSummary,
    isSummaryTokenLimitExceeded,
    isTokenWarningDismissed,
    dismissTokenWarning,
    onRegenerate,
    onRetry,
    savePath,
    summaryError,
    summaryMode,
    summarySavedPath,
  } = useAISummary();

  if (!selectedCommit || !selectedFile) {
    return null;
  }

  return (
    <main className="app-shell commit-log-shell split-view-shell">
      <TopHeader
        title={selectedCommit.message}
        context={headerContext}
        showBackButton
        onBackClick={goBackFromDetail}
        endSlot={<SplitViewButton label={t('ai_summary.split_view')} disabled onClick={() => {}} />}
        showSettingsIcon
        onSettingsClick={goToSettingsView}
      />
      <section className="split-view-panels">
        <div className="split-view-panel">
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
        <div className="split-view-panel">
          <TokenLimitWarning isVisible={isSummaryTokenLimitExceeded && !isTokenWarningDismissed} onDismiss={dismissTokenWarning} />
          <AISummaryViewer
            content={currentSummaryContent}
            error={summaryError}
            isLoading={!hasLoadedSettings || isLoadingSummary}
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
        </div>
      </section>
    </main>
  );
};
