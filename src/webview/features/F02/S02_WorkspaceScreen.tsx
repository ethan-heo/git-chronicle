import { ReactFlowProvider } from '@xyflow/react';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FC,
} from 'react';
import { useTranslation } from 'react-i18next';
import { BackButton, EmptyState, ResizableSplitPane } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import type {
  ChangedFile,
  DependencyEdge,
  SymbolEdge,
  SymbolNode,
} from '../../types/commit';
import { DiffViewer, useFileDiff } from '../F03';
import { DependencyGraph } from '../F04';
import {
  AISummaryViewer,
  OverwriteConfirmDialog,
  TokenLimitWarning,
  useAISummary,
} from '../F05b';
import { SymbolCodePanel, SymbolGraph } from '../F10';
import { AISummaryToggleButton } from './AISummaryToggleButton';
import { FileCanvasToggleButton } from './FileCanvasToggleButton';
import { FileTree } from './FileTree';
import { WorkspaceHeading } from './WorkspaceHeading';

export const S02WorkspaceScreen: FC = () => {
  const { t } = useTranslation();
  const {
    selectedCommit,
    changedFiles,
    hasSavedCommitSummary,
    selectedFile,
    isLoadingChangedFiles,
    changedFilesError,
    hasLoadedChangedFiles,
    dependencyEdges,
    isLoadingDependencies,
    dependenciesError,
    activeWorkspacePanel,
    selectedFileForSymbolGraph,
    symbolNodes,
    symbolEdges,
    symbolFileContent,
    isLoadingSymbolGraph,
    hasLoadedSymbolGraph,
    symbolGraphError,
    isCodePanelOpen,
    activeSymbolNodeId,
    hoveredSymbolNodeId,
    goToCommitList,
    loadChangedFiles,
    loadDependencies,
    loadSymbolGraph,
    selectFileForCode,
    goToCommitAISummary,
    goToCanvasView,
    goToSymbolGraphView,
    goToSettingsView,
    handleChangedFilesLoaded,
    handleChangedFilesLoadFailed,
    handleDependenciesLoaded,
    handleDependenciesLoadFailed,
    openCodePanel,
    closeCodePanel,
    setActiveSymbolNode,
    setHoveredSymbolNode,
  } = useAppStore();
  const isRouteSlotActive = useRouteSlotActive();
  const {
    activeAIProvider,
    currentSummaryContent,
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
    setIsDialogOpen,
    setIsTokenWarningDismissed,
    summaryError,
    summarySavedPath,
  } = useAISummary({
    isActive: isRouteSlotActive && activeWorkspacePanel === 'aiSummary',
  });
  const { diffState, loadFileDiff } = useFileDiff({
    isActive: isRouteSlotActive && activeWorkspacePanel === 'code',
    commitHash: selectedCommit?.hash ?? null,
    filePath: selectedFile?.path ?? null,
    isDeletedFile: selectedFile?.status === 'D',
  });
  const [scrollRequestId, setScrollRequestId] = useState(0);

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
          edges?: DependencyEdge[];
          nodes?: SymbolNode[];
          symbolEdges?: SymbolEdge[];
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
  }, [
    handleChangedFilesLoaded,
    handleChangedFilesLoadFailed,
    handleDependenciesLoaded,
    handleDependenciesLoadFailed,
    isRouteSlotActive,
  ]);

  useEffect(() => {
    if (!isRouteSlotActive || activeWorkspacePanel !== 'fileCanvas') {
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
    activeWorkspacePanel,
    changedFiles.length,
    changedFilesError,
    hasLoadedChangedFiles,
    isLoadingChangedFiles,
    isRouteSlotActive,
    loadChangedFiles,
    loadDependencies,
  ]);

  useEffect(() => {
    if (
      isRouteSlotActive &&
      activeWorkspacePanel === 'symbolGraph' &&
      selectedFileForSymbolGraph &&
      !hasLoadedSymbolGraph &&
      !symbolGraphError
    ) {
      loadSymbolGraph();
    }
  }, [
    activeWorkspacePanel,
    hasLoadedSymbolGraph,
    isRouteSlotActive,
    loadSymbolGraph,
    selectedFileForSymbolGraph,
    symbolGraphError,
  ]);

  const retryTree = useCallback(() => loadChangedFiles(), [loadChangedFiles]);

  const retryCanvas = useCallback(() => {
    if (changedFilesError || changedFiles.length === 0) {
      loadChangedFiles();
      return;
    }

    loadDependencies();
  }, [changedFiles.length, changedFilesError, loadChangedFiles, loadDependencies]);

  const retrySymbolGraph = useCallback(() => loadSymbolGraph(), [loadSymbolGraph]);

  const hoveredNode = useMemo(
    () => symbolNodes.find((node) => node.id === hoveredSymbolNodeId) ?? null,
    [hoveredSymbolNodeId, symbolNodes],
  );
  const activeNode = useMemo(
    () => symbolNodes.find((node) => node.id === activeSymbolNodeId) ?? null,
    [activeSymbolNodeId, symbolNodes],
  );
  const highlightedRange = useMemo(
    () => (isCodePanelOpen ? activeNode ?? hoveredNode : null),
    [activeNode, hoveredNode, isCodePanelOpen],
  );
  const scrollToRange = useMemo(
    () => (activeNode ? { start: activeNode.lineStart, end: activeNode.lineEnd } : null),
    [activeNode],
  );

  if (!selectedCommit) {
    return null;
  }

  return (
    <main className="app-shell flex h-screen min-h-0 overflow-hidden bg-surface">
      <aside className="flex w-[320px] shrink-0 flex-col border-r border-line bg-panel">
        <div className="flex items-center justify-between px-3 py-3">
          <BackButton onClick={goToCommitList} />
          <button
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-transparent text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text"
            type="button"
            onClick={goToSettingsView}
            aria-label={t('settings.open_aria')}
            title={t('settings.open_aria')}
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
              <circle cx="8" cy="8" r="2.2" />
              <path d="M8 1.7v1.7M8 12.6v1.7M3.55 3.55l1.2 1.2M11.25 11.25l1.2 1.2M1.7 8h1.7M12.6 8h1.7M3.55 12.45l1.2-1.2M11.25 4.75l1.2-1.2" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2 px-3 pb-3">
          <AISummaryToggleButton
            hasSavedSummary={hasSavedCommitSummary}
            isActive={activeWorkspacePanel === 'aiSummary'}
            onClick={goToCommitAISummary}
          />
          <FileCanvasToggleButton
            isActive={activeWorkspacePanel === 'fileCanvas'}
            onClick={goToCanvasView}
          />
        </div>
        <div className="min-h-0 flex-1 bg-surface">
          <FileTree
            changedFiles={changedFiles}
            isLoading={isLoadingChangedFiles}
            error={changedFilesError}
            onRetry={retryTree}
            onFileCodeView={selectFileForCode}
            onFileAIView={() => goToCommitAISummary()}
            onFileSymbolGraph={goToSymbolGraphView}
          />
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <WorkspaceHeading
          commit={selectedCommit}
          context={`${selectedCommit.shortHash} · ${selectedCommit.author} · ${formatDate(selectedCommit.date)}`}
          endSlot={activeWorkspacePanel === 'symbolGraph' ? (
            <button
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm bg-transparent text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              aria-label={isCodePanelOpen ? t('symbol_graph.code_panel_hide') : t('symbol_graph.code_panel_show')}
              title={isCodePanelOpen ? t('symbol_graph.code_panel_hide') : t('symbol_graph.code_panel_show')}
              disabled={symbolNodes.length === 0 || Boolean(symbolGraphError) || isLoadingSymbolGraph}
              onClick={() => {
                if (!isCodePanelOpen) {
                  openCodePanel();
                } else {
                  closeCodePanel();
                }
              }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <rect x="1.6" y="2" width="4.9" height="12" rx="1.1" />
                <rect x="9.5" y="2" width="4.9" height="12" rx="1.1" />
              </svg>
            </button>
          ) : null}
        />
        <div className="min-h-0 flex-1 overflow-hidden">
          {activeWorkspacePanel === 'none' ? (
            <div className="flex h-full items-center justify-center p-8">
              <EmptyState message={t('ai_summary.empty')} />
            </div>
          ) : null}

          {activeWorkspacePanel === 'code' && selectedFile ? (
            <div className="h-full min-h-0">
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
          ) : null}

          {activeWorkspacePanel === 'aiSummary' ? (
            <div className="flex h-full min-h-0 flex-col">
              <TokenLimitWarning
                isVisible={isSummaryTokenLimitExceeded && !isTokenWarningDismissed}
                onDismiss={() => setIsTokenWarningDismissed(true)}
              />
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
                onAskQuestion={onAskQuestion}
                onGoToSettings={goToSettingsView}
                onRegenerate={onRegenerate}
                onRetry={onRetry}
              />
              <OverwriteConfirmDialog
                isOpen={isDialogOpen}
                onCancel={() => setIsDialogOpen(false)}
                onConfirm={onConfirmRegenerate}
              />
            </div>
          ) : null}

          {activeWorkspacePanel === 'fileCanvas' ? (
            <ReactFlowProvider>
              <DependencyGraph
                files={changedFiles}
                dependencyEdges={dependencyEdges}
                isLoading={isLoadingChangedFiles || isLoadingDependencies}
                error={changedFilesError ?? dependenciesError}
                onRetry={retryCanvas}
                onFileCodeView={selectFileForCode}
              />
            </ReactFlowProvider>
          ) : null}

          {activeWorkspacePanel === 'symbolGraph' && selectedFileForSymbolGraph ? (
            <ResizableSplitPane
              isOpen={isCodePanelOpen}
              className="h-full min-h-0"
              defaultLeftPercent={62}
              left={(
                <div className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden">
                  <ReactFlowProvider>
                    <SymbolGraph
                      symbolNodes={symbolNodes}
                      symbolEdges={symbolEdges}
                      isLoading={isLoadingSymbolGraph}
                      error={symbolGraphError}
                      onRetry={retrySymbolGraph}
                      activeNodeId={activeSymbolNodeId ?? hoveredSymbolNodeId}
                      onNodeClick={(nodeId) => {
                        setActiveSymbolNode(nodeId);
                        setScrollRequestId((current) => current + 1);
                      }}
                      onNodeHover={(nodeId) => {
                        setHoveredSymbolNode(nodeId);
                      }}
                      onPaneClick={() => {
                        setActiveSymbolNode(null);
                        setHoveredSymbolNode(null);
                      }}
                    />
                  </ReactFlowProvider>
                </div>
              )}
              right={(
                <SymbolCodePanel
                  isOpen={isCodePanelOpen}
                  filePath={selectedFileForSymbolGraph.path}
                  fileContent={symbolFileContent ?? ''}
                  language={selectedFileForSymbolGraph.path}
                  highlightRange={
                    highlightedRange
                      ? { start: highlightedRange.lineStart, end: highlightedRange.lineEnd }
                      : null
                  }
                  scrollToRange={scrollToRange}
                  scrollRequestId={scrollRequestId}
                  onClose={closeCodePanel}
                />
              )}
            />
          ) : null}
        </div>
      </section>
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
