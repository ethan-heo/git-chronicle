# Component: FileNode

React Flow 캔버스(S05_DependencyCanvasScreen)에서 변경 파일 하나를 나타내는 커스텀 노드 컴포넌트.

---

## Props

```typescript
// React Flow 커스텀 노드이므로 NodeProps<FileNodeData>를 사용
import { NodeProps } from '@xyflow/react';

interface FileNodeData {
  file: ChangedFile;
  label: string;               // 파일명만 (경로 제외)
  directory: string;            // 상위 경로
  canAnalyze: boolean;          // false이면 "분석 불가" 표시
  hasSavedSummary: boolean;
  onCodeView: (file: ChangedFile) => void;
  onAISummary: (file: ChangedFile) => void;
}

type FileNodeProps = NodeProps<FileNodeData>;
```

---

## 렌더링 구조

```
FileNode (React Flow NodeWrapper)
├── Handle (target - 들어오는 엣지 연결점)
├── FileStatusBadge  (A/M/D/R)
├── 파일명 텍스트
├── SavedBadge (hasSavedSummary = true 시)
├── [분석 불가] 툴팁 (isAnalyzable = false 시)
└── FileActionButtons (호버 시만 표시)
    ├── [코드 보기]
    └── [AI 정리 보기]
└── Handle (source - 나가는 엣지 연결점)
```

---

## States

| 상태 | 조건 | 시각 표현 |
|------|------|---------|
| `default` | 기본 | 일반 노드 배경 |
| `hover` | 마우스 오버 | `FileActionButtons` 표시, 배경 밝아짐 |
| `no-analysis` | `canAnalyze = false` | 점선 테두리, 툴팁 "의존 관계 분석 불가" |
| `deleted` | `file.status = "D"` | 파일명 취소선 |

---

## CSS

```css
.file-node {
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 6px;
  padding: 8px 12px;
  min-width: 120px;
  max-width: 200px;
  position: relative;
}
.file-node.selected {
  border-color: var(--vscode-focusBorder);
  box-shadow: 0 0 0 1px var(--vscode-focusBorder);
}
.file-node.not-analyzable {
  border-color: var(--vscode-disabledForeground);
  opacity: 0.7;
}
.file-node-name {
  font-size: 12px;
  font-family: var(--vscode-editor-font-family, monospace);
  color: var(--vscode-editor-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

---

## Accessibility

- `aria-label="{파일명} 노드. 상태: {status 레이블}"`.
- `canAnalyze = false` 시 `title="의존 관계 분석 불가 (JS/TS 외 파일)"` 툴팁.
- `[코드 보기]` 버튼: `aria-label="{파일명} 코드 보기"`.
- `[AI 정리 보기]` 버튼: `aria-label="{파일명} AI 정리 보기"`.

---

## References

- [DependencyGraph.md](./DependencyGraph.md)
- [F04_DependencyCanvas spec.md](../features/F04_dependency_canvas/spec.md)
- [FileStatusBadge.md](./FileStatusBadge.md)
- [SavedBadge.md](./SavedBadge.md)
- [FileActionButtons.md](./FileActionButtons.md)
