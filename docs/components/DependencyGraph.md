# Component: DependencyGraph

S05_DependencyCanvasScreen의 React Flow 기반 노드-엣지 그래프 캔버스. dependency-cruiser로 분석된 변경 파일 간 의존 관계를 시각화한다.

---

## Props

```typescript
interface DependencyGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  isLoading: boolean;
  error: string | null;
  onNodeCodeView: (file: ChangedFile) => void;
  onNodeAIView: (file: ChangedFile) => void;
}

interface GraphNode {
  id: string;                  // 파일 경로
  filePath: string;
  status: 'A' | 'M' | 'D' | 'R';
  isAnalyzable: boolean;       // JS/TS 파일이면 true, 그 외 false
  hasSavedSummary: boolean;
}

interface GraphEdge {
  id: string;
  source: string;              // 의존하는 파일 경로
  target: string;              // 의존 대상 파일 경로
}
```

---

## 렌더링 구조

```
DependencyGraph
├── [isLoading = true]  → LoadingState ("의존 관계를 분석하는 중...")
├── [error !== null]    → ErrorState + [재시도]
├── [nodes.length === 0] → EmptyState ("분석할 파일이 없습니다")
└── [정상]              → ReactFlow 캔버스
    ├── Background (격자 패턴)
    ├── Controls (줌인/줌아웃/전체보기)
    ├── MiniMap
    └── FileNode × n    (커스텀 노드)
    └── DependencyEdge × n (커스텀 엣지)
```

---

## Business Rules

- **노드 범위**: 커밋에서 변경된 파일만 노드로 표시. 의존하는 미변경 파일은 노드 없음.
- **엣지 범위**: 변경 파일 간 import/require 의존 관계만. 미변경 파일과의 관계는 엣지 없음.
- **고립 노드**: 다른 변경 파일과 의존 관계가 없는 파일도 단독 노드로 표시.
- **JS/TS 외 파일**: 노드는 표시하되, "의존 관계 분석 불가" 툴팁을 표시하고 엣지는 생성하지 않음.
- **레이아웃**: force-directed 자동 배치. 초기 렌더링 시 모든 노드가 화면에 맞게 fit.
- **dependency-cruiser 범위**: JS/TS/CJS/ESM 파일. TypeScript path alias 지원.

---

## 인터랙션

| 인터랙션 | 동작 |
|----------|------|
| 줌 인/아웃 | 마우스 휠 또는 Controls 버튼 |
| 패닝 | 드래그 |
| 노드 선택 | 클릭 시 강조 표시 |
| 노드 호버 | `FileActionButtons` ([코드 보기] / [AI 정리 보기]) 표시 |

---

## States

| 상태 | 조건 | 동작 |
|------|------|------|
| `loading` | `isLoading = true` | LoadingState |
| `error` | `error !== null` | ErrorState |
| `empty` | `nodes.length === 0` | EmptyState |
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
- Controls 버튼: 기본 React Flow aria 속성 사용.

---

## References

- [F04_DependencyCanvas spec.md](../features/F04_dependency_canvas/spec.md)
- [S05_DependencyCanvasScreen blueprint.md](../screens/S05_dependency_canvas/blueprint.md)
- [FileNode.md](./FileNode.md)
- [DependencyEdge.md](./DependencyEdge.md)
