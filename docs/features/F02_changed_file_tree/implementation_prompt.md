# Implementation Prompt: F02_ChangedFileTree

> Claude Code 또는 Cursor에 직접 입력하여 구현을 생성하는 프롬프트

---

## Technical Context

- **Git 접근**: `simple-git.raw(['diff-tree', '--no-commit-id', '--name-status', '-r', '--root', commitHash])`로 변경 파일 목록 추출
- **파일 존재 확인**: Extension Host에서 `fs.existsSync()` 사용
- **상태 관리**: Zustand 전역 상태 (`changedFiles`, `selectedFile`)
- **브라우저 개발 모드**: VSCode API가 없으면 `demoChangedFiles`로 S02 UI 확인

---

## Files to Create / Modify

| 파일 | 역할 |
|------|------|
| `src/extension/gitService.ts` | `fetchChangedFiles()` 함수 추가 |
| `src/extension/messageHandler.ts` | `FETCH_CHANGED_FILES` 메시지 처리 |
| `src/webview/features/F02/CommitActionBar.tsx` | 커밋 액션 버튼 모음 |
| `src/webview/features/F02/FileTree.tsx` | 변경 파일 트리 컨테이너 |
| `src/webview/features/F02/DirectoryNode.tsx` | 디렉토리 노드 (토글) |
| `src/webview/features/F02/FileTreeNode.tsx` | 개별 파일 노드 |
| `src/webview/features/F02/tree.ts` | 트리 구성 유틸리티 |
| `src/webview/shared/components/FileStatusBadge.tsx` | A/M/D/R 상태 뱃지 |
| `src/webview/features/F02/S02_HistoryViewScreen.tsx` | S02 화면 조합 컴포넌트 |
| `src/webview/App.tsx` | S02 라우팅 및 후속 화면 전환 |

---

## TypeScript Interfaces

```typescript
// src/types/index.ts

type FileStatus = 'A' | 'M' | 'D' | 'R';

interface ChangedFile {
  path: string;            // 파일 경로 (이름 변경 시 새 경로)
  oldPath?: string;        // 이름 변경 시 기존 경로
  status: FileStatus;
  hasSavedSummary: boolean;
}

// 트리 구성용 내부 타입
interface DirectoryTreeNode {
  name: string;
  path: string;
  children: (DirectoryTreeNode | FileTreeLeaf)[];
}

interface FileTreeLeaf {
  name: string;
  file: ChangedFile;
}
```

---

## Extension Host Implementation

### `fetchChangedFiles()` in `gitService.ts`

```typescript
export async function fetchChangedFiles(
  repoPath: string,
  commitHash: string,
  savePath: string | null
): Promise<ChangedFile[]> {
  const git = simpleGit(repoPath);
  const output = await git.raw([
    'diff-tree',
    '--no-commit-id',
    '--name-status',
    '-r',
    '--root',
    commitHash,
  ]);

  return output.split('\n').map(line => {
    const [rawStatus, firstPath, secondPath] = line.trim().split('\t');
    const status = rawStatus.charAt(0) as FileStatus;
    const filePath = status === 'R' ? secondPath : firstPath;

    return {
      path: filePath,
      oldPath: status === 'R' ? firstPath : undefined,
      status,
      hasSavedSummary: hasSavedSummary(savePath, commitHash, filePath, commitMessage),
    };
  });
}
```

Extension Host 메시지 핸들러:
```typescript
case 'FETCH_CHANGED_FILES': {
  const files = await fetchChangedFiles(repoPath, message.payload.commitHash, message.payload.savePath, message.payload.commitMessage);
  panel.webview.postMessage({ type: 'CHANGED_FILES_LOADED', payload: { files } });
  break;
}
```

---

## Webview Implementation

### 트리 구성 유틸리티

```typescript
// src/webview/features/F02/tree.ts
export function buildFileTree(files: ChangedFile[]): DirectoryTreeNode {
  const root: DirectoryTreeNode = { name: '', path: '', children: [] };

  for (const file of files) {
    const parts = file.path.split('/');
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const dirName = parts[i];
      let child = node.children.find(
        c => 'children' in c && c.name === dirName
      ) as DirectoryTreeNode | undefined;
      if (!child) {
        child = { name: dirName, path: parts.slice(0, i + 1).join('/'), children: [] };
        node.children.push(child);
      }
      node = child;
    }
    node.children.push({ name: parts[parts.length - 1], file });
  }

  return root;
}
```

### `FileStatusBadge.tsx`

```tsx
const STATUS_COLORS: Record<FileStatus, string> = {
  A: 'var(--vscode-gitDecoration-addedResourceForeground)',
  M: 'var(--vscode-gitDecoration-modifiedResourceForeground)',
  D: 'var(--vscode-gitDecoration-deletedResourceForeground)',
  R: 'var(--vscode-gitDecoration-renamedResourceForeground)',
};

export const FileStatusBadge: React.FC<{ status: FileStatus }> = ({ status }) => (
  <span
    className="file-status-badge"
    style={{ color: STATUS_COLORS[status] }}
    aria-label={`파일 상태: ${status}`}
  >
    {status}
  </span>
);
```

### `FileTreeNode.tsx`

```tsx
export const FileTreeNode: React.FC<FileTreeNodeProps> = ({ file, onCodeView, onAIView }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`file-tree-node ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="treeitem"
      aria-label={`${file.path} (${file.status})`}
    >
      <FileStatusBadge status={file.status} />
      <span className="file-name">{file.path.split('/').pop()}</span>
      {file.hasSavedSummary && <SavedBadge />}
      {isHovered && (
        <FileActionButtons
          onCodeView={() => onCodeView(file)}
          onAIView={() => onAIView(file)}
        />
      )}
    </div>
  );
};
```

### `DirectoryNode.tsx`

```tsx
export const DirectoryNode: React.FC<DirectoryNodeProps> = ({ node, onCodeView, onAIView }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="directory-node" role="treeitem" aria-expanded={isExpanded}>
      <div className="directory-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="directory-toggle">{isExpanded ? '▼' : '▶'}</span>
        <span className="directory-name">{node.name}</span>
      </div>
      {isExpanded && (
        <div className="directory-children" role="group">
          {node.children.map(child =>
            'children' in child
              ? <DirectoryNode key={child.path} node={child} onCodeView={onCodeView} onAIView={onAIView} />
              : <FileTreeNode key={child.file.path} file={child.file} onCodeView={onCodeView} onAIView={onAIView} />
          )}
        </div>
      )}
    </div>
  );
};
```

### `CommitActionBar.tsx`

```tsx
export const CommitActionBar: React.FC<CommitActionBarProps> = ({
  onCommitAISummary, onBatchAISummary, onCanvasView, isBatchRunning
}) => (
  <div className="commit-action-bar" role="toolbar">
    <PrimaryButton onClick={onCommitAISummary}>커밋 AI 정리</PrimaryButton>
    <PrimaryButton onClick={onBatchAISummary} disabled={isBatchRunning}>
      {isBatchRunning ? '일괄 생성 중...' : '전체 파일 AI 정리'}
    </PrimaryButton>
    <PrimaryButton onClick={onCanvasView}>캔버스 보기</PrimaryButton>
  </div>
);
```

---

## State Updates (Zustand)

```typescript
// 선택된 파일 설정 + 화면 전환
selectFileForCode: (file: ChangedFile) => set({
  selectedFile: file,
  currentScreen: 'S03',
}),

selectFileForAI: (file: ChangedFile) => set({
  selectedFile: file,
  currentScreen: 'S04',
  summaryMode: 'file',
}),

goToCommitAISummary: () => set({
  currentScreen: 'S04',
  summaryMode: 'commit',
}),
```

현재 S-03은 `features/F03/S03_CodeViewerScreen.tsx`에서 실제 코드 뷰어로 렌더링된다. S-04는 `features/F05/S04_AISummaryViewerScreen.tsx`에서 파일 단위 AI 요약 뷰어로 렌더링되며 `START_AI_SUMMARY_FILE` 메시지를 사용한다. S-05는 `features/F04/S05_DependencyCanvasScreen.tsx`에서 실제 의존성 캔버스로 렌더링된다.

---

## Business Rules

1. `git diff-tree --name-status --root`의 첫 번째 컬럼이 상태 코드 (`A`/`M`/`D`/`R`)
2. `R`(이름 변경)은 `oldPath -> newPath` 형식이므로 두 경로 모두 저장
3. `hasSavedSummary` 확인은 Extension Host에서 수행 (Webview는 파일시스템 접근 불가)
4. 디렉토리 노드는 기본 `isExpanded = true`
5. [전체 파일 AI 정리] 버튼은 `isBatchRunning === true`이면 비활성화

---

## Error Handling

| 상황 | 처리 |
|------|------|
| 변경 파일 로드 실패 | `ErrorState`: "변경 파일 목록을 불러오지 못했습니다" + [재시도] |
| 변경 파일 없음 | `EmptyState`: "변경된 파일이 없습니다" |
| 첫 커밋 (부모 없음) | `diff-tree --root`로 루트 커밋 변경 파일까지 조회 |

---

## CSS Variables to Use

```css
.file-tree-node:hover { background: var(--vscode-list-hoverBackground); }
.file-tree-node { color: var(--vscode-editor-foreground); }
.directory-name { color: var(--vscode-editor-foreground); font-weight: 500; }
.directory-toggle { color: var(--vscode-descriptionForeground); }
```

---

## References

- [F02 spec.md](./spec.md)
- [F02 blueprint.md](./blueprint.md)
- [project/architecture.md](../../project/architecture.md)
- [core/state_model.md](../../core/state_model.md)
- [core/global_components.md](../../core/global_components.md)
