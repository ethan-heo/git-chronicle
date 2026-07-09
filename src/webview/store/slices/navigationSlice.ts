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
      currentSummaryContent: '',
      isLoadingSummary: false,
      isGeneratingSummary: false,
      isGeneratingQA: false,
      summaryError: null,
      qaError: null,
      summarySavedPath: null,
      hasCurrentSavedSummary: false,
      isSummaryTokenLimitExceeded: false,
      activeSummaryTargetKey: null,
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
