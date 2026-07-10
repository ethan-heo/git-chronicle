import type { StateCreator } from 'zustand';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import type { ChangedFile, SymbolEdge, SymbolNode } from '../../types/commit';
import type { AppState } from '../appStore';

export interface SymbolGraphStateEntry {
  selectedFile: ChangedFile | null;
  symbolNodes: SymbolNode[];
  symbolEdges: SymbolEdge[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  activeSymbolNodeId: string | null;
  hoveredSymbolNodeId: string | null;
}

export interface SymbolGraphSlice {
  symbolGraphsByTab: Record<string, SymbolGraphStateEntry>;

  prepareSymbolGraphTab: (input: { tabId: string; selectedFile: ChangedFile | null }) => void;
  loadSymbolGraph: (input: { tabId: string; selectedFile: ChangedFile; commitHash: string }) => void;
  handleSymbolGraphLoaded: (payload: { tabId: string; nodes?: SymbolNode[]; edges?: SymbolEdge[] }) => void;
  handleSymbolGraphLoadFailed: (payload: { tabId: string; message?: string }) => void;
  setActiveSymbolNode: (tabId: string, nodeId: string | null) => void;
  setHoveredSymbolNode: (tabId: string, nodeId: string | null) => void;
}

const demoSymbolNodes: SymbolNode[] = [
  { id: 'import:filter:1', name: 'filter', kind: 'variable', lineStart: 1, lineEnd: 1, isExported: false, nodeCategory: 'import', modulePath: './array', importKind: 'named' },
  { id: 'buildGraph:3', name: 'buildGraph', kind: 'function', lineStart: 3, lineEnd: 28, isExported: true, nodeCategory: 'local' },
  { id: 'resolveNodes:30', name: 'resolveNodes', kind: 'function', lineStart: 30, lineEnd: 56, isExported: false, nodeCategory: 'local' },
  { id: 'GraphState:58', name: 'GraphState', kind: 'interface', lineStart: 58, lineEnd: 64, isExported: true, nodeCategory: 'local' },
  { id: 'GRAPH_LIMIT:66', name: 'GRAPH_LIMIT', kind: 'constant', lineStart: 66, lineEnd: 66, isExported: true, nodeCategory: 'local' },
];

const demoSymbolEdges: SymbolEdge[] = [
  { from: 'buildGraph:3', to: 'import:filter:1', kind: 'calls' },
  { from: 'buildGraph:3', to: 'resolveNodes:30', kind: 'calls' },
  { from: 'buildGraph:3', to: 'GraphState:58', kind: 'uses' },
  { from: 'resolveNodes:30', to: 'GRAPH_LIMIT:66', kind: 'uses' },
];

export const EMPTY_SYMBOL_GRAPH_STATE: SymbolGraphStateEntry = {
  selectedFile: null,
  symbolNodes: [],
  symbolEdges: [],
  isLoading: false,
  hasLoaded: false,
  error: null,
  activeSymbolNodeId: null,
  hoveredSymbolNodeId: null,
};

function getEntry(state: AppState, tabId: string): SymbolGraphStateEntry {
  return state.symbolGraphsByTab[tabId] ?? EMPTY_SYMBOL_GRAPH_STATE;
}

export const createSymbolGraphSlice: StateCreator<AppState, [], [], SymbolGraphSlice> = (set, get) => ({
  symbolGraphsByTab: {},

  prepareSymbolGraphTab: ({ tabId, selectedFile }) => {
    set((state) => ({
      symbolGraphsByTab: {
        ...state.symbolGraphsByTab,
        [tabId]: {
          ...getEntry(state, tabId),
          selectedFile,
          symbolNodes: [],
          symbolEdges: [],
          isLoading: false,
          hasLoaded: false,
          error: null,
          activeSymbolNodeId: null,
          hoveredSymbolNodeId: null,
        },
      },
    }));
  },

  loadSymbolGraph: ({ tabId, selectedFile, commitHash }) => {
    const entry = getEntry(get(), tabId);
    if (entry.isLoading) {
      return;
    }

    set((state) => ({
      symbolGraphsByTab: {
        ...state.symbolGraphsByTab,
        [tabId]: {
          ...getEntry(state, tabId),
          selectedFile,
          symbolNodes: [],
          symbolEdges: [],
          isLoading: true,
          hasLoaded: false,
          error: null,
          activeSymbolNodeId: null,
          hoveredSymbolNodeId: null,
        },
      },
    }));

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        get().handleSymbolGraphLoaded({
          tabId,
          nodes: demoSymbolNodes,
          edges: demoSymbolEdges,
        });
      }, 220);
      return;
    }

    postMessage('ANALYZE_SYMBOL_GRAPH', {
      tabId,
      filePath: selectedFile.path,
      commitHash,
    });
  },

  handleSymbolGraphLoaded: ({ tabId, nodes, edges }) => {
    set((state) => ({
      symbolGraphsByTab: {
        ...state.symbolGraphsByTab,
        [tabId]: {
          ...getEntry(state, tabId),
          symbolNodes: nodes ?? [],
          symbolEdges: edges ?? [],
          isLoading: false,
          hasLoaded: true,
          error: null,
        },
      },
    }));
  },

  handleSymbolGraphLoadFailed: ({ tabId, message }) => {
    set((state) => ({
      symbolGraphsByTab: {
        ...state.symbolGraphsByTab,
        [tabId]: {
          ...getEntry(state, tabId),
          symbolNodes: [],
          symbolEdges: [],
          isLoading: false,
          hasLoaded: true,
          error: message ?? '심볼을 분석하지 못했습니다',
        },
      },
    }));
  },

  setActiveSymbolNode: (tabId, nodeId) => set((state) => ({
    symbolGraphsByTab: {
      ...state.symbolGraphsByTab,
      [tabId]: {
        ...getEntry(state, tabId),
        activeSymbolNodeId: nodeId,
      },
    },
  })),

  setHoveredSymbolNode: (tabId, nodeId) => set((state) => ({
    symbolGraphsByTab: {
      ...state.symbolGraphsByTab,
      [tabId]: {
        ...getEntry(state, tabId),
        hoveredSymbolNodeId: nodeId,
      },
    },
  })),
});
