import type { StateCreator } from 'zustand';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import type { DependencyEdge } from '../../types/commit';
import type { AppState } from '../appStore';

export interface DependencyGraphSlice {
  dependencyEdges: DependencyEdge[];
  isLoadingDependencies: boolean;
  dependenciesError: string | null;

  loadDependencies: () => void;
  handleDependenciesLoaded: (edges: DependencyEdge[]) => void;
  handleDependenciesLoadFailed: (message?: string) => void;
}

const demoDependencyEdges: DependencyEdge[] = [
  { from: 'tests/CommitList.test.tsx', to: 'src/components/CommitList/CommitList.tsx', kind: 'import' },
  { from: 'src/components/CommitList/CommitList.tsx', to: 'src/components/CommitList/CommitListItem.tsx', kind: 'import' },
  { from: 'src/components/CommitList/CommitList.tsx', to: 'src/components/CommitList/useInfiniteScroll.ts', kind: 'import' },
  { from: 'src/components/CommitList/CommitList.tsx', to: 'src/utils/pagination.ts', kind: 'import' },
  { from: 'src/components/CommitList/CommitListItem.tsx', to: 'src/types/commit.ts', kind: 'import' },
  { from: 'src/components/CommitFilter/CommitFilterPanel.tsx', to: 'src/types/commit.ts', kind: 'import' },
  { from: 'src/components/CommitList/useInfiniteScroll.ts', to: 'src/hooks/useIntersectionObserver.ts', kind: 'import' },
  { from: 'src/utils/pagination.ts', to: 'src/types/commit.ts', kind: 'require' },
];

export const createDependencyGraphSlice: StateCreator<AppState, [], [], DependencyGraphSlice> = (set, get) => ({
  dependencyEdges: [],
  isLoadingDependencies: false,
  dependenciesError: null,

  loadDependencies: () => {
    const state = get();

    if (state.changedFiles.length === 0 || state.isLoadingDependencies) {
      return;
    }

    set({
      isLoadingDependencies: true,
      dependenciesError: null,
    });

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        get().handleDependenciesLoaded(demoDependencyEdges);
      }, 260);
      return;
    }

    postMessage('ANALYZE_DEPENDENCIES', {
      filePaths: state.changedFiles.map((file) => file.path),
      commitHash: state.selectedCommit?.hash,
    });
  },

  handleDependenciesLoaded: (edges) => {
    set({
      dependencyEdges: edges,
      isLoadingDependencies: false,
      dependenciesError: null,
    });
  },

  handleDependenciesLoadFailed: (message = 'Failed to analyze dependencies') => {
    set({
      dependencyEdges: [],
      isLoadingDependencies: false,
      dependenciesError: message,
    });
  },
});
