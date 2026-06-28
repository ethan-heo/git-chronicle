# Component: DependencyGraph

S05_DependencyCanvasScreen의 React Flow 기반 노드-엣지 그래프 캔버스. dependency-cruiser로 분석된 변경 파일 간 의존 관계를 시각화한다. 분석 입력은 현재 디스크 파일을 임시 디렉토리로 복사하고, 누락 파일은 `git show <commitHash>:<filePath>`로 복원한 뒤 구성되며, 결과 JSON은 대용량 출력에도 안전하도록 `spawn` 스트리밍 방식으로 수집한다. path alias가 `repoPath` 절대 경로로 resolve되는 경우에도 변경 파일과 비교할 수 있도록, 결과 경로를 `tmpDir` 또는 `repoPath` 기준으로 정규화한다.

---

## Props

```typescript
interface DependencyGraphProps {
  files: ChangedFile[];
  dependencyEdges: DependencyEdge[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onFileCodeView: (file: ChangedFile) => void;
  onFileAISummary: (file: ChangedFile) => void;
}

interface DependencyEdge {
  from: string;                 // 의존하는 파일 경로
  to: string;                   // 의존 대상 파일 경로
  kind: 'import' | 'require';
}
```

---

## 렌더링 구조

```
DependencyGraph
├── [isLoading = true]  → LoadingState ("의존 관계를 분석하는 중...")
├── [error !== null]    → ErrorState + [재시도]
├── [files.length === 0] → EmptyState ("변경된 파일이 없습니다")
└── [정상]              → ReactFlow 캔버스
    ├── Background (격자 패턴)
    ├── CanvasControls (줌인/줌아웃/맞춤)
    ├── LegendPanel
    └── FileNode × n    (커스텀 노드)
    └── DependencyEdge × n (커스텀 엣지)
```

---

## Business Rules

- **노드 범위**: 커밋에서 변경된 파일만 노드로 표시. 의존하는 미변경 파일은 노드 없음.
- **엣지 범위**: 변경 파일 간 import/require 의존 관계만. 미변경 파일과의 관계는 엣지 없음.
- **고립 노드**: 다른 변경 파일과 의존 관계가 없는 파일도 단독 노드로 표시.
- **JS/TS 외 파일**: 노드는 표시하되, "의존 관계 분석 불가" 툴팁을 표시하고 엣지는 생성하지 않음.
- **레이아웃**: 확장자 그룹 기반 고정 앵커 배치. 확장자 그룹은 수평으로 나뉘고, 같은 확장자 파일은 왼쪽 면을 맞춰 수직으로 배치.
- **노드 크기**: 파일명 길이에 따라 노드 폭을 동적으로 계산한다. 긴 파일명은 말줄임 대신 줄바꿈으로 전체 표시.
- **엣지 연결**: 직선 엣지를 유지하되 source/target 노드의 현재 위치를 기준으로 가장 가까운 상/하/좌/우 핸들을 선택.
- **dependency-cruiser 범위**: JS/TS/CJS/ESM 파일. TypeScript path alias 지원. `tsconfig.json`이 있으면 이를 명시적으로 전달해 alias 해석을 보조한다.
- **경로 정규화**: `dependency-cruiser` 결과가 임시 디렉토리 경로나 저장소 절대 경로로 반환되더라도, 변경 파일 집합과 비교 가능한 repo-relative 경로로 맞춘다.

---

## 인터랙션

| 인터랙션 | 동작 |
|----------|------|
| 줌 인/아웃 | 마우스 휠 또는 Controls 버튼 |
| 패닝 | 빈 영역 드래그 |
| 노드 드래그 | 노드 위치 직접 조정. 드래그 후 엣지 연결 면 재계산 |
| 노드 호버 | `FileActionButtons` ([코드 보기] / [AI 정리 보기]) 표시 + 연결 엣지 강조 |

---

## States

| 상태 | 조건 | 동작 |
|------|------|------|
| `loading` | `isLoading = true` | LoadingState |
| `error` | `error !== null` | ErrorState |
| `empty` | `files.length === 0` | EmptyState |
| `idle` | 그래프 렌더링 완료 | 인터랙션 활성화 |

---

## CSS

```css
.dependency-graph-container {
  width: 100%;
  height: 100%;
  background: var(--vscode-editor-background);
}
```

---

## Accessibility

- 각 노드: `aria-label="{파일명} 노드. 상태: {status 레이블}"`.
- 분석 불가 노드: `title="의존 관계 분석 불가 파일"` 툴팁.
- CanvasControls 버튼: 각 버튼에 `aria-label` 지정.

---

## References

- [F04_DependencyCanvas spec.md](../features/F04_dependency_canvas/spec.md)
- [S05_DependencyCanvasScreen blueprint.md](../screens/S04_dependency_canvas/blueprint.md)
- [FileNode.md](./FileNode.md)
- [DependencyEdge.md](./DependencyEdge.md)
