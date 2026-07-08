import { useCallback, useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import type { ChangedFile, DependencyEdge } from '../../types/commit';

interface UseDependencyCanvasResult {
  files: ChangedFile[];
  dependencyEdges: DependencyEdge[];
  isLoading: boolean;
  error: string | null;
  retryCanvas: () => void;
}

export function useDependencyCanvas(options: { isActive: boolean }): UseDependencyCanvasResult {
  const { isActive } = options;
  const changedFiles = useAppStore((state) => state.changedFiles);
  const isLoadingChangedFiles = useAppStore((state) => state.isLoadingChangedFiles);
  const changedFilesError = useAppStore((state) => state.changedFilesError);
  const hasLoadedChangedFiles = useAppStore((state) => state.hasLoadedChangedFiles);
  const dependencyEdges = useAppStore((state) => state.dependencyEdges);
  const isLoadingDependencies = useAppStore((state) => state.isLoadingDependencies);
  const dependenciesError = useAppStore((state) => state.dependenciesError);
  const loadChangedFiles = useAppStore((state) => state.loadChangedFiles);
  const loadDependencies = useAppStore((state) => state.loadDependencies);
  const handleDependenciesLoaded = useAppStore((state) => state.handleDependenciesLoaded);
  const handleDependenciesLoadFailed = useAppStore((state) => state.handleDependenciesLoadFailed);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    if (!hasLoadedChangedFiles && changedFiles.length === 0 && !changedFilesError) {
      loadChangedFiles();
      return;
    }

    if (changedFiles.length > 0 && !isLoadingChangedFiles && !changedFilesError) {
      loadDependencies();
    }
  }, [
    changedFiles.length,
    changedFilesError,
    hasLoadedChangedFiles,
    isActive,
    isLoadingChangedFiles,
    loadChangedFiles,
    loadDependencies,
  ]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handler = (
      event: MessageEvent<{
        type: string;
        payload?: {
          edges?: DependencyEdge[];
          message?: string;
        };
      }>,
    ): void => {
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
  }, [handleDependenciesLoaded, handleDependenciesLoadFailed, isActive]);

  const retryCanvas = useCallback(() => {
    if (changedFilesError || changedFiles.length === 0) {
      loadChangedFiles();
      return;
    }

    loadDependencies();
  }, [changedFiles.length, changedFilesError, loadChangedFiles, loadDependencies]);

  return {
    files: changedFiles,
    dependencyEdges,
    isLoading: isLoadingChangedFiles || isLoadingDependencies,
    error: changedFilesError ?? dependenciesError,
    retryCanvas,
  };
}
