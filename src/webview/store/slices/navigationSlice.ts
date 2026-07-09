import type { StateCreator } from 'zustand';
import type { ChangedFile, Commit, RouteTransitionDirection, ScreenID } from '../../types/commit';
import type { AppState } from '../appStore';

export type WorkspacePanel = 'none' | 'code' | 'aiSummary' | 'fileCanvas' | 'symbolGraph';

export interface NavigationSlice {
  selectedCommit: Commit | null;
  currentScreen: ScreenID;
  previousScreen: ScreenID | null;
  transitionDirection: RouteTransitionDirection;
  activeWorkspacePanel: WorkspacePanel;
  activeAISummaryFilePath: string | null;

  selectCommit: (commit: Commit) => void;
  goToCommitList: () => void;
  goToHistoryView: () => void;
  goBackFromDetail: () => void;
  selectFileForCode: (file: ChangedFile) => void;
  goToCommitAISummary: (file?: ChangedFile | null) => void;
  goToCanvasView: () => void;
  goToSymbolGraphView: (file: ChangedFile) => void;
  goToSettingsView: () => void;
  goToNoteView: () => void;
}

export const createNavigationSlice: StateCreator<AppState, [], [], NavigationSlice> = (set, get) => ({
  selectedCommit: null,
  currentScreen: 'S02',
  previousScreen: null,
  transitionDirection: 'forward',
  activeWorkspacePanel: 'none',
  activeAISummaryFilePath: null,

  selectCommit: (commit) => {
    set({
      selectedCommit: commit,
      selectedFile: null,
      activeAISummaryFilePath: null,
      changedFiles: [],
      hasSavedCommitSummary: false,
      changedFilesError: null,
      isLoadingChangedFiles: false,
      hasLoadedChangedFiles: false,
      dependencyEdges: [],
      dependenciesError: null,
      isLoadingDependencies: false,
      selectedFileForSymbolGraph: null,
      symbolNodes: [],
      symbolEdges: [],
      symbolFileContent: null,
      isLoadingSymbolGraph: false,
      hasLoadedSymbolGraph: false,
      symbolGraphError: null,
      isCodePanelOpen: false,
      activeSymbolNodeId: null,
      hoveredSymbolNodeId: null,
      currentSummaryContent: '',
      isLoadingSummary: false,
      isGeneratingSummary: false,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: null,
      hasCurrentSavedSummary: false,
      isSummaryTokenLimitExceeded: false,
      noteContent: '',
      noteSavedPath: null,
      isLoadingNote: false,
      isSavingNote: false,
      noteError: null,
      hasSavedNote: false,
      activeWorkspacePanel: 'none',
    });
  },

  goToCommitList: () => {
    set({
      currentScreen: 'S02',
      previousScreen: null,
      transitionDirection: 'back',
      activeWorkspacePanel: 'none',
    });
  },

  goToHistoryView: () => {
    set({
      currentScreen: 'S02',
      previousScreen: null,
      transitionDirection: 'back',
      activeWorkspacePanel: 'none',
    });
  },

  goBackFromDetail: () => {
    const state = get();
    const previousScreen = state.previousScreen ?? 'S02';

    set({
      currentScreen: previousScreen,
      previousScreen: null,
      transitionDirection: 'back',
    });
  },

  selectFileForCode: (file) => {
    const state = get();

    set({
      selectedFile: file,
      currentSummaryContent: '',
      isLoadingSummary: false,
      isGeneratingSummary: false,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: null,
      hasCurrentSavedSummary: state.hasSavedCommitSummary,
      isSummaryTokenLimitExceeded: false,
      activeWorkspacePanel: 'code',
    });
  },

  goToCommitAISummary: (file = null) => {
    set({
      selectedFile: null,
      currentSummaryContent: '',
      isLoadingSummary: false,
      isGeneratingSummary: false,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: null,
      hasCurrentSavedSummary: get().hasSavedCommitSummary,
      isSummaryTokenLimitExceeded: false,
      activeAISummaryFilePath: file?.path ?? null,
      activeWorkspacePanel: 'aiSummary',
    });
  },

  goToCanvasView: () => {
    set({
      activeWorkspacePanel: 'fileCanvas',
    });
  },

  goToSymbolGraphView: (file) => {
    set({
      selectedFileForSymbolGraph: file,
      symbolNodes: [],
      symbolEdges: [],
      symbolFileContent: null,
      symbolGraphError: null,
      isLoadingSymbolGraph: false,
      hasLoadedSymbolGraph: false,
      isCodePanelOpen: false,
      activeSymbolNodeId: null,
      hoveredSymbolNodeId: null,
      activeWorkspacePanel: 'symbolGraph',
    });
  },

  goToSettingsView: () => {
    set((state) => ({
      currentScreen: 'S06',
      previousScreen: state.currentScreen === 'S06' ? state.previousScreen : state.currentScreen,
      transitionDirection: 'forward',
    }));
  },

  goToNoteView: () => {
    set((state) => ({
      currentScreen: 'S07',
      previousScreen: state.currentScreen === 'S07' ? state.previousScreen : state.currentScreen,
      transitionDirection: 'forward',
      noteError: null,
    }));
  },
});
