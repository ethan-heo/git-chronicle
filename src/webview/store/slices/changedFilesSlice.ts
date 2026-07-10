import type { StateCreator } from 'zustand';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import type { ChangedFile, Commit } from '../../types/commit';
import type { AppState } from '../appStore';

export interface ChangedFilesStateEntry {
  changedFiles: ChangedFile[];
  hasSavedCommitSummary: boolean;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
}

export interface ChangedFilesSlice {
  changedFilesByCommit: Record<string, ChangedFilesStateEntry>;

  loadChangedFiles: (input: { commit: Commit }) => void;
  handleChangedFilesLoaded: (payload: { commitHash: string; files: ChangedFile[]; hasSavedCommitSummary?: boolean }) => void;
  handleChangedFilesLoadFailed: (payload: { commitHash: string; message?: string }) => void;
}

const demoChangedFiles: ChangedFile[] = [
  { path: 'src/components/CommitList/CommitList.tsx', status: 'M' },
  { path: 'src/components/CommitList/CommitListItem.tsx', status: 'M' },
  { path: 'src/components/CommitList/useInfiniteScroll.ts', status: 'A' },
  { path: 'src/components/CommitFilter/CommitFilterPanel.tsx', status: 'M' },
  { path: 'src/hooks/useIntersectionObserver.ts', status: 'A' },
  { path: 'src/hooks/useScrollTrigger.ts', status: 'D' },
  { path: 'src/utils/pagination.ts', status: 'M' },
  { path: 'src/types/commit.ts', oldPath: 'src/types/git.ts', status: 'R' },
  { path: 'tests/CommitList.test.tsx', status: 'M' },
  { path: 'docs/F01_blueprint.md', status: 'M' },
];

export const EMPTY_CHANGED_FILES_STATE: ChangedFilesStateEntry = {
  changedFiles: [],
  hasSavedCommitSummary: false,
  isLoading: false,
  error: null,
  hasLoaded: false,
};

function getEntry(state: AppState, commitHash: string): ChangedFilesStateEntry {
  return state.changedFilesByCommit[commitHash] ?? EMPTY_CHANGED_FILES_STATE;
}

export const createChangedFilesSlice: StateCreator<AppState, [], [], ChangedFilesSlice> = (set, get) => ({
  changedFilesByCommit: {},

  loadChangedFiles: ({ commit }) => {
    const state = get();
    const entry = getEntry(state, commit.hash);

    if (entry.isLoading) {
      return;
    }

    if (entry.hasLoaded && !entry.error) {
      return;
    }

    set((current) => ({
      changedFilesByCommit: {
        ...current.changedFilesByCommit,
        [commit.hash]: {
          ...getEntry(current, commit.hash),
          isLoading: true,
          error: null,
          hasLoaded: false,
        },
      },
    }));

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        get().handleChangedFilesLoaded({
          commitHash: commit.hash,
          files: demoChangedFiles,
          hasSavedCommitSummary: true,
        });
      }, 220);
      return;
    }

    postMessage('FETCH_CHANGED_FILES', {
      commitHash: commit.hash,
      commitMessage: commit.message,
      savePath: state.savePath,
    });
  },

  handleChangedFilesLoaded: ({ commitHash, files, hasSavedCommitSummary = false }) => {
    set((state) => ({
      changedFilesByCommit: {
        ...state.changedFilesByCommit,
        [commitHash]: {
          changedFiles: files,
          hasSavedCommitSummary,
          isLoading: false,
          error: null,
          hasLoaded: true,
        },
      },
    }));
  },

  handleChangedFilesLoadFailed: ({ commitHash, message = 'Failed to load changed file list' }) => {
    set((state) => ({
      changedFilesByCommit: {
        ...state.changedFilesByCommit,
        [commitHash]: {
          changedFiles: [],
          hasSavedCommitSummary: false,
          isLoading: false,
          error: message,
          hasLoaded: true,
        },
      },
    }));
  },
});
