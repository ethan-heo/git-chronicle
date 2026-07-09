import { useCallback, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { EMPTY_CHANGED_FILES_STATE } from '../../store/slices/changedFilesSlice';
import { EMPTY_DEPENDENCY_GRAPH_STATE } from '../../store/slices/dependencyGraphSlice';
import type { ChangedFile, Commit, DependencyEdge } from '../../types/commit';

interface UseDependencyCanvasResult {
  files: ChangedFile[];
  dependencyEdges: DependencyEdge[];
  isLoading: boolean;
  error: string | null;
  retryCanvas: () => void;
}

export function useDependencyCanvas(options: { isActive: boolean; paneId: string; commit: Commit | null }): UseDependencyCanvasResult {
  const { isActive, paneId, commit } = options;
  const changedFilesState = useAppStore((state) => (
    commit ? state.changedFilesByCommit[commit.hash] ?? EMPTY_CHANGED_FILES_STATE : EMPTY_CHANGED_FILES_STATE
  ));
  const dependencyState = useAppStore((state) => state.dependencyGraphsByPane[paneId] ?? EMPTY_DEPENDENCY_GRAPH_STATE);
  const loadChangedFiles = useAppStore((state) => state.loadChangedFiles);
  const loadDependencies = useAppStore((state) => state.loadDependencies);
  const handleDependenciesLoaded = useAppStore((state) => state.handleDependenciesLoaded);
  const handleDependenciesLoadFailed = useAppStore((state) => state.handleDependenciesLoadFailed);

  useEffect(() => {
    if (!isActive || !commit) {
      return;
    }

    if (!changedFilesState.hasLoaded && changedFilesState.changedFiles.length === 0 && !changedFilesState.error) {
      loadChangedFiles({ commit });
      return;
    }

    if (changedFilesState.changedFiles.length > 0 && !changedFilesState.isLoading && !changedFilesState.error && dependencyState.dependencyEdges.length === 0 && !dependencyState.isLoading && !dependencyState.error) {
      loadDependencies({
        paneId,
        commitHash: commit.hash,
        filePaths: changedFilesState.changedFiles.map((file) => file.path),
      });
    }
  }, [
    changedFilesState.changedFiles,
    changedFilesState.error,
    changedFilesState.hasLoaded,
    changedFilesState.isLoading,
    commit,
    dependencyState.dependencyEdges.length,
    dependencyState.error,
    dependencyState.isLoading,
    isActive,
    loadChangedFiles,
    loadDependencies,
    paneId,
  ]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: {
          paneId?: string;
          edges?: DependencyEdge[];
          message?: string;
        };
      }>,
    ): void => {
      if (event.data.type === 'DEPENDENCIES_LOADED') {
        if (event.data.payload?.paneId !== paneId) {
          return;
        }
        handleDependenciesLoaded({ paneId, edges: event.data.payload?.edges ?? [] });
        return;
      }

      if (event.data.type === 'DEPENDENCIES_LOAD_FAILED') {
        if (event.data.payload?.paneId !== paneId) {
          return;
        }
        handleDependenciesLoadFailed({ paneId, message: event.data.payload?.message });
      }
    };

    window.addEventListener('message', handler);

    return () => window.removeEventListener('message', handler);
  }, [handleDependenciesLoaded, handleDependenciesLoadFailed, isActive, paneId]);

  const retryCanvas = useCallback(() => {
    if (!commit) {
      return;
    }

    if (changedFilesState.error || changedFilesState.changedFiles.length === 0) {
      loadChangedFiles({ commit });
      return;
    }

    loadDependencies({
      paneId,
      commitHash: commit.hash,
      filePaths: changedFilesState.changedFiles.map((file) => file.path),
    });
  }, [changedFilesState.changedFiles, changedFilesState.error, commit, loadChangedFiles, loadDependencies, paneId]);

  return {
    files: changedFilesState.changedFiles,
    dependencyEdges: dependencyState.dependencyEdges,
    isLoading: changedFilesState.isLoading || dependencyState.isLoading,
    error: changedFilesState.error ?? dependencyState.error,
    retryCanvas,
  };
}
