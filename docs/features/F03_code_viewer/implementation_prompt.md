# Implementation Prompt: F03_CodeViewer

> Claude Code 또는 Cursor에 직접 입력하여 구현을 생성하는 프롬프트

---

## Technical Context

- **diff 데이터**: Extension Host에서 `simple-git show {hash}:{file}` 또는 `git diff {hash}^ {hash} -- {file}`로 unified diff 추출
- **구문 강조**: Webview에서 `Shiki` 라이브러리로 diff 라인 하이라이팅
- **출력 전용**: 상태 변경 없음 (read-only)

---

## Files to Create / Modify

| 파일 | 역할 |
|------|------|
| `src/extension/gitService.ts` | `fetchFileDiff()` 함수 추가 |
| `src/webview/features/F03/DiffViewer.tsx` | diff 렌더링 컨테이너 |
| `src/webview/features/F03/DiffLine.tsx` | 개별 diff 라인 컴포넌트 |
| `src/webview/screens/S03_CodeViewerScreen.tsx` | S03 화면 조합 컴포넌트 |

---

## TypeScript Interfaces

```typescript
type DiffLineType = 'added' | 'removed' | 'context';

interface DiffLineData {
  type: DiffLineType;
  content: string;    // 앞의 +/-/ 제거한 실제 내용
  lineNumber?: number; // context/added는 새 파일 기준, removed는 기존 파일 기준
}

interface DiffViewerProps {
  selectedFile: ChangedFile;
  selectedCommit: Commit;
  diffLines: DiffLineData[];
  isLoading: boolean;
  isBinaryFile: boolean;
  isDeletedFile: boolean;
}

interface DiffLineProps {
  line: DiffLineData;
  index: number;
}
```

---

## Extension Host Implementation

### `fetchFileDiff()` in `gitService.ts`

```typescript
export async function fetchFileDiff(
  repoPath: string,
  commitHash: string,
  filePath: string
): Promise<{ rawDiff: string; isBinary: boolean; isDeleted: boolean }> {
  const git = simpleGit(repoPath);

  // 이진 파일 감지
  const isBinary = await isFileBinary(repoPath, commitHash, filePath);
  if (isBinary) return { rawDiff: '', isBinary: true, isDeleted: false };

  const parentHash = `${commitHash}^`;
  try {
    // unified diff 추출
    const diff = await git.diff([
      '--unified=3',
      parentHash,
      commitHash,
      '--',
      filePath,
    ]);
    const isDeleted = diff.includes('deleted file mode');
    return { rawDiff: diff, isBinary: false, isDeleted };
  } catch {
    // 첫 커밋인 경우 show 사용
    const content = await git.show([`${commitHash}:${filePath}`]);
    return { rawDiff: content, isBinary: false, isDeleted: false };
  }
}
```

Extension Host 메시지 핸들러:
```typescript
case 'fetchFileDiff': {
  const result = await fetchFileDiff(repoPath, message.commitHash, message.filePath);
  panel.webview.postMessage({ command: 'fileDiffLoaded', ...result });
  break;
}
```

---

## Webview Implementation

### Diff 파싱 유틸리티

```typescript
// src/webview/utils/parseDiff.ts
export function parseDiff(rawDiff: string): DiffLineData[] {
  return rawDiff
    .split('\n')
    .filter(line => !line.startsWith('@@') && !line.startsWith('diff ') && !line.startsWith('index '))
    .map(line => {
      if (line.startsWith('+') && !line.startsWith('+++')) {
        return { type: 'added' as const, content: line.slice(1) };
      }
      if (line.startsWith('-') && !line.startsWith('---')) {
        return { type: 'removed' as const, content: line.slice(1) };
      }
      return { type: 'context' as const, content: line.startsWith(' ') ? line.slice(1) : line };
    });
}
```

### `DiffLine.tsx`

```tsx
const LINE_STYLES: Record<DiffLineType, React.CSSProperties> = {
  added: { background: 'var(--vscode-diffEditor-insertedLineBackground)' },
  removed: { background: 'var(--vscode-diffEditor-removedLineBackground)' },
  context: { background: 'transparent' },
};

const LINE_PREFIX: Record<DiffLineType, string> = {
  added: '+',
  removed: '-',
  context: ' ',
};

export const DiffLine: React.FC<DiffLineProps> = ({ line, index }) => (
  <div
    className={`diff-line diff-line--${line.type}`}
    style={LINE_STYLES[line.type]}
    aria-label={`${line.type === 'added' ? '추가' : line.type === 'removed' ? '삭제' : '컨텍스트'} 라인`}
  >
    <span className="diff-line-prefix" aria-hidden="true">
      {LINE_PREFIX[line.type]}
    </span>
    <code className="diff-line-content">{line.content}</code>
  </div>
);
```

### `DiffViewer.tsx`

```tsx
export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffLines, isLoading, isBinaryFile, isDeletedFile
}) => {
  if (isLoading) return <LoadingState />;
  if (isBinaryFile) return <div className="binary-notice">이진 파일은 diff를 표시할 수 없습니다.</div>;
  if (isDeletedFile) return (
    <div className="deleted-notice">
      <p>삭제된 파일입니다.</p>
      {diffLines.length > 0 && (
        <div className="diff-container" role="list">
          {diffLines.map((line, i) => <DiffLine key={i} line={line} index={i} />)}
        </div>
      )}
    </div>
  );

  return (
    <div className="diff-viewer" role="list" aria-label="파일 diff">
      {diffLines.map((line, i) => <DiffLine key={i} line={line} index={i} />)}
    </div>
  );
};
```

### `S03_CodeViewerScreen.tsx`

```tsx
export const S03_CodeViewerScreen: React.FC = () => {
  const { selectedFile, selectedCommit } = useAppStore();
  const [diffLines, setDiffLines] = useState<DiffLineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBinaryFile, setIsBinaryFile] = useState(false);
  const [isDeletedFile, setIsDeletedFile] = useState(false);

  useEffect(() => {
    if (!selectedFile || !selectedCommit) return;
    setIsLoading(true);
    window.vscode.postMessage({
      command: 'fetchFileDiff',
      commitHash: selectedCommit.hash,
      filePath: selectedFile.path,
    });
  }, [selectedFile, selectedCommit]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data.command !== 'fileDiffLoaded') return;
      const { rawDiff, isBinary, isDeleted } = event.data;
      setIsBinaryFile(isBinary);
      setIsDeletedFile(isDeleted);
      setDiffLines(parseDiff(rawDiff));
      setIsLoading(false);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const breadcrumb = `${selectedCommit?.message} > ${selectedFile?.path}`;

  return (
    <div className="screen s03-code-viewer-screen">
      <TopHeader title={breadcrumb} showBack showSettings />
      <DiffViewer
        diffLines={diffLines}
        isLoading={isLoading}
        isBinaryFile={isBinaryFile}
        isDeletedFile={isDeletedFile}
        selectedFile={selectedFile!}
        selectedCommit={selectedCommit!}
      />
    </div>
  );
};
```

---

## Business Rules

1. diff는 `unified=3` 컨텍스트 라인 포함 (앞뒤 3줄)
2. `@@` 헤더 라인, `diff --git`, `index` 라인은 렌더링에서 제외
3. 이진 파일: `BinaryFileNotice` 표시, diff 없음
4. 삭제된 파일: `DeletedFileNotice` + 삭제 전 내용 diff 표시
5. 이 화면은 Side Effect 없음 (read-only)
6. Shiki 하이라이팅은 선택적 강화 — 필수 아님 (v1.0에서 plain text로 시작 가능)

---

## CSS Variables to Use

```css
.diff-viewer {
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-editor-font-size);
  background: var(--vscode-editor-background);
  overflow-y: auto;
}
.diff-line--added { background: var(--vscode-diffEditor-insertedLineBackground); }
.diff-line--removed { background: var(--vscode-diffEditor-removedLineBackground); }
.diff-line-prefix { color: var(--vscode-descriptionForeground); user-select: none; }
.binary-notice, .deleted-notice { color: var(--vscode-descriptionForeground); padding: 16px; }
```

---

## References

- [F03 spec.md](./spec.md)
- [F03 blueprint.md](./blueprint.md)
- [project/architecture.md](../../project/architecture.md)
- [core/state_model.md](../../core/state_model.md)
- [core/global_components.md](../../core/global_components.md)
