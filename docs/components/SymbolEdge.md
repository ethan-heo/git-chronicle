# Component: SymbolEdge

두 심볼 노드 간의 의존 관계를 방향 있는 SmoothStep 엣지로 표시한다. 관계 종류(`kind`)에 따라 선 스타일이 다르다. F10 전용.

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
| `calls` | 1.5 | 없음 (실선) | `--vscode-charts-blue` |
| `uses` | 1.5 | `4 2` (점선) | `--vscode-panel-border` 계열 |
| `extends` | 2.5 | 없음 (굵은 실선) | `--vscode-charts-green` |
| `implements` | 2.5 | `6 3` (굵은 점선) | `--vscode-charts-purple` |

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
