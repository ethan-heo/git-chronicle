# Component: SavedBadge

파일 트리 노드 또는 캔버스 노드에서 AI 정리 저장본 존재 여부를 표시하는 소형 뱃지.

---

## Props

```typescript
interface SavedBadgeProps {
  isVisible?: boolean;  // 기본값: true. false이면 null 반환
}
```

---

## Display Condition

저장 경로(`savePath`)가 설정되어 있고, 해당 파일의 `.md` 저장본이 존재할 때만 표시. 조건 판단은 상위 컴포넌트(`FileTreeNode`, `FileNode`)의 `file.hasSavedSummary`로 결정.

---

## Implementation

```tsx
export const SavedBadge: React.FC<SavedBadgeProps> = ({ isVisible = true }) => {
  if (!isVisible) return null;

  return (
    <span className="saved-badge" aria-label="AI 정리 저장됨" title="AI 정리 저장됨">
      저장됨
    </span>
  );
};
```

---

## CSS

```css
.saved-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  font-size: 10px;
  background: var(--vscode-testing-iconPassed, #4caf50);
  color: var(--vscode-editor-background);
  border-radius: 10px;
  white-space: nowrap;
  font-weight: 500;
}
```

---

## References

- [global_components.md](../core/global_components.md#savedbadge)
- [F02 blueprint.md](../features/F02_changed_file_tree/blueprint.md)
- [F04 blueprint.md](../features/F04_dependency_canvas/blueprint.md)
