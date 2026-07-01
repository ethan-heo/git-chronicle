# Component: FileActionButtons

파일 트리 노드(S02) 또는 캔버스 노드(S05) 호버 시 표시되는 [코드 보기] / [AI 정리 보기] 액션 버튼 쌍. AI 액션은 별표 아이콘 대신 `AI` 텍스트로 표시된다. S05 컨텍스트에서는 `onSymbolGraph` prop을 전달하여 세 번째 [심볼 그래프] 버튼도 표시할 수 있다.

---

## Props

```typescript
interface FileActionButtonsProps {
  onCodeView: () => void;           // S03 진입
  onAISummary: () => void;          // S04 진입
  onSymbolGraph?: () => void;       // S08 진입 (옵셔널. 미전달 시 버튼 미표시)
  isVisible?: boolean;              // 호버 상태 제어 (기본값: true)
}
```

---

## Usage

- `FileTreeNode` 내부 (S02): 호버 시 `isHovered === true`일 때 렌더링. `onSymbolGraph` 미전달.
- `FileNode` (React Flow, S05) 내부: `onSymbolGraph`와 `isSymbolGraphDisabled` 전달. JS/TS/Python/Go 파일만 활성.

---

## Implementation

```tsx
export const FileActionButtons: React.FC<FileActionButtonsProps> = ({
  onCodeView, onAISummary, onSymbolGraph, isVisible = true
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
        AI
      </button>
      {onSymbolGraph !== undefined && (
        <button
          className="file-action-btn"
          onClick={e => { e.stopPropagation(); onSymbolGraph(); }}
          aria-label="심볼 그래프"
        >
          심볼 그래프
        </button>
      )}
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
  width: 22px;
  height: 22px;
  padding: 0;
  font-size: 10px;
  font-weight: 600;
  background: var(--vscode-button-secondaryBackground, var(--vscode-editorWidget-background));
  color: var(--vscode-button-secondaryForeground, var(--vscode-editor-foreground));
  border: 1px solid var(--vscode-panel-border);
  border-radius: 2px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
- [F10 blueprint.md](../features/F10_intra_file_symbol_dependency_canvas/blueprint.md)
