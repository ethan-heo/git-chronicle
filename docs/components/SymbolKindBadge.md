# Component: SymbolKindBadge

심볼의 종류를 짧은 약어와 배경색으로 표시하는 인라인 pill 배지. F10 전용.

---

## Props

```typescript
interface SymbolKindBadgeProps {
  kind: SymbolKind | 'import';
  // 'function' | 'class' | 'interface' | 'type' | 'variable' | 'constant' | 'enum' | 'import'
}
```

---

## Usage

- `SymbolNode` 내부에서만 사용

---

## 배지 명세

| kind | 표시 텍스트 | CSS 변수 |
|------|------------|----------|
| `function` | `fn` | `--color-symbol-fn` (파란색 계열) |
| `class` | `cls` | `--color-symbol-cls` (초록색 계열) |
| `interface` | `ifc` | `--color-symbol-ifc` (청록색 계열) |
| `type` | `typ` | `--color-symbol-typ` (보라색 계열) |
| `variable` | `var` | `--color-symbol-var` (회색 계열) |
| `constant` | `cst` | `--color-symbol-cst` (주황색 계열) |
| `enum` | `enm` | `--color-symbol-enm` (분홍색 계열) |
| `import` | `imp` | `--color-symbol-imp` (회색 계열) |

---

## Implementation

```tsx
const KIND_CONFIG: Record<SymbolKind | 'import', { label: string; className: string }> = {
  function:  { label: 'fn',  className: 'symbol-kind-badge--fn' },
  class:     { label: 'cls', className: 'symbol-kind-badge--cls' },
  interface: { label: 'ifc', className: 'symbol-kind-badge--ifc' },
  type:      { label: 'typ', className: 'symbol-kind-badge--typ' },
  variable:  { label: 'var', className: 'symbol-kind-badge--var' },
  constant:  { label: 'cst', className: 'symbol-kind-badge--cst' },
  enum:      { label: 'enm', className: 'symbol-kind-badge--enm' },
  import:    { label: 'imp', className: 'symbol-kind-badge--import' },
};

export const SymbolKindBadge: FC<SymbolKindBadgeProps> = ({ kind }) => {
  const { label, className } = KIND_CONFIG[kind];
  return (
    <span className={`symbol-kind-badge ${className}`} aria-label={kind}>
      {label}
    </span>
  );
};
```

---

## CSS

```css
.symbol-kind-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  font-family: var(--vscode-editor-font-family);
  flex-shrink: 0;
}
```

---

## References

- [F10 blueprint.md](../features/F10_intra_file_symbol_dependency_canvas/blueprint.md)
- [FileStatusBadge.md](FileStatusBadge.md) (구조 참고)
