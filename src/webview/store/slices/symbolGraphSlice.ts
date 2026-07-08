import type { StateCreator } from 'zustand';
import { isVSCodeRuntime, postMessage } from '../../bridge/vscodeApi';
import type { ChangedFile, SymbolEdge, SymbolNode } from '../../types/commit';
import type { AppState } from '../appStore';

export interface SymbolGraphSlice {
  selectedFileForSymbolGraph: ChangedFile | null;
  symbolNodes: SymbolNode[];
  symbolEdges: SymbolEdge[];
  symbolFileContent: string | null;
  isLoadingSymbolGraph: boolean;
  hasLoadedSymbolGraph: boolean;
  symbolGraphError: string | null;
  isCodePanelOpen: boolean;
  activeSymbolNodeId: string | null;
  hoveredSymbolNodeId: string | null;

  loadSymbolGraph: () => void;
  handleSymbolGraphLoaded: (payload: { nodes?: SymbolNode[]; edges?: SymbolEdge[]; fileContent?: string }) => void;
  handleSymbolGraphLoadFailed: (message?: string) => void;
  openCodePanel: () => void;
  closeCodePanel: () => void;
  toggleCodePanel: () => void;
  setActiveSymbolNode: (nodeId: string | null) => void;
  setHoveredSymbolNode: (nodeId: string | null) => void;
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

export const createSymbolGraphSlice: StateCreator<AppState, [], [], SymbolGraphSlice> = (set, get) => ({
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

  loadSymbolGraph: () => {
    const state = get();
    if (!state.selectedFileForSymbolGraph || state.isLoadingSymbolGraph) {
      return;
    }

    set({
      isLoadingSymbolGraph: true,
      hasLoadedSymbolGraph: false,
      symbolGraphError: null,
      symbolNodes: [],
      symbolEdges: [],
      symbolFileContent: null,
      isCodePanelOpen: false,
      activeSymbolNodeId: null,
      hoveredSymbolNodeId: null,
    });

    if (!isVSCodeRuntime()) {
      window.setTimeout(() => {
        get().handleSymbolGraphLoaded({
          nodes: demoSymbolNodes,
          edges: demoSymbolEdges,
          fileContent: demoSymbolFileContent,
        });
      }, 220);
      return;
    }

    postMessage('ANALYZE_SYMBOL_GRAPH', {
      filePath: state.selectedFileForSymbolGraph.path,
      commitHash: state.selectedCommit?.hash,
    });
  },

  handleSymbolGraphLoaded: (payload) => {
    set({
      symbolNodes: payload.nodes ?? [],
      symbolEdges: payload.edges ?? [],
      symbolFileContent: payload.fileContent ?? '',
      isLoadingSymbolGraph: false,
      hasLoadedSymbolGraph: true,
      symbolGraphError: null,
    });
  },

  handleSymbolGraphLoadFailed: (message) => {
    set({
      symbolNodes: [],
      symbolEdges: [],
      symbolFileContent: null,
      isLoadingSymbolGraph: false,
      hasLoadedSymbolGraph: true,
      symbolGraphError: message ?? '심볼을 분석하지 못했습니다',
    });
  },

  openCodePanel: () => set({ isCodePanelOpen: true }),

  closeCodePanel: () =>
    set({
      isCodePanelOpen: false,
      activeSymbolNodeId: null,
      hoveredSymbolNodeId: null,
    }),

  toggleCodePanel: () => set((state) => ({ isCodePanelOpen: !state.isCodePanelOpen })),

  setActiveSymbolNode: (nodeId) => set({ activeSymbolNodeId: nodeId }),

  setHoveredSymbolNode: (nodeId) => set({ hoveredSymbolNodeId: nodeId }),
});
