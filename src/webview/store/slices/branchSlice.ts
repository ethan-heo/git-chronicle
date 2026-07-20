import type { StateCreator } from 'zustand';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import type { Branch } from '../../types/commit';
import type { AppState } from '../appStore';

const DEMO_BRANCHES: Branch[] = [
  { name: 'main', scope: 'local', isCurrent: true, upstream: 'origin/main', ahead: 0, behind: 0 },
  { name: 'feature/branch-switcher', scope: 'local', isCurrent: false, upstream: 'origin/feature/branch-switcher', ahead: 2, behind: 0 },
  { name: 'origin/api', scope: 'remote', isCurrent: false, upstream: null, ahead: 0, behind: 0 },
  { name: 'origin/feature/notes', scope: 'remote', isCurrent: false, upstream: null, ahead: 0, behind: 0 },
];

interface BranchesLoadedPayload {
  branches: Branch[];
  refresh?: boolean;
}

export interface BranchSlice {
  branches: Branch[];
  isLoadingBranches: boolean;
  hasLoadedBranches: boolean;
  branchesError: string | null;
  isFetchingBranches: boolean;
  loadBranches: (options?: { refresh?: boolean }) => void;
  handleBranchesLoaded: (payload: BranchesLoadedPayload) => void;
  handleBranchesLoadFailed: (payload?: { message?: string; refresh?: boolean }) => void;
}

function getFallbackBranch(branches: Branch[]): string | null {
  return branches.find((branch) => branch.isCurrent)?.name ?? branches[0]?.name ?? null;
}

export const createBranchSlice: StateCreator<AppState, [], [], BranchSlice> = (set, get) => ({
  branches: [],
  isLoadingBranches: false,
  hasLoadedBranches: false,
  branchesError: null,
  isFetchingBranches: false,

  loadBranches: ({ refresh = false } = {}) => {
    const state = get();
    if (refresh) {
      if (state.isFetchingBranches) {
        return;
      }
    } else if (state.isLoadingBranches || state.hasLoadedBranches) {
      return;
    }

    set({
      ...(refresh
        ? { isFetchingBranches: true }
        : { isLoadingBranches: true, branchesError: null }),
    });

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        get().handleBranchesLoaded({ branches: DEMO_BRANCHES, refresh });
      }, 220);
      return;
    }

    postMessage('FETCH_BRANCHES', { refresh });
  },

  handleBranchesLoaded: ({ branches, refresh = false }) => {
    const state = get();
    const fallbackBranch = getFallbackBranch(branches);
    const currentFilterBranch = state.filterBranch;
    const hasMatchingBranch = currentFilterBranch ? branches.some((branch) => branch.name === currentFilterBranch) : false;
    const nextFilterBranch = hasMatchingBranch ? currentFilterBranch : fallbackBranch;

    set({
      branches,
      isLoadingBranches: false,
      hasLoadedBranches: true,
      branchesError: null,
      isFetchingBranches: false,
    });

    if (nextFilterBranch !== currentFilterBranch) {
      state.setFilter({ filterBranch: nextFilterBranch });
      return;
    }

    if (refresh && state.filterGroupId) {
      return;
    }
  },

  handleBranchesLoadFailed: ({ message = 'Failed to load branches', refresh = false } = {}) => {
    const hasExistingBranches = get().branches.length > 0;

    set({
      isLoadingBranches: false,
      isFetchingBranches: false,
      hasLoadedBranches: hasExistingBranches,
      branchesError: hasExistingBranches ? null : message,
    });

    if (refresh && hasExistingBranches) {
      get().pushToast(message, 'error');
    }
  },
});
