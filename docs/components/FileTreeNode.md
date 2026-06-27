# Component: FileTreeNode

변경 파일 트리(S02_HistoryViewScreen)에서 디렉토리 또는 파일 하나를 나타내는 재귀 렌더링 노드 컴포넌트.

---

## Props

```typescript
interface FileTreeNodeProps {
  node: TreeNode;
  depth: number;               // 들여쓰기 깊이 (0부터 시작)
  savePath: string | null;     // 저장됨 뱃지 표시 여부 판단에 사용
  commitHash: string;          // 저장됨 뱃지 판단 시 커밋 해시 경로 확인에 사용
  onCodeView: (file: ChangedFile) => void;
  onAIView: (file: ChangedFile) => void;
}

interface TreeNode {
  name: string;                // 파일명 또는 디렉토리명
  type: 'file' | 'directory';
  file?: ChangedFile;          // type === 'file' 일 때만 존재
  children?: TreeNode[];       // type === 'directory' 일 때만 존재
}

interface ChangedFile {
  path: string;
  status: 'A' | 'M' | 'D' | 'R';
  hasSavedSummary: boolean;
}
```

---

## 렌더링 구조

```
FileTreeNode (디렉토리)
├── [▶/▼] 디렉토리명
└── (하위 자식 노드 재귀 렌더링)
    └── FileTreeNode (파일)
        ├── FileStatusBadge  (A/M/D/R)
        ├── 파일명
        ├── SavedBadge       (조건 충족 시)
        └── FileActionButtons (호버 시만 표시)
            ├── [코드 보기] 버튼
            └── [AI 정리 보기] 버튼
```

---

## States

| 상태 | 조건 | 동작 |
|------|------|------|
| `collapsed` | 디렉토리 기본 | 자식 노드 숨김 |
| `expanded` | 디렉토리 클릭 | 자식 노드 표시 |
| `hover` | 파일 노드 마우스 오버 | `FileActionButtons` 표시 |
| `default` | 파일 노드 기본 | `FileActionButtons` 숨김 |

---

## Business Rules

- 디렉토리 노드: 클릭 시 접힘/펼침 토글.
- 파일 노드: `FileStatusBadge`로 파일 상태(A/M/D/R)를 항상 표시.
- `SavedBadge` 표시 조건: `savePath !== null` AND `file.hasSavedSummary === true`.
- 호버 시에만 `FileActionButtons`가 나타남. 기본 상태에서는 숨겨 가독성 유지.
- 들여쓰기: `depth * 16px` (CSS `padding-left` 기반).

---

## CSS

```css
.file-tree-node {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  cursor: pointer;
  position: relative;
}
.file-tree-node:hover {
  background: var(--vscode-list-hoverBackground);
}
.file-tree-node-actions {
  display: none;
  position: absolute;
  right: 8px;
}
.file-tree-node:hover .file-tree-node-actions {
  display: flex;
  gap: 4px;
}
```

---

## Accessibility

- 파일 노드: `role="listitem"`, `tabIndex={0}`, `aria-label="{파일명} - {status 레이블}"`.
- 디렉토리 노드: `role="treeitem"`, `aria-expanded={isExpanded}`.
- [코드 보기] 버튼: `aria-label="{파일명} 코드 보기"`.
- [AI 정리 보기] 버튼: `aria-label="{파일명} AI 정리 보기"`.

---

## References

- [F02_ChangedFileTree spec.md](../features/F02_changed_file_tree/spec.md)
- [FileStatusBadge.md](./FileStatusBadge.md)
- [SavedBadge.md](./SavedBadge.md)
- [FileActionButtons.md](./FileActionButtons.md)
