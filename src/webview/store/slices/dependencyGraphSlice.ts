import type { StateCreator } from 'zustand';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import type { DependencyEdge } from '../../types/commit';
import type { AppState } from '../appStore';

export interface DependencyGraphStateEntry {
  commitHash: string | null;
  dependencyEdges: DependencyEdge[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
}

export interface DependencyGraphSlice {
  dependencyGraphsByPane: Record<string, DependencyGraphStateEntry>;

  loadDependencies: (input: { paneId: string; commitHash: string; filePaths: string[] }) => void;
  handleDependenciesLoaded: (payload: { paneId: string; edges: DependencyEdge[] }) => void;
  handleDependenciesLoadFailed: (payload: { paneId: string; message?: string }) => void;
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

export const EMPTY_DEPENDENCY_GRAPH_STATE: DependencyGraphStateEntry = {
  commitHash: null,
  dependencyEdges: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
};

function getEntry(state: AppState, paneId: string): DependencyGraphStateEntry {
  return state.dependencyGraphsByPane[paneId] ?? EMPTY_DEPENDENCY_GRAPH_STATE;
}

export const createDependencyGraphSlice: StateCreator<AppState, [], [], DependencyGraphSlice> = (set, get) => ({
  dependencyGraphsByPane: {},

  loadDependencies: ({ paneId, commitHash, filePaths }) => {
    const state = get();
    const entry = getEntry(state, paneId);

    if (filePaths.length === 0 || entry.isLoading) {
      return;
    }

    set((current) => ({
      dependencyGraphsByPane: {
        ...current.dependencyGraphsByPane,
        [paneId]: {
          ...getEntry(current, paneId),
          commitHash,
          isLoading: true,
          error: null,
        },
      },
    }));

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        get().handleDependenciesLoaded({ paneId, edges: demoDependencyEdges });
      }, 260);
      return;
    }

    postMessage('ANALYZE_DEPENDENCIES', {
      paneId,
      filePaths,
      commitHash,
    });
  },

  handleDependenciesLoaded: ({ paneId, edges }) => {
    set((state) => ({
      dependencyGraphsByPane: {
        ...state.dependencyGraphsByPane,
        [paneId]: {
          ...getEntry(state, paneId),
          dependencyEdges: edges,
          isLoading: false,
          error: null,
          hasLoaded: true,
        },
      },
    }));
  },

  handleDependenciesLoadFailed: ({ paneId, message = 'Failed to analyze dependencies' }) => {
    set((state) => ({
      dependencyGraphsByPane: {
        ...state.dependencyGraphsByPane,
        [paneId]: {
          ...getEntry(state, paneId),
          dependencyEdges: [],
          isLoading: false,
          error: message,
          hasLoaded: true,
        },
      },
    }));
  },
});
