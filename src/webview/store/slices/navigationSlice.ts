import type { StateCreator } from 'zustand';
import type { Commit, RouteTransitionDirection, ScreenID } from '../../types/commit';
import type { AppState } from '../appStore';

export interface NavigationSlice {
  selectedCommit: Commit | null;
  currentScreen: ScreenID;
  transitionDirection: RouteTransitionDirection;

  selectCommit: (commit: Commit) => void;
  goToCommitList: () => void;
  goToHistoryView: () => void;
  goToSettingsView: () => void;
}

export const createNavigationSlice: StateCreator<AppState, [], [], NavigationSlice> = (set) => ({
  selectedCommit: null,
  currentScreen: 'S02',
  transitionDirection: 'forward',

  selectCommit: (commit) => {
    set({
      selectedCommit: commit,
      selectedFile: null,
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
    });
  },

  goToCommitList: () => {
    set({
      currentScreen: 'S02',
      transitionDirection: 'back',
    });
  },

  goToHistoryView: () => {
    set({
      currentScreen: 'S02',
      transitionDirection: 'back',
    });
  },

  goToSettingsView: () => {
    set({});
  },
});
