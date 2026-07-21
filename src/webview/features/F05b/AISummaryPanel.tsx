import type { FC, ReactNode } from 'react';
import type { ChangedFile, Commit } from '../../types/commit';
import { AISummaryViewer } from './AISummaryViewer';
import { OverwriteConfirmDialog } from './OverwriteConfirmDialog';
import { SaveAsNotePopover } from './SaveAsNotePopover';
import { useAISummary } from './useAISummary';

interface AISummaryPanelProps {
  isActive: boolean;
  targetFile: ChangedFile | null;
  isTargetFilePending?: boolean;
  commit: Commit | null;
  onGoToSettings: () => void;
  headerLeading?: ReactNode;
  headerTrailing?: ReactNode;
}

export const AISummaryPanel: FC<AISummaryPanelProps> = ({
  isActive,
  targetFile,
  isTargetFilePending,
  commit,
  onGoToSettings,
  headerLeading,
  headerTrailing,
}) => {
  const {
    activeAIProvider,
    currentSummaryContent,
    currentSummaryUsage,
    hasCurrentSavedSummary,
    hasLoadedSettings,
    isGeneratingQA,
    isGeneratingSummary,
    isLoadingSummary,
    isRegenerateDialogOpen,
    isSavePopoverOpen,
    noteEntries,
    onAskQuestion,
    onConfirmRegenerate,
    onConfirmSave,
    onRegenerate,
    onRetry,
    onSave,
    qaCompletionCount,
    saveDraft,
    saveButtonRef,
    savePath,
    setIsRegenerateDialogOpen,
    setIsSavePopoverOpen,
    setSaveDraft,
    shouldWarnBeforeOverwrite,
    summaryError,
    summaryNoteRelativePath,
    summarySavedPath,
  } = useAISummary({
    isActive, targetFile, commit, isTargetFilePending,
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AISummaryViewer
        content={currentSummaryContent}
        usage={currentSummaryUsage}
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
        headerLeading={headerLeading}
        headerTrailing={headerTrailing}
        onAskQuestion={onAskQuestion}
        onGoToSettings={onGoToSettings}
        onRegenerate={onRegenerate}
        onRetry={onRetry}
        onSave={onSave}
        saveButtonRef={saveButtonRef}
      />
      <OverwriteConfirmDialog
        isOpen={isRegenerateDialogOpen}
        onCancel={() => setIsRegenerateDialogOpen(false)}
        onConfirm={onConfirmRegenerate}
      />
      <SaveAsNotePopover
        anchorRef={saveButtonRef}
        entries={noteEntries}
        initialValue={saveDraft.relativePath}
        isOpen={isSavePopoverOpen}
        onCancel={() => setIsSavePopoverOpen(false)}
        onChange={(relativePath) => setSaveDraft({ ...saveDraft, relativePath })}
        onConfirm={() => onConfirmSave(saveDraft.relativePath)}
        shouldWarnBeforeOverwrite={shouldWarnBeforeOverwrite}
      />
    </div>
  );
};
