import { useCallback, useEffect, useMemo, useRef, useState, type FC, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { mergePersistedWebviewState, readPersistedWebviewState, type PersistedWorkspaceSidebarState } from '../../bridge/persistedWebviewState';
import { EmptyState, Popover, SidebarSection, SidebarSectionGroup, type SidebarSectionGroupItem } from '../../shared/components';
import { useRouteSlotActive } from '../../shared/route/RouteSlotContext';
import { useAppStore } from '../../store/appStore';
import { computeWorkspaceTabId, findLeafPane, getActiveTab, hasCodeInnerPanel, type PaneLeafNode, type WorkspaceTab } from '../../store/slices/workspaceTabsSlice';
import type { ChangedFile } from '../../types/commit';
import { CommitFilterPanel, CommitList, FilterToggleButton, SortOrderToggle, useCommitList } from '../F01';
import { DependencyCanvasPanel } from '../F04';
import { AISummaryPanel } from '../F05b';
import { SidebarSettingsPanel } from '../F06';
import { NoteEditorPanel, NotesSection } from '../F11';
import { IssueDetailPanel, IssuesSection, PRDetailPanel, PRsSection, useGithubAuth } from '../F12';
import type { IssueSummary, PullRequestSummary } from '../F12';
import { CommitGroupFilterDropdown, CommitGroupFilterToggleButton, CommitSelectionActionBar, SelectModeToggleButton, useCommitGroups } from '../F13';
import { BranchesSection } from '../F14';
import { CodeTabSplitArea } from './CodeTabSplitArea';
import { FileAISummaryToggleButton } from './FileAISummaryToggleButton';
import { FileTree } from './FileTree';
import { PaneTree } from './PaneTree';
import { SettingsToggleButton } from './SettingsToggleButton';
import { SymbolGraphToggleButton } from './SymbolGraphToggleButton';
import { useChangedFileTree } from './useChangedFileTree';
import { useWorkspaceKeyboardShortcuts } from './useWorkspaceKeyboardShortcuts';
import { WorkspaceHeading } from './WorkspaceHeading';

const SIDEBAR_DEFAULT_WIDTH = 320;
const SIDEBAR_MIN_WIDTH = 200;
const SIDEBAR_MAX_WIDTH = 560;
const SIDEBAR_RESIZE_HANDLE_WIDTH = 6;
const SIDEBAR_COLLAPSE_WIDTH = 0;
const SECTION_MIN_HEIGHT = 120;
const DEFAULT_COMMIT_LIST_SECTION_HEIGHT = 280;
const DEFAULT_FILE_TREE_SECTION_HEIGHT = 280;
const DEFAULT_BRANCHES_SECTION_HEIGHT = 160;
const DEFAULT_PRS_SECTION_HEIGHT = 200;
const DEFAULT_ISSUES_SECTION_HEIGHT = 200;
const DEFAULT_NOTES_SECTION_HEIGHT = 220;
const SIDEBAR_VIEW_TRANSITION_DURATION_MS = 200;

const DEFAULT_SIDEBAR_STATE: PersistedWorkspaceSidebarState = {
  isBranchesSectionExpanded: true,
  isCommitListSectionExpanded: true,
  isFileTreeSectionExpanded: true,
  branchesSectionHeight: DEFAULT_BRANCHES_SECTION_HEIGHT,
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
  useWorkspaceKeyboardShortcuts();
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const paneTree = useAppStore((state) => state.paneTree);
  const focusedPaneId = useAppStore((state) => state.focusedPaneId);
  const sidebarActivePRNumber = useAppStore((state) => state.sidebarActivePRNumber);
  const sidebarActiveIssueNumber = useAppStore((state) => state.sidebarActiveIssueNumber);
  const openWorkspaceTab = useAppStore((state) => state.openWorkspaceTab);
  const closeWorkspaceTab = useAppStore((state) => state.closeWorkspaceTab);
  const activateWorkspaceTab = useAppStore((state) => state.activateWorkspaceTab);
  const toggleCodeInnerPanel = useAppStore((state) => state.toggleCodeInnerPanel);
  const moveCodeInnerPanel = useAppStore((state) => state.moveCodeInnerPanel);
  const resizeCodeInnerSplit = useAppStore((state) => state.resizeCodeInnerSplit);
  const focusPane = useAppStore((state) => state.focusPane);
  const moveWorkspaceTab = useAppStore((state) => state.moveWorkspaceTab);
  const setPaneSplitSize = useAppStore((state) => state.setPaneSplitSize);
  const authorList = useAppStore((state) => state.authorList);
  const filterDateStart = useAppStore((state) => state.filterDateStart);
  const filterDateEnd = useAppStore((state) => state.filterDateEnd);
  const filterAuthor = useAppStore((state) => state.filterAuthor);
  const filterBranch = useAppStore((state) => state.filterBranch);
  const filterKeyword = useAppStore((state) => state.filterKeyword);
  const filterExcludeKeyword = useAppStore((state) => state.filterExcludeKeyword);
  const filterGroupId = useAppStore((state) => state.filterGroupId);
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
  const {
    commitGroups,
    isSelectModeActive,
    selectedCommitHashesForGroup,
    editingGroupId,
    toggleSelectMode,
    cancelSelectMode,
    toggleCommitSelectionForGroup,
    startEditingGroup,
    saveGroup,
    deleteGroup,
  } = useCommitGroups({ isActive: isRouteSlotActive });
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
  const [isBranchesSectionExpanded, setIsBranchesSectionExpanded] = useState(
    persistedSidebarState.isBranchesSectionExpanded ?? DEFAULT_SIDEBAR_STATE.isBranchesSectionExpanded,
  );
  const [branchesSectionHeight, setBranchesSectionHeight] = useState(
    persistedSidebarState.branchesSectionHeight ?? DEFAULT_SIDEBAR_STATE.branchesSectionHeight,
  );
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
  const [isGroupFilterPopoverOpen, setIsGroupFilterPopoverOpen] = useState(false);
  const sidebarDragStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const filterToggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const groupFilterToggleButtonRef = useRef<HTMLButtonElement | null>(null);

  if (prevSelectedCommitHash !== selectedCommit?.hash) {
    setPrevSelectedCommitHash(selectedCommit?.hash);
  }

  const isActiveTabCommitSelected = Boolean(activeTab && activeTab.commit && selectedCommit && activeTab.commit.hash === selectedCommit.hash);
  const isFilterActive = Boolean(
    filterBranch || filterDateStart || filterDateEnd || filterAuthor || filterKeyword.trim() || filterExcludeKeyword.trim() || filterGroupId,
  );
  const activeFilterCount = [
    filterDateStart,
    filterDateEnd,
    filterAuthor,
    filterKeyword.trim(),
    filterExcludeKeyword.trim(),
  ].filter(Boolean).length;
  const editingGroup = editingGroupId ? commitGroups.find((group) => group.id === editingGroupId) ?? null : null;

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

  const openFileCanvasFromSidebar = useCallback(() => {
    openTab('fileCanvas');
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

  const activePRNumber = sidebarActivePRNumber;
  const activeIssueNumber = sidebarActiveIssueNumber;

  useEffect(() => {
    mergePersistedWebviewState({
      workspaceSidebar: {
        isCommitListSectionExpanded,
        isFileTreeSectionExpanded,
        isBranchesSectionExpanded,
        branchesSectionHeight,
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
    branchesSectionHeight,
    fileTreeSectionHeight,
    isBranchesSectionExpanded,
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

  const isAIViewActive = Boolean(
    selectedCommit && activeTab?.id === computeWorkspaceTabId('aiSummary', selectedCommit.hash),
  );
  const isFileCanvasActive = Boolean(
    selectedCommit && activeTab?.id === computeWorkspaceTabId('fileCanvas', selectedCommit.hash),
  );

  const renderCommitListSection = (): ReactElement => (
    <SidebarSection
      title={t('commit.list_title')}
      isExpanded={isCommitListSectionExpanded}
      onToggle={() => setIsCommitListSectionExpanded((current) => !current)}
      badge={(
        <strong className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-medium leading-none text-text">
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
                filterBranch={filterBranch}
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
          <div className="relative">
            <CommitGroupFilterToggleButton
              isOpen={isGroupFilterPopoverOpen}
              isActive={Boolean(filterGroupId)}
              onClick={() => setIsGroupFilterPopoverOpen((current) => !current)}
              ref={groupFilterToggleButtonRef}
            />
            <Popover
              isOpen={isGroupFilterPopoverOpen}
              onClose={() => {
                setIsGroupFilterPopoverOpen(false);
                groupFilterToggleButtonRef.current?.focus();
              }}
              anchorRef={groupFilterToggleButtonRef}
              className="w-[min(18rem,calc(100vw-2rem))]"
              labelledBy="commit-group-filter-popover-title"
            >
              <div className="border-b border-line px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <strong id="commit-group-filter-popover-title" className="text-xs font-semibold text-text">
                    {t('commit.group_filter_popover_title')}
                  </strong>
                  <button
                    className="inline-flex size-7 items-center justify-center rounded-md bg-panel text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text"
                    type="button"
                    onClick={() => {
                      setIsGroupFilterPopoverOpen(false);
                      groupFilterToggleButtonRef.current?.focus();
                    }}
                    aria-label={t('commit.group_filter_popover_close_aria')}
                    title={t('commit.group_filter_popover_close_aria')}
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </div>
              <CommitGroupFilterDropdown
                groups={commitGroups}
                selectedGroupId={filterGroupId}
                onSelectGroup={(id) => setFilter({ filterGroupId: id })}
                onEditGroup={(group) => {
                  setIsGroupFilterPopoverOpen(false);
                  startEditingGroup(group);
                }}
                onDeleteGroup={deleteGroup}
              />
            </Popover>
          </div>
          <SelectModeToggleButton isActive={isSelectModeActive} onClick={toggleSelectMode} />
        </>
      )}
    >
      {isSelectModeActive ? (
        <CommitSelectionActionBar
          selectedCount={selectedCommitHashesForGroup.size}
          isEditing={Boolean(editingGroupId)}
          initialName={editingGroup?.name ?? ''}
          onSave={saveGroup}
          onCancel={cancelSelectMode}
        />
      ) : null}
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
        onOpenAISummary={openCommitAISummaryFromSidebar}
        onOpenFileCanvas={openFileCanvasFromSidebar}
        isAIViewActive={isAIViewActive}
        isFileCanvasActive={isFileCanvasActive}
        isSelectModeActive={isSelectModeActive}
        selectedCommitHashesForGroup={selectedCommitHashesForGroup}
        onToggleCheckForGroup={toggleCommitSelectionForGroup}
      />
    </SidebarSection>
  );

  const renderFileTreeSection = (): ReactElement => (
    <SidebarSection
      title={t('file_tree.panel_aria')}
      isExpanded={isFileTreeSectionExpanded}
      onToggle={() => setIsFileTreeSectionExpanded((current) => !current)}
      badge={selectedCommit ? (
        <strong className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-medium leading-none text-text">
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
      key: 'branch',
      minHeightPx: SECTION_MIN_HEIGHT,
      heightPx: branchesSectionHeight ?? DEFAULT_BRANCHES_SECTION_HEIGHT,
      isExpanded: isBranchesSectionExpanded ?? true,
      onHeightChange: setBranchesSectionHeight,
      node: (
        <BranchesSection
          isActive={isRouteSlotActive}
          isExpanded={isBranchesSectionExpanded ?? true}
          onToggleExpanded={() => setIsBranchesSectionExpanded((current) => !current)}
        />
      ),
    },
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
          focusedPaneId={focusedPaneId}
          activeSummaryCommitHash={activeSummaryCommitHash}
          isGeneratingSummary={isGeneratingSummary}
          onActivateTab={(paneId, tabId) => activateWorkspaceTab(paneId, tabId)}
          onCloseTab={(paneId, tabId) => closeWorkspaceTab(paneId, tabId)}
          onFocusPane={focusPane}
          onMoveTab={moveWorkspaceTab}
          onResizeSplit={setPaneSplitSize}
          renderLeadingActions={() => null}
          renderTrailingActions={(paneId, paneActiveTab) => (
            <WorkspaceTabLeadingActions
              paneId={paneId}
              activeTab={paneActiveTab}
              isRouteSlotActive={isRouteSlotActive}
              toggleCodeInnerPanel={toggleCodeInnerPanel}
            />
          )}
          renderPanel={(paneId, paneActiveTab) => renderWorkspacePanel({
          paneId,
          activeTab: paneActiveTab,
          isRouteSlotActive,
          openCodeTab,
          openSidebarSettings,
          toggleCodeInnerPanel,
          moveCodeInnerPanel,
          resizeCodeInnerSplit,
          noOpenTabMessage: t('workspace.no_open_tab'),
        })}
        />
      </section>
    </main>
  );
};

const WorkspaceTabLeadingActions: FC<{
  paneId: string;
  activeTab: WorkspaceTab | null;
  isRouteSlotActive: boolean;
  toggleCodeInnerPanel: (paneId: string, tabId: string, panel: 'aiSummary' | 'symbolGraph') => void;
}> = ({ paneId, activeTab, isRouteSlotActive, toggleCodeInnerPanel }) => {
  const changedFileTree = useChangedFileTree({
    isActive: isRouteSlotActive,
    commit: activeTab?.panelType === 'code' ? activeTab.commit : null,
  });

  if (!activeTab || activeTab.panelType !== 'code') {
    return null;
  }

  const selectedFile = activeTab.filePath
    ? changedFileTree.changedFiles.find((file) => file.path === activeTab.filePath) ?? null
    : null;

  return (
    <div className="flex items-center gap-1 self-center">
      <FileAISummaryToggleButton
        isActive={hasCodeInnerPanel(activeTab.codeInnerPaneTree, 'aiSummary')}
        onClick={() => toggleCodeInnerPanel(paneId, activeTab.id, 'aiSummary')}
      />
      <SymbolGraphToggleButton
        isActive={hasCodeInnerPanel(activeTab.codeInnerPaneTree, 'symbolGraph')}
        disabled={selectedFile?.status === 'D'}
        onClick={() => toggleCodeInnerPanel(paneId, activeTab.id, 'symbolGraph')}
      />
    </div>
  );
};

function renderWorkspacePanel(options: {
  paneId: string;
  activeTab: WorkspaceTab | null;
  isRouteSlotActive: boolean;
  openCodeTab: (file: ChangedFile) => void;
  openSidebarSettings: () => void;
  toggleCodeInnerPanel: (paneId: string, tabId: string, panel: 'aiSummary' | 'symbolGraph') => void;
  moveCodeInnerPanel: (input: {
    paneId: string;
    tabId: string;
    sourcePanel: 'diff' | 'aiSummary' | 'symbolGraph';
    targetPanel: 'diff' | 'aiSummary' | 'symbolGraph';
    zone: 'left' | 'right' | 'top' | 'bottom';
  }) => void;
  resizeCodeInnerSplit: (paneId: string, tabId: string, nodeId: string, sizePercent: number) => void;
  noOpenTabMessage: string;
}): ReactNode {
  const {
    paneId,
    activeTab,
    isRouteSlotActive,
    openCodeTab,
    openSidebarSettings,
    toggleCodeInnerPanel,
    moveCodeInnerPanel,
    resizeCodeInnerSplit,
    noOpenTabMessage,
  } = options;

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
      moveCodeInnerPanel={moveCodeInnerPanel}
      resizeCodeInnerSplit={resizeCodeInnerSplit}
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
  moveCodeInnerPanel: (input: {
    paneId: string;
    tabId: string;
    sourcePanel: 'diff' | 'aiSummary' | 'symbolGraph';
    targetPanel: 'diff' | 'aiSummary' | 'symbolGraph';
    zone: 'left' | 'right' | 'top' | 'bottom';
  }) => void;
  resizeCodeInnerSplit: (paneId: string, tabId: string, nodeId: string, sizePercent: number) => void;
}> = ({
  paneId,
  activeTab,
  isRouteSlotActive,
  openCodeTab,
  openSidebarSettings,
  toggleCodeInnerPanel,
  moveCodeInnerPanel,
  resizeCodeInnerSplit,
}) => {
  const changedFileTree = useChangedFileTree({
    isActive: isRouteSlotActive,
    commit: activeTab.commit,
  });
  const codeFile = activeTab.panelType === 'code' && activeTab.filePath
    ? changedFileTree.changedFiles.find((file) => file.path === activeTab.filePath) ?? null
    : null;
  // changedFileTree가 아직 로드되기 전에는 codeFile이 파일 미해당인지 아직 로딩 중인지 구분되지 않는다.
  // AISummaryPanel이 이 구간을 '커밋 스코프'로 오인해 자동 재생성하지 않도록 로딩 상태를 함께 전달한다.
  const isSelectedFilePending = activeTab.panelType === 'code' && Boolean(activeTab.filePath) && !changedFileTree.hasLoaded;

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
        isSelectedFilePending={isSelectedFilePending}
        onToggleInnerPanel={(panel) => toggleCodeInnerPanel(paneId, activeTab.id, panel)}
        onMoveInnerPanel={(input) => moveCodeInnerPanel({ paneId, tabId: activeTab.id, ...input })}
        onResizeInnerSplit={(nodeId, sizePercent) => resizeCodeInnerSplit(paneId, activeTab.id, nodeId, sizePercent)}
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
