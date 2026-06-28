# Implementation Prompt: F04_DependencyCanvas

> Claude Code 또는 Cursor에 직접 입력하여 구현을 생성하는 프롬프트

---

## Technical Context

- **의존성 분석**: Extension Host에서 현재 디스크 파일을 임시 디렉토리로 복사하고, 누락 파일은 `git show <commitHash>:<filePath>`로 복원한 뒤 JS/TS/CJS/ESM은 `dist/depcruiser-runner.mjs`를 통해 `dependency-cruiser` API로, Python/Go는 텍스트 파싱으로 분석한다.
- **JS/TS 경로 해석**: `dependency-cruiser` 결과가 `resolved` 대신 `module`만 제공하거나 `./Button`처럼 확장자 없는 상대 specifier를 반환해도 변경 파일 경로로 재해석한다. default export, named export, re-export 패턴 모두 선이 끊기지 않도록 한다.
- **시각화**: Webview에서 `React Flow` (`@xyflow/react`) 사용. 엣지가 있으면 `@dagrejs/dagre` 기반 계층 레이아웃, 없으면 확장자 그룹 기반 고정 앵커 배치
- **대상 파일**: JS/TS/CJS/ESM, Python, Go 파일 분석 가능 (`.mjs`, `.cjs`, `.js`, `.jsx`, `.mts`, `.cts`, `.ts`, `.tsx`, `.py`, `.go`)

---

## Files to Create / Modify

| 파일 | 역할 |
|------|------|
| `src/extension/dependencyService.ts` | 언어별 의존 관계 분석 및 JSON/텍스트 파싱 |
| `src/webview/features/F04/DependencyGraph.tsx` | React Flow 기반 캔버스 컨테이너 |
| `src/webview/features/F04/FileNode.tsx` | React Flow 커스텀 노드 |
| `src/webview/features/F04/DependencyEdge.tsx` | React Flow 커스텀 엣지 |
| `src/webview/features/F04/LegendPanel.tsx` | 범례 패널 |
| `src/webview/features/F04/CanvasControls.tsx` | 줌 컨트롤 버튼 |
| `src/webview/features/F04/S05_DependencyCanvasScreen.tsx` | S05 화면 조합 컴포넌트 |
| `src/webview/features/F04/graph.ts` | 변경 파일/의존 관계를 React Flow 노드·엣지로 변환, Dagre/확장자 그룹 혼합 좌표 계산, 가장 가까운 면 핸들 선택 |
| `tests/unit/dependencyGraph.test.ts` | 노드/엣지 필터링, 확장자 그룹 배치, 긴 파일명 노드 폭, 가까운 면 핸들 선택 단위 테스트 |

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
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawn } from 'child_process';
import { fetchFileContentAtCommit } from '../../extension/gitService';

interface DepEdge {
  from: string;
  to: string;
  kind: 'import' | 'require';
}

export async function analyzeDependencies(
  repoPath: string,
  filePaths: string[],
  commitHash: string
): Promise<DepEdge[]> {
  // JS/TS 파일만 필터
  const analyzable = filePaths.filter(p =>
    /\.(mjs|cjs|js|jsx|mts|cts|ts|tsx)$/.test(p)
  );
  if (analyzable.length === 0) return [];

  const analyzerPath = getDependencyCruiserBinPath();
  const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'git-chronicle-'));
  const resolvedPaths: string[] = [];

  try {
    for (const filePath of analyzable) {
      const onDiskPath = path.resolve(repoPath, filePath);
      const tmpFilePath = path.join(tmpDir, filePath);

      if (fs.existsSync(onDiskPath)) {
        await fs.promises.mkdir(path.dirname(tmpFilePath), { recursive: true });
        await fs.promises.copyFile(onDiskPath, tmpFilePath);
        resolvedPaths.push(tmpFilePath);
        continue;
      }

      if (!commitHash) {
        continue;
      }

      const content = await fetchFileContentAtCommit(repoPath, commitHash, filePath);
      if (content === null) {
        continue;
      }

      await fs.promises.mkdir(path.dirname(tmpFilePath), { recursive: true });
      await fs.promises.writeFile(tmpFilePath, content, 'utf8');
      resolvedPaths.push(tmpFilePath);
    }

    if (resolvedPaths.length === 0) return [];

    const args = [
      '--output-type', 'json',
      '--no-config',
      ...(tsConfigPath ? ['--ts-config', tsConfigPath] : []),
      '--ts-pre-compilation-deps',
      ...resolvedPaths,
    ];

    const stdout = await runDependencyCruiser([analyzerPath, ...args], repoPath);
    const result = JSON.parse(stdout);

    const edges: DepEdge[] = [];
    for (const module of result.modules || []) {
      for (const dep of module.dependencies || []) {
        if (resolvedPaths.includes(dep.resolved)) {
          edges.push({ from: module.source, to: dep.resolved });
        }
      }
    }
    return edges;
  } finally {
    await fs.promises.rm(tmpDir, { recursive: true, force: true });
  }
}

function runDependencyCruiser(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout?.on('data', (chunk: Buffer) => stdoutChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    child.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));

    child.on('error', reject);
    child.on('close', (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString('utf8');
      const stderr = Buffer.concat(stderrChunks).toString('utf8');

      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(new Error(stderr || `dependency-cruiser runner exited with code ${code ?? 'unknown'}`));
    });
  });
}
```

Extension Host 메시지 핸들러:
```typescript
case 'ANALYZE_DEPENDENCIES': {
  const edges = await analyzeDependencies(repoPath, message.payload.filePaths, message.payload.commitHash);
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
    const nodeWidth = getNodeWidth(f.path);

    return {
      id: f.path,
      type: 'fileNode',
      position,
      style: { width: nodeWidth },
      data: {
        file: f,
        label: f.path.split('/').pop() ?? f.path,
        canAnalyze,
        onCodeView: handlers.onCodeView,
        onAISummary: handlers.onAISummary,
      },
    };
  });

  const edges: DependencyEdgeType[] = depEdges.map((e, i) => {
    const handles = getNearestHandles(geometryByPath.get(e.from), geometryByPath.get(e.to));

    return {
      id: `e-${i}`,
      source: e.from,
      target: e.to,
      sourceHandle: handles.sourceHandle,
      targetHandle: handles.targetHandle,
      type: 'dependencyEdge',
      data: { kind: e.kind, highlighted: false },
    };
  });

  return { nodes, edges };
}
```

### `FileNode.tsx` (React Flow 커스텀 노드)

파일명 길이에 맞춰 노드 폭이 조정되며, JS/TS 계열 파일 여부에 따라 의존 관계 분석 가능 상태를 표시한다.

```tsx
import { Handle, Position } from '@xyflow/react';

const handlePositions = [
  { face: 'top', position: Position.Top },
  { face: 'right', position: Position.Right },
  { face: 'bottom', position: Position.Bottom },
  { face: 'left', position: Position.Left },
] as const;

export const FileNode: React.FC<{ data: FileNodeData }> = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);
  const { file, label, canAnalyze } = data;

  return (
    <div
      className={`file-node ${!canAnalyze ? 'file-node--no-analysis' : ''} ${file.hasSavedSummary ? 'file-node--saved' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={!canAnalyze ? '의존 관계 분석 불가 (지원 언어 외 파일)' : undefined}
    >
      {handlePositions.map(({ face, position }) => (
        <Handle key={`target-${face}`} id={`target-${face}`} type="target" position={position} />
      ))}
      <FileStatusBadge status={file.status} />
      <span className="file-node-label">{label}</span>
      {file.hasSavedSummary && <SavedBadge />}
      {isHovered && (
        <FileActionButtons
          onCodeView={() => data.onCodeView?.(file)}
          onAIView={() => data.onAIView?.(file)}
        />
      )}
      {handlePositions.map(({ face, position }) => (
        <Handle key={`source-${face}`} id={`source-${face}`} type="source" position={position} />
      ))}
    </div>
  );
};
```

### `DependencyEdge.tsx` (React Flow 커스텀 엣지)

`getSmoothStepPath()`를 사용해 직각 우회 경로로 렌더링한다. `require` 관계는 dashed stroke를 유지한다. 활성 노드의 `source -> target` 관계 중 `source`가 활성일 때만 `highlighted`로 표시하며, 선택 상태가 있어도 hover 노드가 우선일 때는 hover 기준으로 재계산한다.

### `DependencyGraph.tsx`

```tsx
import { ReactFlow, useNodesState, Controls, Background } from '@xyflow/react';

const nodeTypes = { fileNode: FileNode };
const edgeTypes = { dependencyEdge: DependencyEdge };

export const DependencyGraph: React.FC<DependencyGraphProps> = ({
  nodes: initialNodes, edges: initialEdges, isLoading
}) => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const edges = useMemo(() => updateEdgeHandles(initialEdges, nodes), [initialEdges, nodes]);

  if (isLoading) return <LoadingState />;

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      nodesDraggable
      fitView
      minZoom={0.3}
      maxZoom={2.0}
    >
      <Background />
    </ReactFlow>
 );
};
```

### `graph.ts` 좌표 규칙

- 엣지가 있으면 Dagre를 우선 적용한다.
- 연결된 노드만 Dagre 배치 대상으로 삼고, 고립 노드는 기존 확장자 그룹 규칙으로 아래쪽에 추가한다.
- 엣지가 없으면 기존 확장자 그룹 배치를 유지한다.
- 노드 드래그 후 엣지 연결 면은 현재 위치를 기준으로 가장 가까운 면으로 다시 계산한다.

---

## Business Rules

1. JS/TS/CJS/ESM 파일은 `dependency-cruiser` runner로 분석하고, Python/Go 파일은 텍스트 파싱으로 분석
2. 지원 언어 외 파일(`canAnalyze = false`)은 노드로 표시하되 점선 테두리 적용, 엣지 없음
3. `fitView`는 초기 렌더링 및 패널 크기 변경 시 자동 호출
4. 줌 범위: 0.3x ~ 2.0x
5. `dependency-cruiser` runner 또는 복사된 의존성이 없는 경우 JS/TS 분석 실패로 처리하고 `ErrorState` + `pnpm install` 안내 표시
6. JS/TS 분석 결과는 `resolved`가 없더라도 `module`과 source 파일 기준 상대 경로를 조합해 변경 파일 경로로 복원한다
7. S05에서 S03/S04로 진입할 때 `previousScreen = "S05"`를 저장하고 뒤로가기 시 S05로 복귀
8. S02에서 변경 파일 로딩 중에는 [캔버스 보기] 버튼을 로딩 상태로 표시하며, S05도 변경 파일 로딩 메시지를 처리할 수 있어야 함
9. 엣지가 있으면 Dagre 계층 레이아웃을 적용하고, 엣지가 없을 때만 기존 확장자 그룹 배치를 사용
10. 긴 파일명은 노드 폭 확장 및 줄바꿈으로 전체 표시
11. 노드는 드래그로 위치 조정 가능하며, 엣지는 현재 위치에서 가장 가까운 상/하/좌/우 핸들에 연결
12. 노드 클릭은 선택 상태를 고정하고, 다른 노드 호버 시에는 호버 노드 기준 강조가 우선 적용된다
13. 강조 색상은 활성 노드가 의존하는 대상(outgoing dependency)에만 적용하고, 반대 방향 엣지는 강조하지 않는다

---

## Error Handling

| 상황 | 처리 |
|------|------|
| `dependency-cruiser` runner 없음 또는 의존성 누락 | `ErrorState`: "dependency-cruiser가 설치되지 않았습니다. pnpm install 후 다시 시도해주세요." |
| 분석 실패 | `ErrorState` + [재시도] 버튼 |
| 변경 파일 없음 | `EmptyState` |
| 지원 언어 파일 없음 | 노드 표시, 엣지 없음, 안내 메시지 |

---

## CSS Variables to Use

```css
.dependency-file-node {
  width: 100%;
  min-height: 62px;
  box-sizing: border-box;
}
.dependency-file-node-name {
  overflow-wrap: anywhere;
  white-space: normal;
}
.dependency-file-node-actions { z-index: 10; }
.dependency-node-handle { opacity: 0; pointer-events: none; }
```

---

## Dependencies

```bash
pnpm install
# dependency-cruiser는 package.json 의존성 및 dist 복사 대상에 포함
```

---

## References

- [F04 spec.md](./spec.md)
- [F04 blueprint.md](./blueprint.md)
- [project/architecture.md](../../project/architecture.md)
- [core/state_model.md](../../core/state_model.md)
- [core/global_components.md](../../core/global_components.md)
