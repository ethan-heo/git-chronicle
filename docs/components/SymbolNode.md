# Component: SymbolNode

파일 내 심볼 하나를 React Flow 커스텀 노드로 표시한다. 로컬 심볼은 종류 배지(`SymbolKindBadge`), 심볼명, 라인 범위를 포함하고, import 심볼은 `imp` 배지, 모듈 경로, import kind를 함께 표시한다. exported 로컬 심볼에는 인디케이터가 표시된다. F10 전용.

---

## Props

```typescript
interface SymbolNodeData extends Record<string, unknown> {
  symbolNode: SymbolNode;
  label: string;      // 심볼명
  lineRange: string;  // "L12–28" 형태
}
type SymbolNodeType = Node<SymbolNodeData, 'symbolNode'>;
```

`NodeProps<SymbolNodeType>`를 통해 React Flow에서 주입받음.

---

## Usage

- `SymbolGraph` 내 React Flow 커스텀 노드(`nodeTypes = { symbolNode: SymbolNode }`)로만 사용

---

## Variants

| Variant | 조건 |
|---------|------|
| `default` | 기본 상태 |
| `hover` | 테두리 강조 (React Flow `selected` prop 또는 CSS hover) |
| `exported` | `symbolNode.isExported === true` — export 인디케이터 표시 |
| `import` | `symbolNode.nodeCategory === 'import'` — 점선 테두리, `imp` 배지, 모듈 경로, import kind 표시 |

---

## Accessibility

- `role="button"`
- `aria-label="{심볼명} ({kind 또는 import kind}) 심볼 노드"`
- `tabIndex={0}`

---

## References

- [F10 blueprint.md](../features/F10_intra_file_symbol_dependency_canvas/blueprint.md)
- [SymbolKindBadge.md](SymbolKindBadge.md)
