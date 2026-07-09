import { useCallback, useEffect, useMemo, useRef, useState, type FC, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { mergePersistedWebviewState, readPersistedWebviewState, type PersistedWorkspaceSidebarState } from '../../bridge/persistedWebviewState';
import { EmptyState, ResizableSplitPane, SidebarSection } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import type { ChangedFile } from '../../types/commit';
import { CommitFilterPanel, CommitList, useCommitList } from '../F01';
import { CodeDiffPanel } from '../F03';
import { DependencyCanvasPanel } from '../F04';
import { AISummaryPanel } from '../F05b';
import { SidebarSettingsPanel } from '../F06';
import { SymbolCodePanelToggleButton, SymbolGraphPanel, useSymbolGraph } from '../F10';
import { AISummaryToggleButton } from './AISummaryToggleButton';
import { FileCanvasToggleButton } from './FileCanvasToggleButton';
import { FileTree } from './FileTree';
import { NoteToggleButton } from './NoteToggleButton';
import { SettingsToggleButton } from './SettingsToggleButton';
import { useChangedFileTree } from './useChangedFileTree';
import { WorkspaceHeading } from './WorkspaceHeading';

const SIDEBAR_DEFAULT_WIDTH = 320;
const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 560;
const SIDEBAR_RESIZE_HANDLE_WIDTH = 6;
const SIDEBAR_COLLAPSE_WIDTH = 0;
const SECTION_MIN_HEIGHT = 120;
const DEFAULT_FILTER_SECTION_HEIGHT = 220;
const DEFAULT_COMMIT_LIST_SECTION_HEIGHT = 280;
const DEFAULT_FILE_TREE_SECTION_HEIGHT = 280;
const SIDEBAR_VIEW_TRANSITION_DURATION_MS = 200;

const DEFAULT_SIDEBAR_STATE: PersistedWorkspaceSidebarState = {
  isFilterSectionExpanded: true,
  isCommitListSectionExpanded: true,
  isFileTreeSectionExpanded: true,
  filterSectionHeight: DEFAULT_FILTER_SECTION_HEIGHT,
  commitListSectionHeight: DEFAULT_COMMIT_LIST_SECTION_HEIGHT,
  fileTreeSectionHeight: DEFAULT_FILE_TREE_SECTION_HEIGHT,
  sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
  lastSidebarWidth: SIDEBAR_DEFAULT_WIDTH,
};

type SectionKey = 'filter' | 'commit' | 'file';
type SidebarView = 'default' | 'settings';

export const S02WorkspaceScreen: FC = () => {
  const { t } = useTranslation();
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const activeWorkspacePanel = useAppStore((state) => state.activeWorkspacePanel);
  const activeAISummaryFilePath = useAppStore((state) => state.activeAISummaryFilePath);
  const selectFileForCode = useAppStore((state) => state.selectFileForCode);
  const goToCommitAISummary = useAppStore((state) => state.goToCommitAISummary);
  const goToCanvasView = useAppStore((state) => state.goToCanvasView);
  const goToSymbolGraphView = useAppStore((state) => state.goToSymbolGraphView);
  const goToNoteView = useAppStore((state) => state.goToNoteView);
  const authorList = useAppStore((state) => state.authorList);
  const filterDateStart = useAppStore((state) => state.filterDateStart);
  const filterDateEnd = useAppStore((state) => state.filterDateEnd);
  const filterAuthor = useAppStore((state) => state.filterAuthor);
  const filterKeyword = useAppStore((state) => state.filterKeyword);
  const filterExcludeKeyword = useAppStore((state) => state.filterExcludeKeyword);
  const sortOrder = useAppStore((state) => state.sortOrder);
  const setFilter = useAppStore((state) => state.setFilter);
  const clearFilters = useAppStore((state) => state.clearFilters);
  const openRepository = useAppStore((state) => state.openRepository);
  const isRouteSlotActive = useRouteSlotActive();
  const changedFileTree = useChangedFileTree({ isActive: isRouteSlotActive });
  const symbolGraph = useSymbolGraph({ isActive: isRouteSlotActive && activeWorkspacePanel === 'symbolGraph' });
  const {
    commitList,
    hasMoreCommits,
    isLoadingCommits,
    isGitRepoDetected,
    hasLoadedCommits,
    commitListScrollTop,
    commitLoadError,
    loadMoreError,
    setCommitListScrollTop,
    selectCommit,
    onLoadMore,
    retry,
  } = useCommitList({ isActive: isRouteSlotActive });
  const persistedSidebarState = readPersistedWebviewState().workspaceSidebar ?? DEFAULT_SIDEBAR_STATE;
  const [sidebarWidth, setSidebarWidth] = useState(
    persistedSidebarState.sidebarWidth > SIDEBAR_COLLAPSE_WIDTH
      ? persistedSidebarState.sidebarWidth
      : persistedSidebarState.lastSidebarWidth,
  );
  const [lastSidebarWidth, setLastSidebarWidth] = useState(persistedSidebarState.lastSidebarWidth);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    persistedSidebarState.sidebarWidth <= SIDEBAR_COLLAPSE_WIDTH,
  );
  const [isSidebarDragging, setIsSidebarDragging] = useState(false);
  const [isFilterSectionExpanded, setIsFilterSectionExpanded] = useState(persistedSidebarState.isFilterSectionExpanded);
  const [isCommitListSectionExpanded, setIsCommitListSectionExpanded] = useState(persistedSidebarState.isCommitListSectionExpanded);
  const [isFileTreeSectionExpanded, setIsFileTreeSectionExpanded] = useState(persistedSidebarState.isFileTreeSectionExpanded);
  const [filterSectionHeight, setFilterSectionHeight] = useState(persistedSidebarState.filterSectionHeight);
  const [commitListSectionHeight, setCommitListSectionHeight] = useState(persistedSidebarState.commitListSectionHeight);
  const [fileTreeSectionHeight, setFileTreeSectionHeight] = useState(persistedSidebarState.fileTreeSectionHeight);
  const [prevSelectedCommitHash, setPrevSelectedCommitHash] = useState(selectedCommit?.hash);
  const [sidebarView, setSidebarView] = useState<SidebarView>('default');
  const [renderedSidebarView, setRenderedSidebarView] = useState<SidebarView>('default');
  const [exitingSidebarView, setExitingSidebarView] = useState<SidebarView | null>(null);
  const sidebarDragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  if (prevSelectedCommitHash !== selectedCommit?.hash) {
    setPrevSelectedCommitHash(selectedCommit?.hash);
  }

  const activeAIFile = changedFileTree.changedFiles.find((file) => file.path === activeAISummaryFilePath) ?? null;
  const isCommitAISummaryActive = activeWorkspacePanel === 'aiSummary' && activeAISummaryFilePath === null;
  const isFilterActive = Boolean(
    filterDateStart || filterDateEnd || filterAuthor || filterKeyword.trim() || filterExcludeKeyword.trim(),
  );
  const activeFilterCount = [
    filterDateStart,
    filterDateEnd,
    filterAuthor,
    filterKeyword.trim(),
    filterExcludeKeyword.trim(),
  ].filter(Boolean).length;

  const fileTreeStats = useMemo(() => {
    return changedFileTree.changedFiles.reduce(
      (stats, file) => ({
        ...stats,
        [file.status]: stats[file.status] + 1,
      }),
      { A: 0, M: 0, D: 0, R: 0 },
    );
  }, [changedFileTree.changedFiles]);

  const openCommitAISummaryFromSidebar = useCallback(() => {
    goToCommitAISummary();
  }, [goToCommitAISummary]);

  const openCommitAISummaryFromFile = useCallback((file: ChangedFile) => {
    goToCommitAISummary(file);
  }, [goToCommitAISummary]);

  useEffect(() => {
    mergePersistedWebviewState({
      workspaceSidebar: {
        isFilterSectionExpanded,
        isCommitListSectionExpanded,
        isFileTreeSectionExpanded,
        filterSectionHeight,
        commitListSectionHeight,
        fileTreeSectionHeight,
        sidebarWidth: isSidebarCollapsed ? 0 : sidebarWidth,
        lastSidebarWidth,
      },
    });
  }, [
    commitListSectionHeight,
    fileTreeSectionHeight,
    filterSectionHeight,
    isCommitListSectionExpanded,
    isFileTreeSectionExpanded,
    isFilterSectionExpanded,
    isSidebarCollapsed,
    lastSidebarWidth,
    sidebarWidth,
  ]);

  useEffect(() => {
    if (!isSidebarDragging) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMove = (event: MouseEvent): void => {
      const dragState = sidebarDragStateRef.current;
      if (!dragState) {
        return;
      }

      const nextWidth = dragState.startWidth + (event.clientX - dragState.startX);
      const clampedWidth = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_COLLAPSE_WIDTH, nextWidth));
      setSidebarWidth(clampedWidth);
    };

    const handleUp = (): void => {
      setIsSidebarDragging(false);
      setSidebarWidth((current) => {
        if (current <= SIDEBAR_COLLAPSE_WIDTH) {
          setIsSidebarCollapsed(true);
          return lastSidebarWidth;
        }

        const nextWidth = Math.max(SIDEBAR_MIN_WIDTH, current);
        setLastSidebarWidth(nextWidth);
        return nextWidth;
      });
      sidebarDragStateRef.current = null;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [isSidebarDragging, lastSidebarWidth]);

  useEffect(() => {
    if (renderedSidebarView === sidebarView) {
      return;
    }

    setExitingSidebarView(renderedSidebarView);
    setRenderedSidebarView(sidebarView);

    const timer = window.setTimeout(() => {
      setExitingSidebarView(null);
    }, SIDEBAR_VIEW_TRANSITION_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [renderedSidebarView, sidebarView]);

  const commitContext = selectedCommit
    ? `${selectedCommit.shortHash} · ${selectedCommit.author} · ${formatDate(selectedCommit.date)}`
    : t('workspace.commit_placeholder_context');

  const openSidebarSettings = useCallback(() => {
    setSidebarView('settings');
  }, []);

  const closeSidebarSettings = useCallback(() => {
    setSidebarView('default');
  }, []);

  const renderFilterSection = (): ReactElement => (
    <SidebarSection
      title={t('commit.filter_title')}
      isExpanded={isFilterSectionExpanded}
      onToggle={() => setIsFilterSectionExpanded((current) => !current)}
      badge={isFilterActive ? (
        <span className="rounded-full bg-accent px-[7px] py-px text-xs font-medium text-on-accent">
          {activeFilterCount}
        </span>
      ) : undefined}
    >
      <CommitFilterPanel
        variant="embedded"
        filterDateStart={filterDateStart}
        filterDateEnd={filterDateEnd}
        filterAuthor={filterAuthor}
        filterKeyword={filterKeyword}
        filterExcludeKeyword={filterExcludeKeyword}
        sortOrder={sortOrder}
        authorList={authorList}
        onFilterChange={setFilter}
        onClearFilters={clearFilters}
      />
    </SidebarSection>
  );

  const renderCommitListSection = (): ReactElement => (
    <SidebarSection
      title={t('commit.list_title')}
      isExpanded={isCommitListSectionExpanded}
      onToggle={() => setIsCommitListSectionExpanded((current) => !current)}
      badge={(
        <strong className="rounded-full bg-secondary px-[7px] py-px text-xs font-medium text-text">
          {commitList.length}
        </strong>
      )}
    >
      <CommitList
        commitList={commitList}
        selectedCommitHash={selectedCommit?.hash ?? null}
        isLoadingCommits={isLoadingCommits}
        hasMoreCommits={hasMoreCommits}
        isGitRepoDetected={isGitRepoDetected}
        hasLoadedCommits={hasLoadedCommits}
        isFilterActive={isFilterActive}
        commitLoadError={commitLoadError}
        loadMoreError={loadMoreError}
        onCommitClick={selectCommit}
        onLoadMore={onLoadMore}
        onRetry={retry}
        onOpenRepository={openRepository}
        onClearFilters={clearFilters}
        savedScrollTop={commitListScrollTop}
        onScrollTopChange={setCommitListScrollTop}
      />
    </SidebarSection>
  );

  const renderFileTreeSection = (): ReactElement => (
    <SidebarSection
      title={t('file_tree.panel_aria')}
      isExpanded={isFileTreeSectionExpanded}
      onToggle={() => setIsFileTreeSectionExpanded((current) => !current)}
      badge={selectedCommit ? (
        <strong className="rounded-full bg-secondary px-[7px] py-px text-xs font-medium text-text">
          {changedFileTree.changedFiles.length}
        </strong>
      ) : undefined}
      actions={selectedCommit ? (
        <div className="inline-flex gap-2 font-mono text-xs text-muted" aria-label={t('file_tree.stats_aria')}>
          {fileTreeStats.A > 0 ? <span className="text-added">+{fileTreeStats.A}</span> : null}
          {fileTreeStats.M > 0 ? <span className="text-modified">~{fileTreeStats.M}</span> : null}
          {fileTreeStats.D > 0 ? <span className="text-deleted">-{fileTreeStats.D}</span> : null}
          {fileTreeStats.R > 0 ? <span className="text-renamed">R{fileTreeStats.R}</span> : null}
        </div>
      ) : undefined}
    >
      {selectedCommit ? (
        <FileTree
          changedFiles={changedFileTree.changedFiles}
          isLoading={changedFileTree.isLoading}
          error={changedFileTree.error}
          onRetry={changedFileTree.retryTree}
          onFileCodeView={selectFileForCode}
          onFileAIView={openCommitAISummaryFromFile}
          onFileSymbolGraph={goToSymbolGraphView}
          activeAIFilePath={activeWorkspacePanel === 'aiSummary' ? activeAISummaryFilePath : null}
          activeCodeFilePath={activeWorkspacePanel === 'code' ? selectedFile?.path ?? null : null}
          activeSymbolGraphFilePath={activeWorkspacePanel === 'symbolGraph' ? symbolGraph.selectedFile?.path ?? null : null}
          showHeader={false}
        />
      ) : (
        <div className="flex h-full min-h-0 flex-1 items-center justify-center p-6 text-center">
          <EmptyState message={t('workspace.commit_placeholder_body')} />
        </div>
      )}
    </SidebarSection>
  );

  const getSectionNode = (section: SectionKey): ReactElement => {
    if (section === 'filter') {
      return renderFilterSection();
    }

    if (section === 'commit') {
      return renderCommitListSection();
    }

    return renderFileTreeSection();
  };

  const getSectionHeight = (section: SectionKey): number => {
    if (section === 'filter') {
      return filterSectionHeight;
    }

    if (section === 'commit') {
      return commitListSectionHeight;
    }

    return fileTreeSectionHeight;
  };

  const setSectionHeight = (section: SectionKey, nextHeight: number): void => {
    if (section === 'filter') {
      setFilterSectionHeight(nextHeight);
      return;
    }

    if (section === 'commit') {
      setCommitListSectionHeight(nextHeight);
      return;
    }

    setFileTreeSectionHeight(nextHeight);
  };

  const renderCollapsedSection = (section: SectionKey): ReactElement => (
    <div className="shrink-0">
      {getSectionNode(section)}
    </div>
  );

  const renderExpandedGroup = (sections: SectionKey[]): ReactElement => {
    if (sections.length === 1) {
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {getSectionNode(sections[0])}
        </div>
      );
    }

    if (sections.length === 2) {
      const [first, second] = sections;
      return (
        <ResizableSplitPane
          isOpen
          orientation="vertical"
          minLeftPx={SECTION_MIN_HEIGHT}
          minRightPx={SECTION_MIN_HEIGHT}
          controlledLeftPx={getSectionHeight(first)}
          onLeftPxChange={(leftPx, rightPx) => {
            setSectionHeight(first, leftPx);
            setSectionHeight(second, rightPx);
          }}
          className="h-full min-h-0"
          left={getSectionNode(first)}
          right={getSectionNode(second)}
        />
      );
    }

    return (
      <ResizableSplitPane
        isOpen
        orientation="vertical"
        minLeftPx={SECTION_MIN_HEIGHT}
        minRightPx={SECTION_MIN_HEIGHT * 2}
        controlledLeftPx={filterSectionHeight}
        onLeftPxChange={(leftPx) => {
          setFilterSectionHeight(leftPx);
        }}
        className="h-full min-h-0"
        left={renderFilterSection()}
        right={(
          <ResizableSplitPane
            isOpen
            orientation="vertical"
            minLeftPx={SECTION_MIN_HEIGHT}
            minRightPx={SECTION_MIN_HEIGHT}
            controlledLeftPx={commitListSectionHeight}
            onLeftPxChange={(leftPx, rightPx) => {
              setCommitListSectionHeight(leftPx);
              setFileTreeSectionHeight(rightPx);
            }}
            className="h-full min-h-0"
            left={renderCommitListSection()}
            right={renderFileTreeSection()}
          />
        )}
      />
    );
  };

  const renderExpandedSections = (): ReactElement => {
    if (!isFilterSectionExpanded && !isCommitListSectionExpanded && !isFileTreeSectionExpanded) {
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {renderCollapsedSection('filter')}
          {renderCollapsedSection('commit')}
          {renderCollapsedSection('file')}
        </div>
      );
    }

    if (!isFilterSectionExpanded && isCommitListSectionExpanded && isFileTreeSectionExpanded) {
      return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          {renderCollapsedSection('filter')}
          <div className="min-h-0 flex-1 overflow-hidden">
            {renderExpandedGroup(['commit', 'file'])}
          </div>
        </div>
      );
    }

    if (isFilterSectionExpanded && !isCommitListSectionExpanded && isFileTreeSectionExpanded) {
      return (
        <ResizableSplitPane
          isOpen
          orientation="vertical"
          minLeftPx={SECTION_MIN_HEIGHT}
          minRightPx={SECTION_MIN_HEIGHT}
          controlledLeftPx={filterSectionHeight}
          onLeftPxChange={(leftPx, rightPx) => {
            setFilterSectionHeight(leftPx);
            setFileTreeSectionHeight(rightPx);
          }}
          className="h-full min-h-0"
          left={renderFilterSection()}
          right={(
            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
              {renderCollapsedSection('commit')}
              <div className="min-h-0 flex-1 overflow-hidden">
                {renderExpandedGroup(['file'])}
              </div>
            </div>
          )}
        />
      );
    }

    if (isFilterSectionExpanded && isCommitListSectionExpanded && !isFileTreeSectionExpanded) {
      return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
            {renderExpandedGroup(['filter', 'commit'])}
          </div>
          {renderCollapsedSection('file')}
        </div>
      );
    }

    if (isFilterSectionExpanded && !isCommitListSectionExpanded && !isFileTreeSectionExpanded) {
      return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
            {renderExpandedGroup(['filter'])}
          </div>
          {renderCollapsedSection('commit')}
          {renderCollapsedSection('file')}
        </div>
      );
    }

    if (!isFilterSectionExpanded && isCommitListSectionExpanded && !isFileTreeSectionExpanded) {
      return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          {renderCollapsedSection('filter')}
          <div className="min-h-0 flex-1 overflow-hidden">
            {renderExpandedGroup(['commit'])}
          </div>
          {renderCollapsedSection('file')}
        </div>
      );
    }

    if (!isFilterSectionExpanded && !isCommitListSectionExpanded && isFileTreeSectionExpanded) {
      return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          {renderCollapsedSection('filter')}
          {renderCollapsedSection('commit')}
          <div className="min-h-0 flex-1 overflow-hidden">
            {renderExpandedGroup(['file'])}
          </div>
        </div>
      );
    }

    return renderExpandedGroup(['filter', 'commit', 'file']);
  };

  const renderSidebarView = (view: SidebarView, state: 'entering' | 'exiting' | null): ReactElement => {
    const className = getSidebarViewClassName(view, state);

    if (view === 'settings') {
      return (
        <div className={className} aria-hidden={state === 'exiting'}>
          <SidebarSettingsPanel
            isActive={isRouteSlotActive && sidebarView === 'settings' && state !== 'exiting'}
            onBackClick={closeSidebarSettings}
          />
        </div>
      );
    }

    return (
      <div className={className} aria-hidden={state === 'exiting'}>
        <WorkspaceHeading
          commit={selectedCommit}
          title={selectedCommit?.message ?? t('workspace.commit_placeholder_title')}
          context={commitContext}
          compact
          endSlot={(
            <SettingsToggleButton
              isActive={sidebarView === 'settings'}
              onClick={sidebarView === 'settings' ? closeSidebarSettings : openSidebarSettings}
            />
          )}
        />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
          {renderExpandedSections()}
        </div>
      </div>
    );
  };

  return (
    <main className="app-shell flex h-screen min-h-0 overflow-hidden bg-surface">
      {!isSidebarCollapsed ? (
        <aside
          className="flex shrink-0 flex-col overflow-hidden border-r border-line bg-panel"
          style={{ width: `${sidebarWidth}px` }}
        >
          <div className="relative min-h-0 flex-1 overflow-hidden bg-surface">
            {exitingSidebarView ? renderSidebarView(exitingSidebarView, 'exiting') : null}
            {renderSidebarView(renderedSidebarView, exitingSidebarView ? 'entering' : null)}
          </div>
        </aside>
      ) : null}

      <div
        className={[
          'relative shrink-0 bg-transparent transition-colors duration-[var(--gae-motion-duration-fast)] ease-[var(--gae-motion-easing-default)] hover:bg-[color-mix(in_srgb,var(--gae-color-accent-primary)_20%,transparent)]',
          isSidebarDragging ? 'bg-[color-mix(in_srgb,var(--gae-color-accent-primary)_20%,transparent)]' : '',
          isSidebarCollapsed ? 'cursor-e-resize' : 'cursor-col-resize',
        ].filter(Boolean).join(' ')}
        style={{ width: `${SIDEBAR_RESIZE_HANDLE_WIDTH}px` }}
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        onMouseDown={(event) => {
          sidebarDragStateRef.current = {
            startX: event.clientX,
            startWidth: isSidebarCollapsed ? 0 : sidebarWidth,
          };
          if (isSidebarCollapsed) {
            setIsSidebarCollapsed(false);
            setSidebarWidth(lastSidebarWidth);
          }
          setIsSidebarDragging(true);
        }}
      >
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line" />
      </div>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 border-b border-line bg-panel px-6 py-4">
          <div className="flex items-center gap-2">
            <AISummaryToggleButton
              isActive={isCommitAISummaryActive}
              onClick={openCommitAISummaryFromSidebar}
            />
            <FileCanvasToggleButton
              isActive={activeWorkspacePanel === 'fileCanvas'}
              onClick={goToCanvasView}
            />
            <NoteToggleButton onClick={goToNoteView} />
          </div>
          <div className="flex items-center gap-2">
            {activeWorkspacePanel === 'symbolGraph' ? (
              <SymbolCodePanelToggleButton
                isOpen={symbolGraph.isCodePanelOpen}
                disabled={!symbolGraph.canToggleCodePanel}
                onClick={symbolGraph.toggleCodePanel}
              />
            ) : null}
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          {activeWorkspacePanel === 'none' ? (
            <div className="flex h-full items-center justify-center p-8">
              <EmptyState message={selectedCommit ? t('ai_summary.empty') : t('workspace.commit_placeholder_body')} />
            </div>
          ) : null}

          {activeWorkspacePanel === 'code' && selectedCommit && selectedFile ? (
            <CodeDiffPanel
              isActive={isRouteSlotActive && activeWorkspacePanel === 'code'}
              commitHash={selectedCommit.hash}
              filePath={selectedFile.path}
              isDeletedFile={selectedFile.status === 'D'}
            />
          ) : null}

          {activeWorkspacePanel === 'aiSummary' && selectedCommit ? (
            <AISummaryPanel
              isActive={isRouteSlotActive && activeWorkspacePanel === 'aiSummary'}
              targetFile={activeAIFile}
              onGoToSettings={openSidebarSettings}
            />
          ) : null}

          {activeWorkspacePanel === 'fileCanvas' && selectedCommit ? (
            <DependencyCanvasPanel
              isActive={isRouteSlotActive && activeWorkspacePanel === 'fileCanvas'}
              onFileCodeView={selectFileForCode}
            />
          ) : null}

          {activeWorkspacePanel === 'symbolGraph' && selectedCommit ? (
            <SymbolGraphPanel data={symbolGraph} />
          ) : null}
        </div>
      </section>
    </main>
  );
};

function getSidebarViewClassName(
  view: SidebarView,
  state: 'entering' | 'exiting' | null,
): string {
  const baseClassName = 'absolute inset-0 flex min-h-0 flex-col overflow-hidden bg-surface';

  if (state === 'entering') {
    return `${baseClassName} ${view === 'settings' ? 'motion-safe:animate-[sidebar-settings-in_200ms_var(--gae-motion-easing-default)]' : 'motion-safe:animate-[sidebar-default-in_200ms_var(--gae-motion-easing-default)]'}`;
  }

  if (state === 'exiting') {
    return `${baseClassName} pointer-events-none ${view === 'settings' ? 'motion-safe:animate-[sidebar-settings-out_200ms_var(--gae-motion-easing-default)]' : 'motion-safe:animate-[sidebar-default-out_200ms_var(--gae-motion-easing-default)]'}`;
  }

  return baseClassName;
}

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
