# Implementation Prompt: F10_IntraFileSymbolDependencyCanvas

> Claude Code 또는 Cursor에 직접 입력하여 구현을 생성하는 프롬프트

---

## Technical Context

- **심볼 분석**: Extension Host에서 파일 내용을 읽어(commitHash 있으면 `git show`, 없으면 디스크) TypeScript Compiler API 또는 정규식으로 최상위 노드 선언과 노드 간 참조 관계를 추출한다.
- **JS/TS 분석**: `typescript` 패키지(이미 devDependency)의 `ts.createSourceFile()`로 AST를 생성하고 최상위 선언을 순회한다. 선언 본문의 Identifier 참조를 분석하여 `calls` / `uses` / `extends` / `implements` 엣지를 생성한다.
- **Python/Go 분석**: 정규식으로 `def`/`class` (Python), `func`/`type`/`var`/`const` (Go) 선언과 참조를 파싱한다.
- **시각화**: Webview에서 `React Flow` (`@xyflow/react`) 사용. 엣지가 있으면 `@dagrejs/dagre` 기반 계층 레이아웃(`rankdir: 'LR'`), 없으면 kind 그룹 기반 앵커 배치.
- **재사용**: F04의 `CanvasControls`, `getNearestHandles`, `getNodeHeight`, `layoutWithDagre` 패턴을 참고·재사용한다.

---

## Files to Create / Modify

| 파일 | 변경 유형 | 역할 |
|------|-----------|------|
| `src/webview/types/commit.ts` | 수정 | `SymbolNode`, `SymbolEdge`, `SymbolKind`, `SymbolDependencyKind` 타입 추가, `ScreenID`에 `'S08'` 추가 |
| `src/extension/intraFileDependencyService.ts` | 신규 | JS/TS/Python/Go 파일 내 심볼 분석 |
| `src/extension/messageHandler.ts` | 수정 | `ANALYZE_SYMBOL_GRAPH` 메시지 핸들러 등록 |
| `src/webview/store/appStore.ts` | 수정 | 심볼 그래프 상태·액션·데모 데이터 추가 |
| `src/webview/shared/components/FileActionButtons.tsx` | 수정 | `onSymbolGraph` 옵셔널 prop 추가 |
| `src/webview/features/F04/graph.ts` | 수정 | `FileNodeData`에 `onSymbolGraph`, `isSymbolGraphSupported` 추가 |
| `src/webview/features/F04/FileNode.tsx` | 수정 | `onSymbolGraph` prop을 `FileActionButtons`에 전달 |
| `src/webview/features/F04/S05_DependencyCanvasScreen.tsx` | 수정 | `onSymbolGraph` 핸들러(`goToSymbolGraphView`) 연결 |
| `src/webview/features/F10/symbolGraph.ts` | 신규 | `buildSymbolGraphData`, Dagre/kind 그룹 레이아웃 계산 |
| `src/webview/features/F10/SymbolKindBadge.tsx` | 신규 | 노드 종류 배지 |
| `src/webview/features/F10/SymbolNode.tsx` | 신규 | React Flow 커스텀 노드 |
| `src/webview/features/F10/SymbolEdge.tsx` | 신규 | React Flow 커스텀 엣지 |
| `src/webview/features/F10/SymbolLegendPanel.tsx` | 신규 | 접기/펼치기 가능한 범례 패널 |
| `src/webview/features/F10/SymbolGraph.tsx` | 신규 | React Flow 캔버스 컨테이너 및 범례 토글 상태 관리 |
| `src/webview/features/F10/S08_IntraFileSymbolDependencyCanvasScreen.tsx` | 신규 | S08 화면 조합 컴포넌트 |
| `src/webview/features/F10/index.ts` | 신규 | 공개 export |
| `src/webview/App.tsx` | 수정 | S08 라우트 + 메시지 핸들러 추가 |
| `tests/unit/intraFileDependencyService.test.ts` | 신규 | 심볼 분석 유닛 테스트 |
| `tests/unit/symbolGraph.test.ts` | 신규 | 그래프 레이아웃 유닛 테스트 |

---

## TypeScript Interfaces

```typescript
// src/webview/types/commit.ts에 추가

export type SymbolKind =
  | 'function'
  | 'class'
  | 'interface'
  | 'type'
  | 'variable'
  | 'constant'
  | 'enum';

export type SymbolDependencyKind = 'calls' | 'uses' | 'extends' | 'implements';

export interface SymbolNode {
  id: string;           // "노드명:라인번호" (예: "parseDate:12")
  name: string;
  kind: SymbolKind;
  lineStart: number;
  lineEnd: number;
  isExported: boolean;
}

export interface SymbolEdge {
  from: string;   // SymbolNode.id
  to: string;     // SymbolNode.id
  kind: SymbolDependencyKind;
}

// ScreenID 수정
export type ScreenID = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07' | 'S08';
```

---

## Extension Host Implementation

### `src/extension/intraFileDependencyService.ts`

```typescript
import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { fetchFileContentAtCommit } from './gitService';
import type { SymbolNode, SymbolEdge, SymbolKind, SymbolDependencyKind } from '../webview/types/commit';

const SUPPORTED_FILE_PATTERN = /\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx|py|go)$/i;
const JS_TS_PATTERN = /\.(?:mjs|cjs|js|jsx|mts|cts|ts|tsx)$/i;
const PYTHON_PATTERN = /\.py$/i;
const GO_PATTERN = /\.go$/i;

export async function analyzeSymbols(
  repoPath: string,
  filePath: string,
  commitHash: string,
): Promise<{ nodes: SymbolNode[]; edges: SymbolEdge[] }> {
  if (!SUPPORTED_FILE_PATTERN.test(filePath)) {
    return { nodes: [], edges: [] };
  }

  let content: string | null = null;
  if (commitHash) {
    content = await fetchFileContentAtCommit(repoPath, commitHash, filePath);
  }
  if (content === null) {
    const absolutePath = path.resolve(repoPath, filePath);
    content = await fs.promises.readFile(absolutePath, 'utf8');
  }

  if (JS_TS_PATTERN.test(filePath)) {
    return analyzeJsTsSymbols(content, filePath);
  }
  if (PYTHON_PATTERN.test(filePath)) {
    return analyzePythonSymbols(content);
  }
  if (GO_PATTERN.test(filePath)) {
    return analyzeGoSymbols(content);
  }

  return { nodes: [], edges: [] };
}

function analyzeJsTsSymbols(content: string, filePath: string): { nodes: SymbolNode[]; edges: SymbolEdge[] } {
  const scriptKind = /\.tsx?$/i.test(filePath) ? ts.ScriptKind.TS : ts.ScriptKind.JS;
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, scriptKind);
  const nodes: SymbolNode[] = [];
  const symbolById = new Map<string, SymbolNode>();

  // 최상위 선언 순회하여 SymbolNode 추출
  ts.forEachChild(sourceFile, (node) => {
    const symbol = extractTopLevelSymbol(node, content, sourceFile);
    if (symbol) {
      nodes.push(symbol);
      symbolById.set(symbol.name, symbol);
    }
  });

  // 선언 본문에서 Identifier 참조 분석하여 SymbolEdge 추출
  const edges: SymbolEdge[] = [];
  ts.forEachChild(sourceFile, (node) => {
    const fromSymbol = extractTopLevelSymbol(node, content, sourceFile);
    if (!fromSymbol) return;
    collectEdges(node, fromSymbol, symbolById, edges, sourceFile);
  });

  return { nodes, edges: deduplicateEdges(edges) };
}

function extractTopLevelSymbol(node: ts.Node, _content: string, sourceFile: ts.SourceFile): SymbolNode | null {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
  const lineStart = start.line + 1;
  const lineEnd = end.line + 1;
  const isExported = hasExportModifier(node);

  if (ts.isFunctionDeclaration(node) && node.name) {
    const name = node.name.text;
    return { id: `${name}:${lineStart}`, name, kind: 'function', lineStart, lineEnd, isExported };
  }
  if (ts.isClassDeclaration(node) && node.name) {
    const name = node.name.text;
    return { id: `${name}:${lineStart}`, name, kind: 'class', lineStart, lineEnd, isExported };
  }
  if (ts.isInterfaceDeclaration(node)) {
    const name = node.name.text;
    return { id: `${name}:${lineStart}`, name, kind: 'interface', lineStart, lineEnd, isExported };
  }
  if (ts.isTypeAliasDeclaration(node)) {
    const name = node.name.text;
    return { id: `${name}:${lineStart}`, name, kind: 'type', lineStart, lineEnd, isExported };
  }
  if (ts.isEnumDeclaration(node)) {
    const name = node.name.text;
    return { id: `${name}:${lineStart}`, name, kind: 'enum', lineStart, lineEnd, isExported };
  }
  if (ts.isVariableStatement(node)) {
    const decl = node.declarationList.declarations[0];
    if (decl && ts.isIdentifier(decl.name)) {
      const name = decl.name.text;
      const isConst = (node.declarationList.flags & ts.NodeFlags.Const) !== 0;
      const kind: SymbolKind = isConst ? 'constant' : 'variable';
      return { id: `${name}:${lineStart}`, name, kind, lineStart, lineEnd, isExported };
    }
  }
  return null;
}

function hasExportModifier(node: ts.Node): boolean {
  return ts.canHaveModifiers(node)
    ? (ts.getModifiers(node) ?? []).some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
    : false;
}

function collectEdges(
  node: ts.Node,
  fromSymbol: SymbolNode,
  symbolById: Map<string, SymbolNode>,
  edges: SymbolEdge[],
  sourceFile: ts.SourceFile,
): void {
  // extends / implements 처리 (ClassDeclaration)
  if (ts.isClassDeclaration(node)) {
    node.heritageClauses?.forEach((clause) => {
      const kind: SymbolDependencyKind = clause.token === ts.SyntaxKind.ExtendsKeyword ? 'extends' : 'implements';
      clause.types.forEach((typeExpr) => {
        if (ts.isIdentifier(typeExpr.expression)) {
          const toSymbol = symbolById.get(typeExpr.expression.text);
          if (toSymbol && toSymbol.id !== fromSymbol.id) {
            edges.push({ from: fromSymbol.id, to: toSymbol.id, kind });
          }
        }
      });
    });
  }

  // 본문 내 Identifier 참조 분석
  const visited = new Set<ts.Node>();
  function visit(child: ts.Node): void {
    if (visited.has(child)) return;
    visited.add(child);

    if (ts.isIdentifier(child)) {
      const toSymbol = symbolById.get(child.text);
      if (toSymbol && toSymbol.id !== fromSymbol.id) {
        const parent = child.parent;
        const edgeKind: SymbolDependencyKind =
          parent && (ts.isCallExpression(parent) || ts.isNewExpression(parent)) && parent.expression === child
            ? 'calls'
            : 'uses';
        edges.push({ from: fromSymbol.id, to: toSymbol.id, kind: edgeKind });
      }
    }
    ts.forEachChild(child, visit);
  }

  ts.forEachChild(node, visit);
}

function deduplicateEdges(edges: SymbolEdge[]): SymbolEdge[] {
  const seen = new Set<string>();
  return edges.filter((edge) => {
    const key = `${edge.from}→${edge.to}:${edge.kind}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function analyzePythonSymbols(content: string): { nodes: SymbolNode[]; edges: SymbolEdge[] } {
  const lines = content.split('\n');
  const nodes: SymbolNode[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const funcMatch = /^(def)\s+(\w+)\s*\(/.exec(line);
    const classMatch = /^(class)\s+(\w+)/.exec(line);

    if (funcMatch) {
      const name = funcMatch[2];
      nodes.push({ id: `${name}:${lineNum}`, name, kind: 'function', lineStart: lineNum, lineEnd: lineNum, isExported: true });
    } else if (classMatch) {
      const name = classMatch[2];
      nodes.push({ id: `${name}:${lineNum}`, name, kind: 'class', lineStart: lineNum, lineEnd: lineNum, isExported: true });
    }
  });

  const edges = extractSimpleReferenceEdges(lines, nodes);
  return { nodes, edges };
}

function analyzeGoSymbols(content: string): { nodes: SymbolNode[]; edges: SymbolEdge[] } {
  const lines = content.split('\n');
  const nodes: SymbolNode[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const funcMatch = /^func\s+(?:\(\w+\s+\*?\w+\)\s+)?(\w+)\s*\(/.exec(line);
    const typeMatch = /^type\s+(\w+)\s+(struct|interface)/.exec(line);
    const constMatch = /^const\s+(\w+)/.exec(line);
    const varMatch = /^var\s+(\w+)/.exec(line);

    if (funcMatch) {
      const name = funcMatch[1];
      nodes.push({ id: `${name}:${lineNum}`, name, kind: 'function', lineStart: lineNum, lineEnd: lineNum, isExported: /^[A-Z]/.test(name) });
    } else if (typeMatch) {
      const name = typeMatch[1];
      const kind: SymbolKind = typeMatch[2] === 'interface' ? 'interface' : 'class';
      nodes.push({ id: `${name}:${lineNum}`, name, kind, lineStart: lineNum, lineEnd: lineNum, isExported: /^[A-Z]/.test(name) });
    } else if (constMatch) {
      const name = constMatch[1];
      nodes.push({ id: `${name}:${lineNum}`, name, kind: 'constant', lineStart: lineNum, lineEnd: lineNum, isExported: /^[A-Z]/.test(name) });
    } else if (varMatch) {
      const name = varMatch[1];
      nodes.push({ id: `${name}:${lineNum}`, name, kind: 'variable', lineStart: lineNum, lineEnd: lineNum, isExported: /^[A-Z]/.test(name) });
    }
  });

  const edges = extractSimpleReferenceEdges(lines, nodes);
  return { nodes, edges };
}

function extractSimpleReferenceEdges(lines: string[], nodes: SymbolNode[]): SymbolEdge[] {
  const symbolNames = new Map(nodes.map((n) => [n.name, n]));
  const edges: SymbolEdge[] = [];

  nodes.forEach((fromNode) => {
    const bodyLines = lines.slice(fromNode.lineStart, fromNode.lineEnd);
    symbolNames.forEach((toNode) => {
      if (toNode.id === fromNode.id) return;
      const pattern = new RegExp(`\\b${toNode.name}\\b`);
      if (bodyLines.some((line) => pattern.test(line))) {
        edges.push({ from: fromNode.id, to: toNode.id, kind: 'uses' });
      }
    });
  });

  return edges;
}
```

### `src/extension/messageHandler.ts` 수정

```typescript
import { analyzeSymbols } from './intraFileDependencyService';

// 기존 switch 문에 추가
case 'ANALYZE_SYMBOL_GRAPH': {
  const { filePath, commitHash } = message.payload as { filePath: string; commitHash: string };
  try {
    const { nodes, edges } = await analyzeSymbols(repoPath, filePath, commitHash);
    panel.webview.postMessage({ type: 'SYMBOL_GRAPH_LOADED', payload: { nodes, edges } });
  } catch (error) {
    panel.webview.postMessage({
      type: 'SYMBOL_GRAPH_FAILED',
      payload: { message: error instanceof Error ? error.message : 'Unknown error' },
    });
  }
  break;
}
```

---

## appStore 변경

### 상태 필드 추가 (AppState interface)

```typescript
selectedFileForSymbolGraph: ChangedFile | null;
symbolNodes: SymbolNode[];
symbolEdges: SymbolEdge[];
isLoadingSymbolGraph: boolean;
symbolGraphError: string | null;
```

### 액션 추가

```typescript
goToSymbolGraphView: (file: ChangedFile) => void;
loadSymbolGraph: () => void;
handleSymbolGraphLoaded: (nodes: SymbolNode[], edges: SymbolEdge[]) => void;
handleSymbolGraphLoadFailed: (message?: string) => void;
```

### 액션 구현

```typescript
goToSymbolGraphView: (file) => {
  const state = get();
  set({
    selectedFileForSymbolGraph: file,
    symbolNodes: [],
    symbolEdges: [],
    isLoadingSymbolGraph: false,
    symbolGraphError: null,
    previousScreen: state.currentScreen,
    currentScreen: 'S08',
    transitionDirection: 'forward',
  });
},

loadSymbolGraph: () => {
  const state = get();
  if (!state.selectedFileForSymbolGraph || state.isLoadingSymbolGraph) return;

  set({ isLoadingSymbolGraph: true, symbolGraphError: null });

  if (!isVSCodeRuntime()) {
    window.setTimeout(() => {
      get().handleSymbolGraphLoaded(demoSymbolNodes, demoSymbolEdges);
    }, 260);
    return;
  }

  postMessage('ANALYZE_SYMBOL_GRAPH', {
    filePath: state.selectedFileForSymbolGraph.path,
    commitHash: state.selectedCommit?.hash ?? '',
  });
},

handleSymbolGraphLoaded: (nodes, edges) => {
  set({ symbolNodes: nodes, symbolEdges: edges, isLoadingSymbolGraph: false, symbolGraphError: null });
},

handleSymbolGraphLoadFailed: (message = 'Failed to analyze symbols') => {
  set({ symbolNodes: [], symbolEdges: [], isLoadingSymbolGraph: false, symbolGraphError: message });
},
```

### 초기값 추가

```typescript
selectedFileForSymbolGraph: null,
symbolNodes: [],
symbolEdges: [],
isLoadingSymbolGraph: false,
symbolGraphError: null,
```

### 데모 데이터 추가

```typescript
const demoSymbolNodes: SymbolNode[] = [
  { id: 'IDateRange:1', name: 'IDateRange', kind: 'interface', lineStart: 1, lineEnd: 4, isExported: false },
  { id: 'DEFAULT_FORMAT:6', name: 'DEFAULT_FORMAT', kind: 'constant', lineStart: 6, lineEnd: 6, isExported: false },
  { id: 'parseDate:8', name: 'parseDate', kind: 'function', lineStart: 8, lineEnd: 18, isExported: true },
  { id: 'formatDate:20', name: 'formatDate', kind: 'function', lineStart: 20, lineEnd: 28, isExported: true },
  { id: 'DateUtils:30', name: 'DateUtils', kind: 'class', lineStart: 30, lineEnd: 55, isExported: true },
  { id: 'DateRange:57', name: 'DateRange', kind: 'class', lineStart: 57, lineEnd: 72, isExported: true },
];

const demoSymbolEdges: SymbolEdge[] = [
  { from: 'formatDate:20', to: 'parseDate:8', kind: 'calls' },
  { from: 'formatDate:20', to: 'DEFAULT_FORMAT:6', kind: 'uses' },
  { from: 'DateUtils:30', to: 'parseDate:8', kind: 'calls' },
  { from: 'DateUtils:30', to: 'formatDate:20', kind: 'calls' },
  { from: 'DateRange:57', to: 'IDateRange:1', kind: 'implements' },
  { from: 'DateRange:57', to: 'DateUtils:30', kind: 'uses' },
];
```

---

## Webview Implementation

### `src/webview/features/F10/symbolGraph.ts`

F04의 `graph.ts`를 참고하여 심볼 전용 버전으로 작성.

```typescript
import type { Edge, Node } from '@xyflow/react';
import { graphlib, layout as layoutGraph } from '@dagrejs/dagre';
import type { SymbolNode, SymbolEdge, SymbolDependencyKind } from '../../types/commit';

export interface SymbolNodeData extends Record<string, unknown> {
  symbolNode: SymbolNode;
  label: string;
  lineRange: string;
}
export type SymbolNodeType = Node<SymbolNodeData, 'symbolNode'>;

export interface SymbolEdgeData extends Record<string, unknown> {
  kind: SymbolDependencyKind;
  highlighted: boolean;
  dimmed: boolean;
}
export type SymbolEdgeType = Edge<SymbolEdgeData, 'symbolEdge'>;

export function buildSymbolGraphData(
  nodes: SymbolNode[],
  edges: SymbolEdge[],
): { nodes: SymbolNodeType[]; edges: SymbolEdgeType[] } {
  const nodeIdSet = new Set(nodes.map((n) => n.id));
  const validEdges = edges.filter((e) => nodeIdSet.has(e.from) && nodeIdSet.has(e.to));
  const positions = layoutSymbols(nodes, validEdges);

  return {
    nodes: nodes.map((symbol) => ({
      id: symbol.id,
      type: 'symbolNode',
      position: positions.get(symbol.id) ?? { x: 0, y: 0 },
      style: { width: getSymbolNodeWidth(symbol.name) },
      data: {
        symbolNode: symbol,
        label: symbol.name,
        lineRange: `L${symbol.lineStart}${symbol.lineEnd !== symbol.lineStart ? `–${symbol.lineEnd}` : ''}`,
      },
    })),
    edges: validEdges.map((edge, index) => ({
      id: `symbol-${index}-${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      type: 'symbolEdge',
      animated: false,
      data: { kind: edge.kind, highlighted: false, dimmed: false },
    })),
  };
}

function getSymbolNodeWidth(name: string): number {
  return Math.max(180, Math.min(400, name.length * 9 + 80));
}

function layoutSymbols(nodes: SymbolNode[], edges: SymbolEdge[]): Map<string, { x: number; y: number }> {
  if (nodes.length === 0) return new Map();
  if (edges.length === 0) return layoutByKindGroup(nodes);
  return layoutWithDagre(nodes, edges);
}

function layoutWithDagre(nodes: SymbolNode[], edges: SymbolEdge[]): Map<string, { x: number; y: number }> {
  const graph = new graphlib.Graph();
  graph.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 140, marginx: 40, marginy: 40 });
  graph.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    graph.setNode(node.id, { width: getSymbolNodeWidth(node.name), height: 56 });
  }
  for (const edge of edges) {
    if (graph.hasNode(edge.from) && graph.hasNode(edge.to)) {
      graph.setEdge(edge.from, edge.to);
    }
  }
  layoutGraph(graph);

  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    const n = graph.node(node.id) as { x?: number; y?: number } | undefined;
    if (n?.x !== undefined && n?.y !== undefined) {
      positions.set(node.id, { x: n.x - getSymbolNodeWidth(node.name) / 2, y: n.y - 28 });
    }
  }
  return normalizePositions(positions);
}

function layoutByKindGroup(nodes: SymbolNode[]): Map<string, { x: number; y: number }> {
  const ORDER: SymbolNode['kind'][] = ['class', 'interface', 'function', 'type', 'constant', 'variable', 'enum'];
  const groups = new Map<string, SymbolNode[]>();
  for (const node of nodes) {
    const group = groups.get(node.kind) ?? [];
    group.push(node);
    groups.set(node.kind, group);
  }

  const positions = new Map<string, { x: number; y: number }>();
  let groupX = 100;
  for (const kind of ORDER) {
    const group = groups.get(kind);
    if (!group) continue;
    let groupY = 100;
    for (const node of group) {
      positions.set(node.id, { x: groupX, y: groupY });
      groupY += 90;
    }
    groupX += 220;
  }
  return positions;
}

function normalizePositions(positions: Map<string, { x: number; y: number }>): Map<string, { x: number; y: number }> {
  if (positions.size === 0) return positions;
  const minX = Math.min(...[...positions.values()].map((p) => p.x));
  const minY = Math.min(...[...positions.values()].map((p) => p.y));
  const margin = 100;
  return new Map([...positions.entries()].map(([id, pos]) => [id, { x: pos.x - minX + margin, y: pos.y - minY + margin }]));
}
```

### `src/webview/features/F10/SymbolNode.tsx`

```tsx
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FC } from 'react';
import { SymbolKindBadge } from './SymbolKindBadge';
import type { SymbolNodeType } from './symbolGraph';

const handlePositions = [
  { face: 'top', position: Position.Top },
  { face: 'right', position: Position.Right },
  { face: 'bottom', position: Position.Bottom },
  { face: 'left', position: Position.Left },
] as const;

export const SymbolNode: FC<NodeProps<SymbolNodeType>> = ({ data, selected }) => (
  <div
    className={['symbol-node', selected ? 'symbol-node--selected' : ''].filter(Boolean).join(' ')}
    role="button"
    aria-label={`${data.label} (${data.symbolNode.kind}) 노드`}
    tabIndex={0}
  >
    {handlePositions.map(({ face, position }) => (
      <Handle key={`target-${face}`} id={`target-${face}`} className="symbol-node-handle" type="target" position={position} />
    ))}
    <div className="symbol-node-main">
      <SymbolKindBadge kind={data.symbolNode.kind} />
      <span className="symbol-node-name">{data.label}</span>
      {data.symbolNode.isExported && <span className="symbol-node-export-indicator" title="exported" aria-hidden="true">↑</span>}
    </div>
    <span className="symbol-node-line-range">{data.lineRange}</span>
    {handlePositions.map(({ face, position }) => (
      <Handle key={`source-${face}`} id={`source-${face}`} className="symbol-node-handle" type="source" position={position} />
    ))}
  </div>
);
```

### `src/webview/features/F10/SymbolEdge.tsx`

F04 `DependencyEdge.tsx`와 동일한 구조로 작성. `kind`에 따라 `strokeDasharray`와 `strokeWidth`를 다르게 적용.

### `src/webview/features/F10/SymbolGraph.tsx`

F04 `DependencyGraph.tsx`와 동일한 React Flow 설정. `nodeTypes = { symbolNode: SymbolNode }`, `edgeTypes = { symbolEdge: SymbolEdge }`.

### `src/webview/features/F10/S08_IntraFileSymbolDependencyCanvasScreen.tsx`

```tsx
import { useEffect } from 'react';
import { useAppStore } from '../../store/appStore';
import { TopHeader, BackButton } from '../../shared/components';
import { SymbolGraph } from './SymbolGraph';
import { SymbolLegendPanel } from './SymbolLegendPanel';
import { CanvasControls } from '../F04/CanvasControls';

export const S08IntraFileDependencyCanvasScreen: React.FC = () => {
  const selectedFile = useAppStore((s) => s.selectedFileForSymbolGraph);
  const symbolNodes = useAppStore((s) => s.symbolNodes);
  const symbolEdges = useAppStore((s) => s.symbolEdges);
  const isLoading = useAppStore((s) => s.isLoadingSymbolGraph);
  const error = useAppStore((s) => s.symbolGraphError);
  const loadSymbolGraph = useAppStore((s) => s.loadSymbolGraph);
  const goBackFromDetail = useAppStore((s) => s.goBackFromDetail);

  useEffect(() => {
    loadSymbolGraph();
  }, [loadSymbolGraph]);

  const title = selectedFile?.path ?? '';

  return (
    <div className="screen">
      <TopHeader title={title} leftSlot={<BackButton onClick={goBackFromDetail} />} />
      <div className="canvas-screen-body">
        <SymbolGraph
          symbolNodes={symbolNodes}
          symbolEdges={symbolEdges}
          isLoading={isLoading}
          error={error}
          onRetry={loadSymbolGraph}
        />
        <SymbolLegendPanel />
        <CanvasControls />
      </div>
    </div>
  );
};
```

### `src/webview/shared/components/FileActionButtons.tsx` 수정

```tsx
interface FileActionButtonsProps {
  onCodeView: () => void;
  onAISummary: () => void;
  onSymbolGraph?: () => void;        // 추가: 미전달 시 버튼 미표시
  isSymbolGraphDisabled?: boolean;   // 추가: 미지원 파일 유형일 때 비활성
  isVisible?: boolean;
}
```

세 번째 버튼 (SVG 아이콘: 네트워크 노드 형태):

```tsx
{onSymbolGraph !== undefined && (
  <button
    className="file-action-button"
    type="button"
    aria-label={t('shared.file_symbol_graph')}
    title={isSymbolGraphDisabled ? t('shared.file_symbol_graph_unsupported') : t('shared.file_symbol_graph')}
    onClick={onSymbolGraph}
    disabled={isSymbolGraphDisabled}
  >
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="8" cy="3" r="1.5" />
      <circle cx="3" cy="12" r="1.5" />
      <circle cx="13" cy="12" r="1.5" />
      <line x1="8" y1="4.5" x2="3.7" y2="10.7" />
      <line x1="8" y1="4.5" x2="12.3" y2="10.7" />
      <line x1="4.5" y1="12" x2="11.5" y2="12" />
    </svg>
  </button>
)}
```

### `src/webview/App.tsx` 수정

```tsx
import { S08IntraFileDependencyCanvasScreen } from './features/F10';

// renderScreen()에 추가
if (currentScreen === 'S08') {
  return <S08IntraFileDependencyCanvasScreen />;
}

// 메시지 핸들러에 추가
if (event.data.type === 'SYMBOL_GRAPH_LOADED') {
  handleSymbolGraphLoaded(event.data.payload.nodes, event.data.payload.edges);
  return;
}
if (event.data.type === 'SYMBOL_GRAPH_FAILED') {
  handleSymbolGraphLoadFailed(event.data.payload?.message);
  return;
}
```

---

## Business Rules

1. JS/TS 파일은 TypeScript Compiler API로 최상위 선언만 추출 (중첩 함수 제외)
2. `commitHash`가 있으면 `git show`로 파일 내용을 가져오고, 없으면 현재 디스크 파일 읽기
3. 미지원 파일은 `analyzeSymbols`가 `{ nodes: [], edges: [] }` 반환 → `EmptyState` (unsupported 메시지)
4. `fitView`는 초기 렌더링 및 패널 크기 변경 시 자동 호출
5. 엣지가 있으면 Dagre 계층 레이아웃, 없으면 kind 그룹 기반 앵커 배치
6. `FileActionButtons`의 `onSymbolGraph` prop은 옵셔널이므로 기존 S02·S07 사용처에 영향 없음
7. S05에서 S08 진입 시 `previousScreen = 'S05'` 저장 → BackButton 클릭 시 `goBackFromDetail()`로 S05 복귀
8. 같은 심볼 쌍에 대한 중복 엣지는 `deduplicateEdges()`로 제거

---

## i18n 키

`src/webview/i18n/` 내 번역 파일에 다음 키를 추가한다.

```json
{
  "shared": {
    "file_symbol_graph": "심볼 그래프",
    "file_symbol_graph_unsupported": "이 파일 유형은 심볼 분석이 지원되지 않습니다."
  },
  "symbol_graph": {
    "loading": "심볼을 분석하는 중입니다...",
    "empty": "분석 가능한 심볼이 없습니다.",
    "error": "심볼을 분석하지 못했습니다.",
    "unsupported": "이 파일 유형은 심볼 분석이 지원되지 않습니다.",
    "legend_title": "심볼 범례",
    "edge_calls": "호출",
    "edge_uses": "참조",
    "edge_extends": "상속",
    "edge_implements": "구현"
  }
}
```

---

## 구현 순서

의존 관계 오류 없이 진행하기 위해 아래 순서를 따른다.

| # | 작업 | 변경 파일 |
|---|------|-----------|
| 1 | 타입 추가 + `ScreenID`에 `'S08'` 추가 | `src/webview/types/commit.ts` |
| 2 | `intraFileDependencyService.ts` 신규 작성 | `src/extension/intraFileDependencyService.ts` |
| 3 | `ANALYZE_SYMBOL_GRAPH` 메시지 핸들러 추가 | `src/extension/messageHandler.ts` |
| 4 | appStore 심볼 그래프 상태·액션·데모 데이터 추가 | `src/webview/store/appStore.ts` |
| 5 | `FileActionButtons`에 `onSymbolGraph` prop 추가 | `src/webview/shared/components/FileActionButtons.tsx` |
| 6 | `FileNodeData`·`FileNode` 수정 | `src/webview/features/F04/graph.ts`, `FileNode.tsx` |
| 7 | `S05DependencyCanvasScreen`에 핸들러 연결 | `src/webview/features/F04/S05_DependencyCanvasScreen.tsx` |
| 8 | `symbolGraph.ts` 작성 | `src/webview/features/F10/symbolGraph.ts` |
| 9 | F10 컴포넌트 작성 (`SymbolKindBadge` → `SymbolNode` → `SymbolEdge` → `SymbolLegendPanel` → `SymbolGraph`) | `src/webview/features/F10/` |
| 10 | `S08_IntraFileDependencyCanvasScreen.tsx` 작성 | `src/webview/features/F10/` |
| 11 | `index.ts` export 추가 | `src/webview/features/F10/index.ts` |
| 12 | `App.tsx` S08 라우트 + 메시지 핸들러 추가 | `src/webview/App.tsx` |
| 13 | i18n 키 추가 | `src/webview/i18n/` |
| 14 | 유닛 테스트 작성 | `tests/unit/` |

---

## 영향 범위

| 영역 | 변경 강도 | 비고 |
|------|-----------|------|
| `FileActionButtons` | 낮음 | 옵셔널 prop 추가만, 기존 사용처 영향 없음 |
| `FileNode` (F04) | 낮음 | 옵셔널 prop 전달 추가 |
| `graph.ts` (F04) | 낮음 | `FileNodeData` 필드 추가 |
| `S05DependencyCanvasScreen` | 낮음 | 핸들러 함수 1개 추가 연결 |
| `appStore.ts` | 중간 | 상태 5개 + 액션 4개 추가 |
| `types/commit.ts` | 낮음 | 신규 타입 추가, 기존 타입 무변경 |
| `App.tsx` | 낮음 | 라우트 1개 + 메시지 2개 추가 |
| F10 (신규) | 신규 | 기존 코드 영향 없음 |

---

## Error Handling

| 상황 | 처리 |
|------|------|
| 심볼 분석 실패 | `ErrorState`: "심볼을 분석하지 못했습니다" + [재시도] |
| 분석 가능 심볼 0개 | `EmptyState`: "분석 가능한 심볼이 없습니다" |
| 미지원 파일 유형 | `EmptyState`: "이 파일 유형은 심볼 분석이 지원되지 않습니다" |

---

## CSS Classes

```css
.symbol-node {
  min-width: 180px;
  min-height: 56px;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
  background: var(--vscode-editorWidget-background);
}
.symbol-node--selected {
  border-color: var(--vscode-focusBorder);
}
.symbol-node-main {
  display: flex;
  align-items: center;
  gap: 6px;
}
.symbol-node-name {
  font-size: 12px;
  font-weight: 500;
  overflow-wrap: anywhere;
}
.symbol-node-line-range {
  font-size: 10px;
  color: var(--vscode-descriptionForeground);
  margin-top: 2px;
}
.symbol-node-export-indicator {
  font-size: 10px;
  margin-left: auto;
  color: var(--vscode-symbolIcon-functionForeground);
}
.symbol-node-handle {
  opacity: 0;
  pointer-events: none;
}
```

---

## References

- [F10 spec.md](./spec.md)
- [F10 blueprint.md](./blueprint.md)
- [F04 implementation_prompt.md](../F04_dependency_canvas/implementation_prompt.md)
- [project/architecture.md](../../project/architecture.md)
- [core/state_model.md](../../core/state_model.md)
