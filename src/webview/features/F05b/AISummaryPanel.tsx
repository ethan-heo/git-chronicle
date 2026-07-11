import type { FC } from 'react';
import type { ChangedFile, Commit } from '../../types/commit';
import { AISummaryViewer } from './AISummaryViewer';
import { OverwriteConfirmDialog } from './OverwriteConfirmDialog';
import { SaveAsNoteDialog } from './SaveAsNoteDialog';
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
    isGeneratingQA,
    isGeneratingSummary,
    isLoadingSummary,
    isRegenerateDialogOpen,
    isSaveDialogOpen,
    isSummaryTokenLimitExceeded,
    isTokenWarningDismissed,
    noteEntries,
    onAskQuestion,
    onConfirmRegenerate,
    onConfirmSave,
    onRegenerate,
    onRetry,
    onSave,
    qaCompletionCount,
    saveDraft,
    savePath,
    setIsRegenerateDialogOpen,
    setIsSaveDialogOpen,
    setIsTokenWarningDismissed,
    setSaveDraft,
    shouldWarnBeforeOverwrite,
    summaryError,
    summaryNoteRelativePath,
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
        noteRelativePath={summaryNoteRelativePath}
        savedPath={summarySavedPath}
        providerLabel={activeAIProvider}
        qaCompletionCount={qaCompletionCount}
        onAskQuestion={onAskQuestion}
        onGoToSettings={onGoToSettings}
        onRegenerate={onRegenerate}
        onRetry={onRetry}
        onSave={onSave}
      />
      <OverwriteConfirmDialog
        isOpen={isRegenerateDialogOpen}
        onCancel={() => setIsRegenerateDialogOpen(false)}
        onConfirm={onConfirmRegenerate}
      />
      <SaveAsNoteDialog
        entries={noteEntries}
        initialValue={saveDraft.relativePath}
        isOpen={isSaveDialogOpen}
        onCancel={() => setIsSaveDialogOpen(false)}
        onChange={(relativePath) => setSaveDraft({ ...saveDraft, relativePath })}
        onConfirm={() => onConfirmSave(saveDraft.relativePath)}
        shouldWarnBeforeOverwrite={shouldWarnBeforeOverwrite}
      />
    </div>
  );
};
