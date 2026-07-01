# Component: SymbolNode

파일 내 심볼 하나를 React Flow 커스텀 노드로 표시한다. 로컬 심볼은 종류 배지(`SymbolKindBadge`), 심볼명, 라인 범위를 포함하고, 기능에 따라 시그니처·타입 어노테이션·멤버 목록·enum 값도 함께 표시한다. import 심볼은 `imp` 배지, 모듈 경로, import kind를 함께 표시한다. exported 로컬 심볼에는 인디케이터가 표시된다. F10 전용.

---

## Props

```typescript
interface SymbolNodeData extends Record<string, unknown> {
  symbolNode: SymbolNode;
  label: string;      // 심볼명
  lineRange: string;  // "L12–28" 형태
  width: number;      // 내용 길이에 따라 계산된 노드 폭
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

## 표시 규칙

- `function`은 `signature`를 노드 본문에 표시하며, 파라미터와 반환 타입의 옵셔널 표기(`?`)를 유지한다.
- `class` / `interface`는 멤버를 속성(attribute)과 메서드(operation)로 나누어 표시하며, 멤버명과 파라미터의 옵셔널 표기(`?`)를 유지한다.
- `enum`은 `enumValues`를 줄 단위로 표시한다.
- `type` / `variable` / `constant`는 타입 표현식을 보조 정보로 표시한다.
- 노드 폭은 본문 길이를 기준으로 계산하며, 긴 시그니처/멤버/타입 텍스트가 잘리지 않도록 여유 폭을 둔다.

---

## Accessibility

- `role="button"`
- `aria-label="{심볼명} ({kind 또는 import kind}) 심볼 노드"`
- `tabIndex={0}`

---

## References

- [F10 blueprint.md](../features/F10_intra_file_symbol_dependency_canvas/blueprint.md)
- [SymbolKindBadge.md](SymbolKindBadge.md)
