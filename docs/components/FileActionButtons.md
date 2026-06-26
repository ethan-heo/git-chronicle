# Component: FileActionButtons

파일 트리 노드(S02) 또는 캔버스 노드(S05) 호버 시 표시되는 [코드 보기] / [AI 정리 보기] 액션 버튼 쌍.

---

## Props

```typescript
interface FileActionButtonsProps {
  onCodeView: () => void;       // S03 진입
  onAISummary: () => void;      // S04 진입
  isVisible?: boolean;          // 호버 상태 제어 (기본값: true)
}
```

---

## Usage

- `FileTreeNode` 내부: 호버 시 `isHovered === true`일 때 렌더링
- `FileNode` (React Flow) 내부: `onMouseEnter`/`onMouseLeave`로 제어

---

## Implementation

```tsx
export const FileActionButtons: React.FC<FileActionButtonsProps> = ({
  onCodeView, onAISummary, isVisible = true
}) => {
  if (!isVisible) return null;

  return (
    <div className="file-action-buttons" role="group" aria-label="파일 액션">
      <button
        className="file-action-btn"
        onClick={e => { e.stopPropagation(); onCodeView(); }}
        aria-label="코드 보기"
      >
        코드 보기
      </button>
      <button
        className="file-action-btn"
        onClick={e => { e.stopPropagation(); onAISummary(); }}
        aria-label="AI 정리 보기"
      >
        AI 정리 보기
      </button>
    </div>
  );
};
```

---

## CSS

```css
.file-action-buttons {
  display: flex;
  gap: 4px;
  margin-left: auto;
}
.file-action-btn {
  padding: 2px 6px;
  font-size: 11px;
  background: var(--vscode-button-secondaryBackground, var(--vscode-editorWidget-background));
  color: var(--vscode-button-secondaryForeground, var(--vscode-editor-foreground));
  border: 1px solid var(--vscode-panel-border);
  border-radius: 2px;
  cursor: pointer;
  white-space: nowrap;
}
.file-action-btn:hover {
  background: var(--vscode-button-secondaryHoverBackground, var(--vscode-list-hoverBackground));
}
```

---

## References

- [global_components.md](../core/global_components.md#fileactionbuttons)
- [F02 blueprint.md](../features/F02_changed_file_tree/blueprint.md)
- [F04 blueprint.md](../features/F04_dependency_canvas/blueprint.md)
