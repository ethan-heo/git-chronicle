# Component: SymbolGraph

파일 내부 심볼들을 노드로, 심볼 간 의존 관계를 엣지로 시각화하는 React Flow 기반 캔버스 컨테이너. F10 전용.

---

## Props

```typescript
interface SymbolGraphProps {
  symbolNodes: SymbolNode[];
  symbolEdges: SymbolEdge[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  activeNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
}
```

---

## Usage

- `S08_IntraFileSymbolDependencyCanvasScreen` 내부에서만 사용

---

## States

| 상태 | 조건 | UI |
|------|------|-----|
| `loading` | `isLoading === true` | `LoadingState` |
| `empty` | `symbolNodes.length === 0` (로딩 완료 후) | `EmptyState` |
| `populated` | 노드 존재 | React Flow 캔버스 |
| `error` | `error !== null` | `ErrorState` |

---

## Interaction

- 노드 호버: 연결 엣지 강조 (`highlighted`), 비연결 엣지 감쇠 (`dimmed`)
- 노드 클릭: 활성 노드 설정 및 코드 패널 스크롤 트리거
- 노드 드래그: 위치 이동 + 엣지 연결 면 재계산
- 마우스 휠: 줌 인/아웃
- 빈 영역 드래그: 패닝
- 초기 진입 시 노드/엣지 초기화 완료 후 `fitView()` 1회 호출

---

## References

- [F10 blueprint.md](../features/F10_intra_file_symbol_dependency_canvas/blueprint.md)
- [F04 DependencyGraph.md](DependencyGraph.md) (구조 참고)
