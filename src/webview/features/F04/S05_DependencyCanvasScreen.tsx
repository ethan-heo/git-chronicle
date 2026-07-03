import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useEffect, type FC } from 'react';
import { TopHeader } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import type { ChangedFile, DependencyEdge } from '../../types/commit';
import { DependencyGraph } from './DependencyGraph';

export const S05DependencyCanvasScreen: FC = () => {
  const {
    selectedCommit,
    changedFiles,
    isLoadingChangedFiles,
    changedFilesError,
    hasLoadedChangedFiles,
    dependencyEdges,
    isLoadingDependencies,
    dependenciesError,
    goToHistoryView,
    goToSettingsView,
    loadChangedFiles,
    loadDependencies,
    selectFileForCode,
    goToSymbolGraphView,
    handleChangedFilesLoaded,
    handleChangedFilesLoadFailed,
    handleDependenciesLoaded,
    handleDependenciesLoadFailed,
  } = useAppStore();
  const isRouteSlotActive = useRouteSlotActive();

  useEffect(() => {
    if (!isRouteSlotActive) {
      return;
    }

    if (!hasLoadedChangedFiles && changedFiles.length === 0 && !changedFilesError) {
      loadChangedFiles();
    }
  }, [changedFiles.length, changedFilesError, hasLoadedChangedFiles, isRouteSlotActive, loadChangedFiles, selectedCommit?.hash]);

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
          edges?: DependencyEdge[];
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
        return;
      }

      if (event.data.type === 'DEPENDENCIES_LOADED') {
        handleDependenciesLoaded(event.data.payload?.edges ?? []);
        return;
      }

      if (event.data.type === 'DEPENDENCIES_LOAD_FAILED') {
        handleDependenciesLoadFailed(event.data.payload?.message);
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [handleChangedFilesLoaded, handleChangedFilesLoadFailed, handleDependenciesLoaded, handleDependenciesLoadFailed, isRouteSlotActive]);

  useEffect(() => {
    if (!isRouteSlotActive) {
      return;
    }

    if (changedFiles.length > 0 && !isLoadingChangedFiles && !changedFilesError) {
      loadDependencies();
    }
  }, [changedFiles.length, changedFilesError, isLoadingChangedFiles, isRouteSlotActive, loadDependencies]);

  const retry = useCallback(() => {
    if (changedFilesError || changedFiles.length === 0) {
      loadChangedFiles();
      return;
    }

    loadDependencies();
  }, [changedFiles.length, changedFilesError, loadChangedFiles, loadDependencies]);

  if (!selectedCommit) {
    return null;
  }

  return (
    <main className="app-shell flex min-h-0 h-screen flex-col overflow-hidden bg-surface">
      <TopHeader
        title={selectedCommit.message}
        context={`${selectedCommit.shortHash} · 변경 파일 ${changedFiles.length}개 · 의존 ${dependencyEdges.length}개`}
        showBackButton
        onBackClick={goToHistoryView}
        showSettingsIcon
        onSettingsClick={goToSettingsView}
      />
      <ReactFlowProvider>
        <DependencyGraph
          files={changedFiles}
          dependencyEdges={dependencyEdges}
          isLoading={isLoadingChangedFiles || isLoadingDependencies}
          error={changedFilesError ?? dependenciesError}
          onRetry={retry}
          onFileCodeView={selectFileForCode}
          onFileSymbolGraph={goToSymbolGraphView}
        />
      </ReactFlowProvider>
    </main>
  );
};
