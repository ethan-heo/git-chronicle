import { useCallback, useEffect, useMemo, useRef, useState, type FC, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { mergePersistedWebviewState, readPersistedWebviewState, type PersistedWorkspaceSidebarState } from '../../bridge/persistedWebviewState';
import { EmptyState, Popover, SidebarSection, SidebarSectionGroup, type SidebarSectionGroupItem } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import { computeWorkspaceTabId, findLeafPane, getActiveTab, type PaneLeafNode, type WorkspaceTab } from '../../store/slices/workspaceTabsSlice';
import type { ChangedFile } from '../../types/commit';
import { CommitFilterPanel, CommitList, FilterToggleButton, SortOrderToggle, useCommitList } from '../F01';
import { DependencyCanvasPanel } from '../F04';
import { AISummaryPanel } from '../F05b';
import { SidebarSettingsPanel } from '../F06';
import { NoteEditorPanel, NotesSection } from '../F11';
import { IssueDetailPanel, IssuesSection, PRDetailPanel, PRsSection, useGithubAuth } from '../F12';
import type { IssueSummary, PullRequestSummary } from '../F12';
import { AISummaryToggleButton } from './AISummaryToggleButton';
import { CodeTabSplitArea } from './CodeTabSplitArea';
import { FileCanvasToggleButton } from './FileCanvasToggleButton';
import { FileTree } from './FileTree';
import { PaneActionsGroup } from './PaneActionsGroup';
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
const DEFAULT_PRS_SECTION_HEIGHT = 200;
const DEFAULT_ISSUES_SECTION_HEIGHT = 200;
const DEFAULT_NOTES_SECTION_HEIGHT = 220;
const SIDEBAR_VIEW_TRANSITION_DURATION_MS = 200;

const DEFAULT_SIDEBAR_STATE: PersistedWorkspaceSidebarState = {
  isCommitListSectionExpanded: true,
  isFileTreeSectionExpanded: true,
  commitListSectionHeight: DEFAULT_COMMIT_LIST_SECTION_HEIGHT,
  fileTreeSectionHeight: DEFAULT_FILE_TREE_SECTION_HEIGHT,
  isPRsSectionExpanded: false,
  prsSectionHeight: DEFAULT_PRS_SECTION_HEIGHT,
  isIssuesSectionExpanded: false,
  issuesSectionHeight: DEFAULT_ISSUES_SECTION_HEIGHT,
  isNotesSectionExpanded: true,
  notesSectionHeight: DEFAULT_NOTES_SECTION_HEIGHT,
  sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
  lastSidebarWidth: SIDEBAR_DEFAULT_WIDTH,
};
type SidebarView = 'default' | 'settings';

export const S02WorkspaceScreen: FC = () => {
  const { t, i18n } = useTranslation();
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const paneTree = useAppStore((state) => state.paneTree);
  const focusedPaneId = useAppStore((state) => state.focusedPaneId);
  const openWorkspaceTab = useAppStore((state) => state.openWorkspaceTab);
  const closeWorkspaceTab = useAppStore((state) => state.closeWorkspaceTab);
  const activateWorkspaceTab = useAppStore((state) => state.activateWorkspaceTab);
  const toggleCodeInnerPanel = useAppStore((state) => state.toggleCodeInnerPanel);
  const focusPane = useAppStore((state) => state.focusPane);
  const moveWorkspaceTab = useAppStore((state) => state.moveWorkspaceTab);
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
  useGithubAuth({ isActive: isRouteSlotActive });
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
  const [isPRsSectionExpanded, setIsPRsSectionExpanded] = useState(
    persistedSidebarState.isPRsSectionExpanded ?? DEFAULT_SIDEBAR_STATE.isPRsSectionExpanded,
  );
  const [prsSectionHeight, setPRsSectionHeight] = useState(
    persistedSidebarState.prsSectionHeight ?? DEFAULT_SIDEBAR_STATE.prsSectionHeight,
  );
  const [isIssuesSectionExpanded, setIsIssuesSectionExpanded] = useState(
    persistedSidebarState.isIssuesSectionExpanded ?? DEFAULT_SIDEBAR_STATE.isIssuesSectionExpanded,
  );
  const [issuesSectionHeight, setIssuesSectionHeight] = useState(
    persistedSidebarState.issuesSectionHeight ?? DEFAULT_SIDEBAR_STATE.issuesSectionHeight,
  );
  const [isNotesSectionExpanded, setIsNotesSectionExpanded] = useState(
    persistedSidebarState.isNotesSectionExpanded ?? DEFAULT_SIDEBAR_STATE.isNotesSectionExpanded,
  );
  const [notesSectionHeight, setNotesSectionHeight] = useState(
    persistedSidebarState.notesSectionHeight ?? DEFAULT_SIDEBAR_STATE.notesSectionHeight,
  );
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

  const isActiveTabCommitSelected = Boolean(activeTab && activeTab.commit && selectedCommit && activeTab.commit.hash === selectedCommit.hash);
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

  const openTab = useCallback((panelType: 'code' | 'aiSummary' | 'fileCanvas', file?: ChangedFile | null) => {
    if (!selectedCommit) {
      return;
    }

    if (panelType === 'aiSummary' && isGeneratingSummary && activeSummaryCommitHash && activeSummaryCommitHash !== selectedCommit.hash) {
      pushToast(t('workspace.ai_summary_busy_toast'), 'warning');
      return;
    }

    openWorkspaceTab({
      panelType,
      commit: selectedCommit,
      filePath: file?.path ?? null,
    });
  }, [activeSummaryCommitHash, isGeneratingSummary, openWorkspaceTab, pushToast, selectedCommit, t]);

  const openCommitAISummaryFromSidebar = useCallback(() => {
    openTab('aiSummary');
  }, [openTab]);

  const openCodeTab = useCallback((file: ChangedFile) => {
    openTab('code', file);
  }, [openTab]);

  const openPRTab = useCallback((pullRequest: PullRequestSummary) => {
    openWorkspaceTab({ panelType: 'pr', prNumber: pullRequest.number, title: pullRequest.title });
  }, [openWorkspaceTab]);

  const openIssueTab = useCallback((issue: IssueSummary) => {
    openWorkspaceTab({ panelType: 'issue', issueNumber: issue.number, title: issue.title });
  }, [openWorkspaceTab]);

  const activePRNumber = activeTab?.panelType === 'pr' ? activeTab.prNumber ?? null : null;
  const activeIssueNumber = activeTab?.panelType === 'issue' ? activeTab.issueNumber ?? null : null;

  useEffect(() => {
    mergePersistedWebviewState({
      workspaceSidebar: {
        isCommitListSectionExpanded,
        isFileTreeSectionExpanded,
        commitListSectionHeight,
        fileTreeSectionHeight,
        isPRsSectionExpanded,
        prsSectionHeight,
        isIssuesSectionExpanded,
        issuesSectionHeight,
        isNotesSectionExpanded,
        notesSectionHeight,
        sidebarWidth: isSidebarCollapsed ? 0 : sidebarWidth,
        lastSidebarWidth,
      },
    });
  }, [
    commitListSectionHeight,
    fileTreeSectionHeight,
    isCommitListSectionExpanded,
    isFileTreeSectionExpanded,
    isIssuesSectionExpanded,
    isNotesSectionExpanded,
    isPRsSectionExpanded,
    isSidebarCollapsed,
    issuesSectionHeight,
    lastSidebarWidth,
    notesSectionHeight,
    prsSectionHeight,
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
    ? `${selectedCommit.shortHash} · ${selectedCommit.author} · ${formatDate(selectedCommit.date, i18n.language)}`
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
                    className="inline-flex size-7 items-center justify-center rounded-md bg-panel text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text"
                    type="button"
                    onClick={() => {
                      setIsFilterPopoverOpen(false);
                      filterToggleButtonRef.current?.focus();
                    }}
                    aria-label={t('commit.filter_popover_close_aria')}
                    title={t('commit.filter_popover_close_aria')}
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

  const sidebarSections: SidebarSectionGroupItem[] = [
    {
      key: 'commit',
      minHeightPx: SECTION_MIN_HEIGHT,
      heightPx: commitListSectionHeight,
      isExpanded: isCommitListSectionExpanded,
      onHeightChange: setCommitListSectionHeight,
      node: renderCommitListSection(),
    },
    {
      key: 'file',
      minHeightPx: SECTION_MIN_HEIGHT,
      heightPx: fileTreeSectionHeight,
      isExpanded: isFileTreeSectionExpanded,
      onHeightChange: setFileTreeSectionHeight,
      node: renderFileTreeSection(),
    },
    {
      key: 'pr',
      minHeightPx: SECTION_MIN_HEIGHT,
      heightPx: prsSectionHeight,
      isExpanded: isPRsSectionExpanded,
      onHeightChange: setPRsSectionHeight,
      node: (
        <PRsSection
          isActive={isRouteSlotActive}
          activePRNumber={activePRNumber}
          isExpanded={isPRsSectionExpanded}
          onToggleExpanded={() => setIsPRsSectionExpanded((current) => !current)}
          onSelectPullRequest={openPRTab}
        />
      ),
    },
    {
      key: 'issue',
      minHeightPx: SECTION_MIN_HEIGHT,
      heightPx: issuesSectionHeight,
      isExpanded: isIssuesSectionExpanded,
      onHeightChange: setIssuesSectionHeight,
      node: (
        <IssuesSection
          isActive={isRouteSlotActive}
          activeIssueNumber={activeIssueNumber}
          isExpanded={isIssuesSectionExpanded}
          onToggleExpanded={() => setIsIssuesSectionExpanded((current) => !current)}
          onSelectIssue={openIssueTab}
        />
      ),
    },
    {
      key: 'note',
      minHeightPx: SECTION_MIN_HEIGHT,
      heightPx: notesSectionHeight ?? DEFAULT_NOTES_SECTION_HEIGHT,
      isExpanded: isNotesSectionExpanded ?? true,
      onHeightChange: setNotesSectionHeight,
      node: (
        <NotesSection
          isActive={isRouteSlotActive}
          isExpanded={isNotesSectionExpanded ?? true}
          onToggleExpanded={() => setIsNotesSectionExpanded((current) => !current)}
          activeRelativePath={activeTab?.panelType === 'note' ? activeTab.relativePath ?? null : null}
        />
      ),
    },
  ];

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
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface">
          <SidebarSectionGroup sections={sidebarSections} />
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
          activeSummaryCommitHash={activeSummaryCommitHash}
          isGeneratingSummary={isGeneratingSummary}
          onActivateTab={(paneId, tabId) => activateWorkspaceTab(paneId, tabId)}
          onCloseTab={(paneId, tabId) => closeWorkspaceTab(paneId, tabId)}
          onFocusPane={focusPane}
          onMoveTab={moveWorkspaceTab}
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
          noOpenTabMessage: t('workspace.no_open_tab'),
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
  openTab: (panelType: 'code' | 'aiSummary' | 'fileCanvas') => void;
}): ReactNode {
  const { activeTab, selectedCommit, openCommitAISummaryFromSidebar, openTab } = options;

  return (
    <PaneActionsGroup>
      <AISummaryToggleButton
        isActive={Boolean(selectedCommit && activeTab?.id === computeWorkspaceTabId('aiSummary', selectedCommit.hash))}
        onClick={openCommitAISummaryFromSidebar}
      />
      <FileCanvasToggleButton
        isActive={Boolean(selectedCommit && activeTab?.id === computeWorkspaceTabId('fileCanvas', selectedCommit.hash))}
        onClick={() => openTab('fileCanvas')}
      />
    </PaneActionsGroup>
  );
}

function renderWorkspacePanel(options: {
  paneId: string;
  activeTab: WorkspaceTab | null;
  isRouteSlotActive: boolean;
  openCodeTab: (file: ChangedFile) => void;
  openSidebarSettings: () => void;
  toggleCodeInnerPanel: (paneId: string, tabId: string, panel: 'aiSummary' | 'symbolGraph') => void;
  noOpenTabMessage: string;
}): ReactNode {
  const { paneId, activeTab, isRouteSlotActive, openCodeTab, openSidebarSettings, toggleCodeInnerPanel, noOpenTabMessage } = options;

  if (!activeTab) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <EmptyState message={noOpenTabMessage} />
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

  if (activeTab.panelType === 'pr' && activeTab.prNumber != null) {
    return <PRDetailPanel prNumber={activeTab.prNumber} isActive={isRouteSlotActive} />;
  }

  if (activeTab.panelType === 'issue' && activeTab.issueNumber != null) {
    return <IssueDetailPanel issueNumber={activeTab.issueNumber} isActive={isRouteSlotActive} />;
  }

  if (activeTab.panelType === 'note' && activeTab.relativePath) {
    return <NoteEditorPanel paneId={paneId} relativePath={activeTab.relativePath} isActive={isRouteSlotActive} />;
  }

  if (!activeTab.commit) {
    return null;
  }

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
  return null;
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

function formatDate(date: string, language: string): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  if (!language.startsWith('ko')) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(parsedDate);
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(parsedDate)
    .replaceAll(' ', '');
}
