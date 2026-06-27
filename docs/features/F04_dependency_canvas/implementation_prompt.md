# Implementation Prompt: F04_DependencyCanvas

> Claude Code 또는 Cursor에 직접 입력하여 구현을 생성하는 프롬프트

---

## Technical Context

- **의존성 분석**: Extension Host에서 `dependency-cruiser` CLI를 `child_process.execFile`로 실행, JSON 결과 파싱
- **시각화**: Webview에서 `React Flow` (`@xyflow/react`) 사용. 레이아웃은 deterministic force-directed 계산으로 자동 배치
- **대상 파일**: JS/TS 파일만 분석 가능 (`.mjs`, `.cjs`, `.js`, `.jsx`, `.mts`, `.cts`, `.ts`, `.tsx`)

---

## Files to Create / Modify

| 파일 | 역할 |
|------|------|
| `src/extension/dependencyService.ts` | `dependency-cruiser` CLI 실행 및 JSON 파싱 |
| `src/webview/features/F04/DependencyGraph.tsx` | React Flow 기반 캔버스 컨테이너 |
| `src/webview/features/F04/FileNode.tsx` | React Flow 커스텀 노드 |
| `src/webview/features/F04/DependencyEdge.tsx` | React Flow 커스텀 엣지 |
| `src/webview/features/F04/LegendPanel.tsx` | 범례 패널 |
| `src/webview/features/F04/CanvasControls.tsx` | 줌 컨트롤 버튼 |
| `src/webview/features/F04/S05_DependencyCanvasScreen.tsx` | S05 화면 조합 컴포넌트 |
| `src/webview/features/F04/graph.ts` | 변경 파일/의존 관계를 React Flow 노드·엣지로 변환하고 force-directed 좌표 계산 |
| `tests/unit/dependencyGraph.test.ts` | 노드/엣지 필터링과 분석 불가 파일 규칙 단위 테스트 |

---

## TypeScript Interfaces

```typescript
import { Node, Edge } from '@xyflow/react';

interface FileNodeData {
  file: ChangedFile;
  label: string;       // 파일명 (경로 마지막 부분)
  directory: string;   // 상위 경로
  canAnalyze: boolean; // JS/TS 파일 여부
  onCodeView: (file: ChangedFile) => void;
  onAISummary: (file: ChangedFile) => void;
}

type FileNodeType = Node<FileNodeData, 'fileNode'>;
type DependencyEdgeType = Edge<{ kind: 'import' | 'require'; highlighted: boolean }>;

interface DependencyGraphProps {
  files: ChangedFile[];
  dependencyEdges: DependencyEdge[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onFileCodeView: (file: ChangedFile) => void;
  onFileAISummary: (file: ChangedFile) => void;
}
```

---

## Extension Host Implementation

### `src/extension/dependencyService.ts`

```typescript
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface DepEdge {
  from: string;
  to: string;
  kind: 'import' | 'require';
}

export async function analyzeDependencies(
  repoPath: string,
  filePaths: string[]
): Promise<DepEdge[]> {
  // JS/TS 파일만 필터
  const analyzable = filePaths.filter(p =>
    /\.(mjs|cjs|js|jsx|mts|cts|ts|tsx)$/.test(p)
  );
  if (analyzable.length === 0) return [];

  const args = [
    '--output-type', 'json',
    '--no-config',
    '--ts-pre-compilation-deps',
    ...analyzable,
  ];

  const { stdout } = await execFileAsync(process.execPath, [analyzerPath, ...args], { cwd: repoPath });
  const result = JSON.parse(stdout);

  const edges: DepEdge[] = [];
  for (const module of result.modules || []) {
    for (const dep of module.dependencies || []) {
      if (analyzable.includes(dep.resolved)) {
        edges.push({ from: module.source, to: dep.resolved });
      }
    }
  }
  return edges;
}
```

Extension Host 메시지 핸들러:
```typescript
case 'ANALYZE_DEPENDENCIES': {
  const edges = await analyzeDependencies(repoPath, message.payload.filePaths);
  panel.webview.postMessage({ type: 'DEPENDENCIES_LOADED', payload: { edges } });
  break;
}
```

---

## Webview Implementation

### 노드/엣지 생성 유틸리티

```typescript
// src/webview/features/F04/graph.ts

export function buildGraphData(
  files: ChangedFile[],
  depEdges: DependencyEdge[],
  handlers: { onCodeView: (file: ChangedFile) => void; onAISummary: (file: ChangedFile) => void }
): { nodes: FileNodeType[]; edges: DependencyEdgeType[] } {
  const changedFileSet = new Set(files.map((file) => file.path));
  const validEdges = depEdges.filter((edge) => changedFileSet.has(edge.from) && changedFileSet.has(edge.to));
  const positions = layoutFiles(files, validEdges);

  const nodes: FileNodeType[] = files.map(f => {
    const position = positions.get(f.path) ?? { x: 0, y: 0 };
    const canAnalyze = /\.(mjs|cjs|js|jsx|mts|cts|ts|tsx)$/.test(f.path);
    return {
      id: f.path,
      type: 'fileNode',
      position,
      data: {
        file: f,
        label: f.path.split('/').pop() ?? f.path,
        canAnalyze,
        onCodeView: handlers.onCodeView,
        onAISummary: handlers.onAISummary,
      },
    };
  });

  const edges: DependencyEdgeType[] = depEdges.map((e, i) => ({
    id: `e-${i}`,
    source: e.from,
    target: e.to,
    type: 'dependencyEdge',
    data: { kind: e.kind, highlighted: false },
  }));

  return { nodes, edges };
}
```

### `FileNode.tsx` (React Flow 커스텀 노드)

```tsx
import { Handle, Position } from '@xyflow/react';

export const FileNode: React.FC<{ data: FileNodeData }> = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { file, label, canAnalyze } = data;

  return (
    <div
      className={`file-node ${!canAnalyze ? 'file-node--no-analysis' : ''} ${file.hasSavedSummary ? 'file-node--saved' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={!canAnalyze ? '의존 관계 분석 불가 (JS/TS 파일만 지원)' : undefined}
    >
      <Handle type="target" position={Position.Left} />
      <FileStatusBadge status={file.status} />
      <span className="file-node-label">{label}</span>
      {file.hasSavedSummary && <SavedBadge />}
      {isHovered && (
        <FileActionButtons
          onCodeView={() => data.onCodeView?.(file)}
          onAIView={() => data.onAIView?.(file)}
        />
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};
```

### `DependencyGraph.tsx`

```tsx
import { ReactFlow, useNodesState, useEdgesState, Controls, Background } from '@xyflow/react';

const nodeTypes = { fileNode: FileNode };
const edgeTypes = { dependencyEdge: DependencyEdge };

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  nodes: initialNodes, edges: initialEdges, isLoading
}) => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  if (isLoading) return <LoadingState />;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      minZoom={0.3}
      maxZoom={2.0}
    >
      <Background />
    </ReactFlow>
  );
};
```

---

## Business Rules

1. JS/TS 파일(`.mjs`, `.cjs`, `.js`, `.jsx`, `.mts`, `.cts`, `.ts`, `.tsx`)만 `dependency-cruiser`로 분석
2. 분석 불가 파일(`canAnalyze = false`)은 노드로 표시하되 점선 테두리 적용, 엣지 없음
3. `fitView`는 초기 렌더링 및 패널 크기 변경 시 자동 호출
4. 줌 범위: 0.3x ~ 2.0x
5. `dependency-cruiser` 실행 파일이 없는 경우 `ErrorState` + `pnpm install` 안내 표시
6. S05에서 S03/S04로 진입할 때 `previousScreen = "S05"`를 저장하고 뒤로가기 시 S05로 복귀
7. S02에서 변경 파일 로딩 중에는 [캔버스 보기] 버튼을 로딩 상태로 표시하며, S05도 변경 파일 로딩 메시지를 처리할 수 있어야 함

---

## Error Handling

| 상황 | 처리 |
|------|------|
| `dependency-cruiser` 없음 | `ErrorState`: "dependency-cruiser가 설치되지 않았습니다. pnpm install 후 다시 시도해주세요." |
| 분석 실패 | `ErrorState` + [재시도] 버튼 |
| 변경 파일 없음 | `EmptyState` |
| JS/TS 파일 없음 (모두 분석 불가) | 노드 표시, 엣지 없음, 안내 메시지 |

---

## CSS Variables to Use

```css
.file-node {
  background: var(--vscode-editorWidget-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
  padding: 8px 12px;
}
.file-node--no-analysis { border-style: dashed; opacity: 0.7; }
.file-node:hover { border-color: var(--vscode-focusBorder); }
```

---

## Dependencies

```bash
pnpm install
# dependency-cruiser는 package.json 의존성 및 bundledDependencies에 포함
```

---

## References

- [F04 spec.md](./spec.md)
- [F04 blueprint.md](./blueprint.md)
- [project/architecture.md](../../project/architecture.md)
- [core/state_model.md](../../core/state_model.md)
- [core/global_components.md](../../core/global_components.md)
