import { useCallback, useEffect, type FC } from 'react';
import { TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import type { ChangedFile } from '../../types/commit';
import { CommitActionBar } from './CommitActionBar';
import { FileTree } from './FileTree';

export const S02HistoryViewScreen: FC = () => {
  const {
    selectedCommit,
    changedFiles,
    hasSavedCommitSummary,
    isLoadingChangedFiles,
    changedFilesError,
    goToCommitList,
    loadChangedFiles,
    selectFileForCode,
    goToCommitAISummary,
    goToCanvasView,
    goToSettingsView,
    handleChangedFilesLoaded,
    handleChangedFilesLoadFailed,
  } = useAppStore();
  const isRouteSlotActive = useRouteSlotActive();

  useEffect(() => {
    if (!isRouteSlotActive) {
      return;
    }

    loadChangedFiles();
  }, [isRouteSlotActive, loadChangedFiles, selectedCommit?.hash]);

  useEffect(() => {
    if (!isRouteSlotActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: {
          files?: ChangedFile[];
          hasSavedCommitSummary?: boolean;
          message?: string;
        };
      }>,
    ): void => {
      if (event.data.type === 'CHANGED_FILES_LOADED') {
        handleChangedFilesLoaded({
          files: event.data.payload?.files ?? [],
          hasSavedCommitSummary: event.data.payload?.hasSavedCommitSummary ?? false,
        });
        return;
      }

      if (event.data.type === 'CHANGED_FILES_LOAD_FAILED') {
        handleChangedFilesLoadFailed(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [handleChangedFilesLoaded, handleChangedFilesLoadFailed, isRouteSlotActive]);

  const retry = useCallback(() => loadChangedFiles(), [loadChangedFiles]);

  if (!selectedCommit) {
    return null;
  }

  return (
    <main className="app-shell relative flex h-screen min-h-0 flex-col overflow-hidden">
      <TopHeader title={selectedCommit.message} context={`${selectedCommit.shortHash} · ${selectedCommit.author} · ${formatDate(selectedCommit.date)}`} showBackButton onBackClick={goToCommitList} showSettingsIcon onSettingsClick={goToSettingsView} />
      <CommitActionBar
        selectedCommit={selectedCommit}
        hasSavedCommitSummary={hasSavedCommitSummary}
        isLoadingChangedFiles={isLoadingChangedFiles}
        onCommitAISummary={goToCommitAISummary}
        onCanvasView={goToCanvasView}
      />
      <FileTree
        changedFiles={changedFiles}
        isLoading={isLoadingChangedFiles}
        error={changedFilesError}
        onRetry={retry}
        onFileCodeView={selectFileForCode}
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
