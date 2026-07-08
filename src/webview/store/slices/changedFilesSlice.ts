import type { StateCreator } from 'zustand';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import type { ChangedFile } from '../../types/commit';
import type { AppState } from '../appStore';

export interface ChangedFilesSlice {
  changedFiles: ChangedFile[];
  hasSavedCommitSummary: boolean;
  selectedFile: ChangedFile | null;
  isLoadingChangedFiles: boolean;
  changedFilesError: string | null;
  hasLoadedChangedFiles: boolean;

  loadChangedFiles: () => void;
  handleChangedFilesLoaded: (payload: { files: ChangedFile[]; hasSavedCommitSummary?: boolean }) => void;
  handleChangedFilesLoadFailed: (message?: string) => void;
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

export const createChangedFilesSlice: StateCreator<AppState, [], [], ChangedFilesSlice> = (set, get) => ({
  changedFiles: [],
  hasSavedCommitSummary: false,
  selectedFile: null,
  isLoadingChangedFiles: false,
  changedFilesError: null,
  hasLoadedChangedFiles: false,

  loadChangedFiles: () => {
    const state = get();

    if (!state.selectedCommit || state.isLoadingChangedFiles) {
      return;
    }

    set({
      isLoadingChangedFiles: true,
      changedFilesError: null,
      hasLoadedChangedFiles: false,
    });

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        get().handleChangedFilesLoaded({
          files: demoChangedFiles,
          hasSavedCommitSummary: true,
        });
      }, 220);
      return;
    }

    postMessage('FETCH_CHANGED_FILES', {
      commitHash: state.selectedCommit.hash,
      commitMessage: state.selectedCommit.message,
      savePath: state.savePath,
    });
  },

  handleChangedFilesLoaded: ({ files, hasSavedCommitSummary = false }) => {
    set({
      changedFiles: files,
      hasSavedCommitSummary,
      isLoadingChangedFiles: false,
      changedFilesError: null,
      hasLoadedChangedFiles: true,
      dependencyEdges: [],
      dependenciesError: null,
      isLoadingDependencies: false,
    });
  },

  handleChangedFilesLoadFailed: (message = 'Failed to load changed file list') => {
    set({
      changedFiles: [],
      isLoadingChangedFiles: false,
      changedFilesError: message,
      hasLoadedChangedFiles: true,
      dependencyEdges: [],
      dependenciesError: null,
      isLoadingDependencies: false,
    });
  },
});
