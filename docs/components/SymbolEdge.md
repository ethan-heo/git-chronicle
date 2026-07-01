# Component: SymbolEdge

두 심볼 노드 간의 의존 관계를 방향 있는 Bezier 엣지로 표시한다. 관계 종류(`kind`)에 따라 선 스타일과 화살촉 모양이 다르다. F10 전용.

---

## Props

```typescript
interface SymbolEdgeData extends Record<string, unknown> {
  kind: SymbolDependencyKind;  // 'calls' | 'uses' | 'extends' | 'implements'
  highlighted: boolean;
  dimmed: boolean;
}
type SymbolEdgeType = Edge<SymbolEdgeData, 'symbolEdge'>;
```

`EdgeProps<SymbolEdgeType>`를 통해 React Flow에서 주입받음.

---

## Usage

- `SymbolGraph` 내 React Flow 커스텀 엣지(`edgeTypes = { symbolEdge: SymbolEdge }`)로만 사용

---

## 엣지 스타일

| kind | strokeWidth | strokeDasharray | 색상 |
|------|------------|-----------------|------|
| `calls` | 2.0 내외 | 없음 (실선) | 열린 V형 화살촉 |
| `uses` | 1.5 내외 | `4 4` (점선) | 열린 V형 화살촉 |
| `extends` | 2.5 내외 | 없음 (굵은 실선) | 속이 빈 삼각형 |
| `implements` | 2.5 내외 | `6 4` (굵은 점선) | 속이 빈 삼각형 |

## 화살촉 규칙

- `calls` / `uses`는 열린 V형 화살촉을 사용한다.
- `extends` / `implements`는 속이 빈 삼각형 화살촉을 사용한다.
- 화살촉은 엣지 끝점이 삼각형 내부로 파고들지 않도록 대상 방향으로 약간 오프셋해 렌더링한다.

## 상태 스타일

| 상태 | 적용 |
|------|------|
| `highlighted` | 색상 강조 (opacity 1.0) |
| `dimmed` | opacity 0.15 |
| `default` | opacity 0.6 |

---

## References

- [F10 blueprint.md](../features/F10_intra_file_symbol_dependency_canvas/blueprint.md)
- [DependencyEdge.md](DependencyEdge.md) (구조 참고)
