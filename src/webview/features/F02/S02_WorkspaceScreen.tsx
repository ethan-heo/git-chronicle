import { useCallback, useEffect, useMemo, useRef, useState, type FC, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { mergePersistedWebviewState, readPersistedWebviewState, type PersistedWorkspaceSidebarState } from '../../bridge/persistedWebviewState';
import { EmptyState, Popover, ResizableSplitPane, SidebarSection } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import { computeWorkspaceTabId, findLeafPane, getActiveTab, type PaneLeafNode, type WorkspaceTab } from '../../store/slices/workspaceTabsSlice';
import type { ChangedFile } from '../../types/commit';
import { CommitFilterPanel, CommitList, FilterToggleButton, SortOrderToggle, useCommitList } from '../F01';
import { DependencyCanvasPanel } from '../F04';
import { AISummaryPanel } from '../F05b';
import { SidebarSettingsPanel } from '../F06';
import { NoteEditorPanel } from '../F11';
import { AISummaryToggleButton } from './AISummaryToggleButton';
import { CodeTabSplitArea } from './CodeTabSplitArea';
import { FileCanvasToggleButton } from './FileCanvasToggleButton';
import { FileTree } from './FileTree';
import { NoteToggleButton } from './NoteToggleButton';
import { PaneTree } from './PaneTree';
import { SettingsToggleButton } from './SettingsToggleButton';
import { useChangedFileTree } from './useChangedFileTree';
import { WorkspaceHeading } from './WorkspaceHeading';

const SIDEBAR_DEFAULT_WIDTH = 320;
const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 560;
const SIDEBAR_RESIZE_HANDLE_WIDTH = 6;
const SIDEBAR_COLLAPSE_WIDTH = 0;
const SECTION_MIN_HEIGHT = 120;
const DEFAULT_COMMIT_LIST_SECTION_HEIGHT = 280;
const DEFAULT_FILE_TREE_SECTION_HEIGHT = 280;
const SIDEBAR_VIEW_TRANSITION_DURATION_MS = 200;

const DEFAULT_SIDEBAR_STATE: PersistedWorkspaceSidebarState = {
  isCommitListSectionExpanded: true,
  isFileTreeSectionExpanded: true,
  commitListSectionHeight: DEFAULT_COMMIT_LIST_SECTION_HEIGHT,
  fileTreeSectionHeight: DEFAULT_FILE_TREE_SECTION_HEIGHT,
  sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
  lastSidebarWidth: SIDEBAR_DEFAULT_WIDTH,
};
type SectionKey = 'commit' | 'file';
type SidebarView = 'default' | 'settings';

export const S02WorkspaceScreen: FC = () => {
  const { t } = useTranslation();
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const paneTree = useAppStore((state) => state.paneTree);
  const focusedPaneId = useAppStore((state) => state.focusedPaneId);
  const openWorkspaceTab = useAppStore((state) => state.openWorkspaceTab);
  const closeWorkspaceTab = useAppStore((state) => state.closeWorkspaceTab);
  const activateWorkspaceTab = useAppStore((state) => state.activateWorkspaceTab);
  const toggleCodeInnerPanel = useAppStore((state) => state.toggleCodeInnerPanel);
  const focusPane = useAppStore((state) => state.focusPane);
  const splitWorkspacePaneWithTab = useAppStore((state) => state.splitWorkspacePaneWithTab);
  const setPaneSplitSize = useAppStore((state) => state.setPaneSplitSize);
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
  const isGeneratingSummary = useAppStore((state) => state.isGeneratingSummary);
  const activeSummaryCommitHash = useAppStore((state) => state.activeSummaryCommitHash);
  const pushToast = useAppStore((state) => state.pushToast);
  const isRouteSlotActive = useRouteSlotActive();
  const changedFileTree = useChangedFileTree({ isActive: isRouteSlotActive, commit: selectedCommit });
  const focusedPane = findLeafPane(paneTree, focusedPaneId) ?? findFirstPane(paneTree);
  const activeTab = focusedPane ? getActiveTab(focusedPane) : null;
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
  const [isCommitListSectionExpanded, setIsCommitListSectionExpanded] = useState(persistedSidebarState.isCommitListSectionExpanded);
  const [isFileTreeSectionExpanded, setIsFileTreeSectionExpanded] = useState(persistedSidebarState.isFileTreeSectionExpanded);
  const [commitListSectionHeight, setCommitListSectionHeight] = useState(persistedSidebarState.commitListSectionHeight);
  const [fileTreeSectionHeight, setFileTreeSectionHeight] = useState(persistedSidebarState.fileTreeSectionHeight);
  const [prevSelectedCommitHash, setPrevSelectedCommitHash] = useState(selectedCommit?.hash);
  const [sidebarView, setSidebarView] = useState<SidebarView>('default');
  const [renderedSidebarView, setRenderedSidebarView] = useState<SidebarView>('default');
  const [exitingSidebarView, setExitingSidebarView] = useState<SidebarView | null>(null);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const sidebarDragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const filterToggleButtonRef = useRef<HTMLButtonElement | null>(null);

  if (prevSelectedCommitHash !== selectedCommit?.hash) {
    setPrevSelectedCommitHash(selectedCommit?.hash);
  }

  const isActiveTabCommitSelected = Boolean(activeTab && selectedCommit && activeTab.commit.hash === selectedCommit.hash);
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

  const openTab = useCallback((panelType: WorkspaceTab['panelType'], file?: ChangedFile | null) => {
    if (!selectedCommit) {
      return;
    }

    if (panelType === 'aiSummary' && isGeneratingSummary && activeSummaryCommitHash && activeSummaryCommitHash !== selectedCommit.hash) {
      pushToast('다른 탭에서 AI 요약 생성 중입니다.', 'warning');
      return;
    }

    openWorkspaceTab({
      panelType,
      commit: selectedCommit,
      filePath: file?.path ?? null,
    });
  }, [activeSummaryCommitHash, isGeneratingSummary, openWorkspaceTab, pushToast, selectedCommit]);

  const openCommitAISummaryFromSidebar = useCallback(() => {
    openTab('aiSummary');
  }, [openTab]);

  const openCodeTab = useCallback((file: ChangedFile) => {
    openTab('code', file);
  }, [openTab]);

  useEffect(() => {
    mergePersistedWebviewState({
      workspaceSidebar: {
        isCommitListSectionExpanded,
        isFileTreeSectionExpanded,
        commitListSectionHeight,
        fileTreeSectionHeight,
        sidebarWidth: isSidebarCollapsed ? 0 : sidebarWidth,
        lastSidebarWidth,
      },
    });
  }, [
    commitListSectionHeight,
    fileTreeSectionHeight,
    isCommitListSectionExpanded,
    isFileTreeSectionExpanded,
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
      actions={(
        <>
          <SortOrderToggle
            sortOrder={sortOrder}
            onSortOrderChange={(nextSortOrder) => setFilter({ sortOrder: nextSortOrder })}
          />
          <div className="relative">
            <FilterToggleButton
              isOpen={isFilterPopoverOpen}
              activeFilterCount={activeFilterCount}
              onClick={() => setIsFilterPopoverOpen((current) => !current)}
              ref={filterToggleButtonRef}
            />
            <Popover
              isOpen={isFilterPopoverOpen}
              onClose={() => {
                setIsFilterPopoverOpen(false);
                filterToggleButtonRef.current?.focus();
              }}
              anchorRef={filterToggleButtonRef}
              className="w-[min(24rem,calc(100vw-2rem))]"
              labelledBy="commit-filter-popover-title"
            >
              <div className="border-b border-line px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <strong id="commit-filter-popover-title" className="text-xs font-semibold text-text">
                    {t('commit.filter_title')}
                  </strong>
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md border border-line bg-panel text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text"
                    type="button"
                    onClick={() => {
                      setIsFilterPopoverOpen(false);
                      filterToggleButtonRef.current?.focus();
                    }}
                    aria-label={t('commit.filter_popover_close_aria')}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </div>
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
            </Popover>
          </div>
        </>
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
          onFileCodeView={openCodeTab}
          activeCodeFilePath={isActiveTabCommitSelected && activeTab?.panelType === 'code' ? activeTab.filePath : null}
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
    if (section === 'commit') {
      return renderCommitListSection();
    }

    return renderFileTreeSection();
  };

  const getSectionHeight = (section: SectionKey): number => {
    if (section === 'commit') {
      return commitListSectionHeight;
    }

    return fileTreeSectionHeight;
  };

  const setSectionHeight = (section: SectionKey, nextHeight: number): void => {
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
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {renderCollapsedSection('commit')}
        {renderCollapsedSection('file')}
      </div>
    );
  };

  const renderExpandedSections = (): ReactElement => {
    if (!isCommitListSectionExpanded && !isFileTreeSectionExpanded) {
      return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {renderCollapsedSection('commit')}
          {renderCollapsedSection('file')}
        </div>
      );
    }

    if (isCommitListSectionExpanded && isFileTreeSectionExpanded) {
      return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
            {renderExpandedGroup(['commit', 'file'])}
          </div>
        </div>
      );
    }

    if (isCommitListSectionExpanded) {
      return (
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-hidden">
            {renderExpandedGroup(['commit'])}
          </div>
          {renderCollapsedSection('file')}
        </div>
      );
    }

    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        {renderCollapsedSection('commit')}
        <div className="min-h-0 flex-1 overflow-hidden">
          {renderExpandedGroup(['file'])}
        </div>
      </div>
    );
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
        <PaneTree
          paneTree={paneTree}
          focusedPaneId={focusedPaneId}
          activeSummaryCommitHash={activeSummaryCommitHash}
          isGeneratingSummary={isGeneratingSummary}
          onActivateTab={(paneId, tabId) => activateWorkspaceTab(paneId, tabId)}
          onCloseTab={(paneId, tabId) => closeWorkspaceTab(paneId, tabId)}
          onFocusPane={focusPane}
          onSplitTab={splitWorkspacePaneWithTab}
          onResizeSplit={setPaneSplitSize}
          renderFixedActions={(paneId, paneActiveTab) => renderPaneActions({
            paneId,
            activeTab: paneActiveTab,
            selectedCommit,
            openCommitAISummaryFromSidebar,
            openTab,
          })}
          renderPanel={(paneId, paneActiveTab) => renderWorkspacePanel({
          paneId,
          activeTab: paneActiveTab,
          isRouteSlotActive,
          openCodeTab,
          openSidebarSettings,
          toggleCodeInnerPanel,
        })}
        />
      </section>
    </main>
  );
};

function renderPaneActions(options: {
  paneId: string;
  activeTab: WorkspaceTab | null;
  selectedCommit: ReturnType<typeof useAppStore.getState>['selectedCommit'];
  openCommitAISummaryFromSidebar: () => void;
  openTab: (panelType: WorkspaceTab['panelType']) => void;
}): ReactNode {
  const { activeTab, selectedCommit, openCommitAISummaryFromSidebar, openTab } = options;

  return (
    <>
      <AISummaryToggleButton
        isActive={Boolean(selectedCommit && activeTab?.id === computeWorkspaceTabId('aiSummary', selectedCommit.hash))}
        onClick={openCommitAISummaryFromSidebar}
      />
      <FileCanvasToggleButton
        isActive={Boolean(selectedCommit && activeTab?.id === computeWorkspaceTabId('fileCanvas', selectedCommit.hash))}
        onClick={() => openTab('fileCanvas')}
      />
      <NoteToggleButton
        isActive={Boolean(selectedCommit && activeTab?.id === computeWorkspaceTabId('note', selectedCommit.hash))}
        onClick={() => openTab('note')}
      />
    </>
  );
}

function renderWorkspacePanel(options: {
  paneId: string;
  activeTab: WorkspaceTab | null;
  isRouteSlotActive: boolean;
  openCodeTab: (file: ChangedFile) => void;
  openSidebarSettings: () => void;
  toggleCodeInnerPanel: (paneId: string, tabId: string, panel: 'aiSummary' | 'symbolGraph') => void;
}): ReactNode {
  const { paneId, activeTab, isRouteSlotActive, openCodeTab, openSidebarSettings, toggleCodeInnerPanel } = options;

  if (!activeTab) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState message="열린 탭이 없습니다." />
      </div>
    );
  }

  return (
    <WorkspacePaneContent
      paneId={paneId}
      activeTab={activeTab}
      isRouteSlotActive={isRouteSlotActive}
      openCodeTab={openCodeTab}
      openSidebarSettings={openSidebarSettings}
      toggleCodeInnerPanel={toggleCodeInnerPanel}
    />
  );
}

const WorkspacePaneContent: FC<{
  paneId: string;
  activeTab: WorkspaceTab;
  isRouteSlotActive: boolean;
  openCodeTab: (file: ChangedFile) => void;
  openSidebarSettings: () => void;
  toggleCodeInnerPanel: (paneId: string, tabId: string, panel: 'aiSummary' | 'symbolGraph') => void;
}> = ({ paneId, activeTab, isRouteSlotActive, openCodeTab, openSidebarSettings, toggleCodeInnerPanel }) => {
  const changedFileTree = useChangedFileTree({
    isActive: isRouteSlotActive,
    commit: activeTab.commit,
  });
  const codeFile = activeTab.panelType === 'code' && activeTab.filePath
    ? changedFileTree.changedFiles.find((file) => file.path === activeTab.filePath) ?? null
    : null;

  if (activeTab.panelType === 'code' && activeTab.filePath) {
    return (
      <CodeTabSplitArea
        tab={activeTab}
        isActive={isRouteSlotActive}
        selectedFile={codeFile}
        onToggleInnerPanel={(panel) => toggleCodeInnerPanel(paneId, activeTab.id, panel)}
        onGoToSettings={openSidebarSettings}
      />
    );
  }

  if (activeTab.panelType === 'aiSummary') {
    return (
      <AISummaryPanel
        isActive={isRouteSlotActive}
        targetFile={null}
        commit={activeTab.commit}
        onGoToSettings={openSidebarSettings}
      />
    );
  }

  if (activeTab.panelType === 'fileCanvas') {
    return <DependencyCanvasPanel isActive={isRouteSlotActive} paneId={paneId} commit={activeTab.commit} onFileCodeView={openCodeTab} />;
  }

  return <NoteEditorPanel paneId={paneId} commit={activeTab.commit} isActive={isRouteSlotActive} />;
};

function findFirstPane(node: PaneLeafNode | ReturnType<typeof useAppStore.getState>['paneTree']): PaneLeafNode {
  return node.kind === 'leaf' ? node : findFirstPane(node.children[0]);
}

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
