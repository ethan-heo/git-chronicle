# Component: FileStatusBadge

파일 트리 노드 및 캔버스 노드에서 파일 변경 상태(A/M/D/R)를 표시하는 단일 레터 뱃지.

---

## Props

```typescript
type FileStatus = 'A' | 'M' | 'D' | 'R';

interface FileStatusBadgeProps {
  status: FileStatus;
}
```

---

## Status Meanings

| status | 의미 | 색상 |
|--------|------|------|
| `A` | Added (추가) | `var(--vscode-gitDecoration-addedResourceForeground)` |
| `M` | Modified (수정) | `var(--vscode-gitDecoration-modifiedResourceForeground)` |
| `D` | Deleted (삭제) | `var(--vscode-gitDecoration-deletedResourceForeground)` |
| `R` | Renamed (이름 변경) | `var(--vscode-gitDecoration-renamedResourceForeground)` |

---

## Implementation

```tsx
const STATUS_COLORS: Record<FileStatus, string> = {
  A: 'var(--vscode-gitDecoration-addedResourceForeground)',
  M: 'var(--vscode-gitDecoration-modifiedResourceForeground)',
  D: 'var(--vscode-gitDecoration-deletedResourceForeground)',
  R: 'var(--vscode-gitDecoration-renamedResourceForeground)',
};

const STATUS_LABELS: Record<FileStatus, string> = {
  A: '추가',
  M: '수정',
  D: '삭제',
  R: '이름 변경',
};

export const FileStatusBadge: React.FC<FileStatusBadgeProps> = ({ status }) => (
  <span
    className="file-status-badge"
    style={{ color: STATUS_COLORS[status] }}
    aria-label={`파일 상태: ${STATUS_LABELS[status]}`}
    title={STATUS_LABELS[status]}
  >
    {status}
  </span>
);
```

---

## CSS

```css
.file-status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  font-family: monospace;
  min-width: 14px;
  text-align: center;
  flex-shrink: 0;
}
```

---

## References

- [F02 blueprint.md](../features/F02_changed_file_tree/blueprint.md)
- [F04 blueprint.md](../features/F04_dependency_canvas/blueprint.md)
- [design_tokens.md](../core/design_tokens.md)
