import type { StateCreator } from 'zustand';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import type { ChangedFile, SymbolEdge, SymbolNode } from '../../types/commit';
import type { AppState } from '../appStore';

export interface SymbolGraphStateEntry {
  selectedFile: ChangedFile | null;
  symbolNodes: SymbolNode[];
  symbolEdges: SymbolEdge[];
  symbolFileContent: string | null;
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  isCodePanelOpen: boolean;
  activeSymbolNodeId: string | null;
  hoveredSymbolNodeId: string | null;
}

export interface SymbolGraphSlice {
  symbolGraphsByPane: Record<string, SymbolGraphStateEntry>;

  prepareSymbolGraphPane: (input: { paneId: string; selectedFile: ChangedFile | null }) => void;
  loadSymbolGraph: (input: { paneId: string; selectedFile: ChangedFile; commitHash: string }) => void;
  handleSymbolGraphLoaded: (payload: { paneId: string; nodes?: SymbolNode[]; edges?: SymbolEdge[]; fileContent?: string }) => void;
  handleSymbolGraphLoadFailed: (payload: { paneId: string; message?: string }) => void;
  openCodePanel: (paneId: string) => void;
  closeCodePanel: (paneId: string) => void;
  toggleCodePanel: (paneId: string) => void;
  setActiveSymbolNode: (paneId: string, nodeId: string | null) => void;
  setHoveredSymbolNode: (paneId: string, nodeId: string | null) => void;
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

const demoSymbolFileContent = `export function buildGraph(items: string[]): GraphState {
  const resolved = resolveNodes(items);
  return {
    nodes: resolved,
    limit: GRAPH_LIMIT,
  };
}

function resolveNodes(items: string[]): string[] {
  return items.filter((item) => item.length < GRAPH_LIMIT);
}

export interface GraphState {
  nodes: string[];
  limit: number;
}

export const GRAPH_LIMIT = 120;`;

export const EMPTY_SYMBOL_GRAPH_STATE: SymbolGraphStateEntry = {
  selectedFile: null,
  symbolNodes: [],
  symbolEdges: [],
  symbolFileContent: null,
  isLoading: false,
  hasLoaded: false,
  error: null,
  isCodePanelOpen: false,
  activeSymbolNodeId: null,
  hoveredSymbolNodeId: null,
};

function getEntry(state: AppState, paneId: string): SymbolGraphStateEntry {
  return state.symbolGraphsByPane[paneId] ?? EMPTY_SYMBOL_GRAPH_STATE;
}

export const createSymbolGraphSlice: StateCreator<AppState, [], [], SymbolGraphSlice> = (set, get) => ({
  symbolGraphsByPane: {},

  prepareSymbolGraphPane: ({ paneId, selectedFile }) => {
    set((state) => ({
      symbolGraphsByPane: {
        ...state.symbolGraphsByPane,
        [paneId]: {
          ...getEntry(state, paneId),
          selectedFile,
          symbolNodes: [],
          symbolEdges: [],
          symbolFileContent: null,
          isLoading: false,
          hasLoaded: false,
          error: null,
          isCodePanelOpen: false,
          activeSymbolNodeId: null,
          hoveredSymbolNodeId: null,
        },
      },
    }));
  },

  loadSymbolGraph: ({ paneId, selectedFile, commitHash }) => {
    const entry = getEntry(get(), paneId);
    if (entry.isLoading) {
      return;
    }

    set((state) => ({
      symbolGraphsByPane: {
        ...state.symbolGraphsByPane,
        [paneId]: {
          ...getEntry(state, paneId),
          selectedFile,
          symbolNodes: [],
          symbolEdges: [],
          symbolFileContent: null,
          isLoading: true,
          hasLoaded: false,
          error: null,
          isCodePanelOpen: false,
          activeSymbolNodeId: null,
          hoveredSymbolNodeId: null,
        },
      },
    }));

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        get().handleSymbolGraphLoaded({
          paneId,
          nodes: demoSymbolNodes,
          edges: demoSymbolEdges,
          fileContent: demoSymbolFileContent,
        });
      }, 220);
      return;
    }

    postMessage('ANALYZE_SYMBOL_GRAPH', {
      paneId,
      filePath: selectedFile.path,
      commitHash,
    });
  },

  handleSymbolGraphLoaded: ({ paneId, nodes, edges, fileContent }) => {
    set((state) => ({
      symbolGraphsByPane: {
        ...state.symbolGraphsByPane,
        [paneId]: {
          ...getEntry(state, paneId),
          symbolNodes: nodes ?? [],
          symbolEdges: edges ?? [],
          symbolFileContent: fileContent ?? '',
          isLoading: false,
          hasLoaded: true,
          error: null,
        },
      },
    }));
  },

  handleSymbolGraphLoadFailed: ({ paneId, message }) => {
    set((state) => ({
      symbolGraphsByPane: {
        ...state.symbolGraphsByPane,
        [paneId]: {
          ...getEntry(state, paneId),
          symbolNodes: [],
          symbolEdges: [],
          symbolFileContent: null,
          isLoading: false,
          hasLoaded: true,
          error: message ?? '심볼을 분석하지 못했습니다',
        },
      },
    }));
  },

  openCodePanel: (paneId) => set((state) => ({
    symbolGraphsByPane: {
      ...state.symbolGraphsByPane,
      [paneId]: {
        ...getEntry(state, paneId),
        isCodePanelOpen: true,
      },
    },
  })),

  closeCodePanel: (paneId) => set((state) => ({
    symbolGraphsByPane: {
      ...state.symbolGraphsByPane,
      [paneId]: {
        ...getEntry(state, paneId),
        isCodePanelOpen: false,
        activeSymbolNodeId: null,
        hoveredSymbolNodeId: null,
      },
    },
  })),

  toggleCodePanel: (paneId) => set((state) => ({
    symbolGraphsByPane: {
      ...state.symbolGraphsByPane,
      [paneId]: {
        ...getEntry(state, paneId),
        isCodePanelOpen: !getEntry(state, paneId).isCodePanelOpen,
      },
    },
  })),

  setActiveSymbolNode: (paneId, nodeId) => set((state) => ({
    symbolGraphsByPane: {
      ...state.symbolGraphsByPane,
      [paneId]: {
        ...getEntry(state, paneId),
        activeSymbolNodeId: nodeId,
      },
    },
  })),

  setHoveredSymbolNode: (paneId, nodeId) => set((state) => ({
    symbolGraphsByPane: {
      ...state.symbolGraphsByPane,
      [paneId]: {
        ...getEntry(state, paneId),
        hoveredSymbolNodeId: nodeId,
      },
    },
  })),
});
