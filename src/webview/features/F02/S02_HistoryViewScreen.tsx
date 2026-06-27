import { useCallback, useEffect, type FC } from 'react';
import { TopHeader } from '../../shared/components';
import { useAppStore } from '../../store/appStore';
import type { ChangedFile } from '../../types/commit';
import { CommitActionBar } from './CommitActionBar';
import { FileTree } from './FileTree';

export const S02HistoryViewScreen: FC = () => {
  const {
    selectedCommit,
    changedFiles,
    isLoadingChangedFiles,
    changedFilesError,
    isBatchRunning,
    goToCommitList,
    loadChangedFiles,
    selectFileForCode,
    selectFileForAI,
    goToCommitAISummary,
    goToCanvasView,
    goToSettingsView,
    startBatchAISummary,
    handleChangedFilesLoaded,
    handleChangedFilesLoadFailed,
  } = useAppStore();

  useEffect(() => {
    loadChangedFiles();
  }, [loadChangedFiles, selectedCommit?.hash]);

  useEffect(() => {
    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: {
          files?: ChangedFile[];
          message?: string;
        };
      }>,
    ): void => {
      if (event.data.type === 'CHANGED_FILES_LOADED') {
        handleChangedFilesLoaded(event.data.payload?.files ?? []);
        return;
      }

      if (event.data.type === 'CHANGED_FILES_LOAD_FAILED') {
        handleChangedFilesLoadFailed(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [handleChangedFilesLoaded, handleChangedFilesLoadFailed]);

  const retry = useCallback(() => loadChangedFiles(), [loadChangedFiles]);

  if (!selectedCommit) {
    return null;
  }

  return (
    <main className="app-shell commit-log-shell history-view-shell">
      <TopHeader title={selectedCommit.message} context={`${selectedCommit.shortHash} · ${selectedCommit.author} · ${formatDate(selectedCommit.date)}`} showBackButton onBackClick={goToCommitList} showSettingsIcon onSettingsClick={goToSettingsView} />
      <CommitActionBar
        selectedCommit={selectedCommit}
        isBatchRunning={isBatchRunning}
        isLoadingChangedFiles={isLoadingChangedFiles}
        onCommitAISummary={goToCommitAISummary}
        onBatchAISummary={startBatchAISummary}
        onCanvasView={goToCanvasView}
      />
      <FileTree
        changedFiles={changedFiles}
        isLoading={isLoadingChangedFiles}
        error={changedFilesError}
        onRetry={retry}
        onFileCodeView={selectFileForCode}
        onFileAISummary={selectFileForAI}
      />
    </main>
  );
};

function formatDate(date: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(parsedDate)
    .replaceAll(' ', '');
}
