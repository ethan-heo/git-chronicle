# Implementation Prompt: F03_CodeViewer

> Claude Code 또는 Cursor에 직접 입력하여 구현을 생성하는 프롬프트

---

## Technical Context

- **diff 데이터**: Extension Host에서 `simple-git show --format= --find-renames --unified=3 {hash} -- {file}`로 커밋 내 파일 diff 추출
- **구문 강조**: Webview에서 `Shiki` fine-grained bundle을 lazy import하여 diff 라인 코드 토큰에만 적용
- **출력 전용**: 상태 변경 없음 (read-only)
- **현재 구현 위치**: S03 화면은 `src/webview/features/F03/` 내부에 feature-local screen으로 구현한다.

---

## Files to Create / Modify

| 파일 | 역할 |
|------|------|
| `src/extension/gitService.ts` | `fetchFileDiff()` 함수 추가 |
| `src/extension/messageHandler.ts` | `FETCH_FILE_DIFF` / `FILE_DIFF_LOADED` / `FILE_DIFF_LOAD_FAILED` 메시지 처리 |
| `src/webview/features/F03/types.ts` | diff line, highlight token, payload 타입 |
| `src/webview/features/F03/parseDiff.ts` | unified diff 파싱 및 old/new line number 계산 |
| `src/webview/features/F03/highlightDiff.ts` | Shiki highlighter lazy chunk 구성 |
| `src/webview/features/F03/DiffViewer.tsx` | diff 렌더링 컨테이너 |
| `src/webview/features/F03/DiffLine.tsx` | 개별 diff 라인 컴포넌트 |
| `src/webview/features/F03/S03_CodeViewerScreen.tsx` | S03 화면 조합 컴포넌트 |
| `src/webview/features/F03/index.ts` | F03 barrel export |
| `src/webview/App.tsx` | `currentScreen === "S03"` 라우팅 연결 |
| `src/webview/styles.css` | diff viewer 레이아웃, line number, added/removed 배경 |
| `tests/unit/parseDiff.test.ts` | unified diff 파서 회귀 테스트 |

---

## TypeScript Interfaces

```typescript
type DiffLineType = 'added' | 'removed' | 'context';

interface DiffLineData {
  type: DiffLineType;
  content: string;    // 앞의 +/-/ 제거한 실제 내용
  oldLineNumber: number | null;
  newLineNumber: number | null;
  tokens: HighlightToken[];
}

interface DiffViewerProps {
  diffLines: DiffLineData[];
  filePath: string;
  isLoading: boolean;
  error: string | null;
  isBinaryFile: boolean;
  isDeletedFile: boolean;
  onRetry: () => void;
}

interface DiffLineProps {
  line: DiffLineData;
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

  const rawDiff = await git.show([
    '--format=',
    '--find-renames',
    '--unified=3',
    commitHash,
    '--',
    filePath,
  ]);
  const isBinary = /^Binary files? /m.test(rawDiff) || /^GIT binary patch$/m.test(rawDiff);
  const isDeleted = /^deleted file mode /m.test(rawDiff);

  return { rawDiff: isBinary ? '' : rawDiff, isBinary, isDeleted };
}
```

Extension Host 메시지 핸들러:
```typescript
case 'FETCH_FILE_DIFF': {
  const result = await fetchFileDiff(repoPath, payload.commitHash, payload.filePath);
  panel.webview.postMessage({ type: 'FILE_DIFF_LOADED', payload: result });
  break;
}
```

---

## Webview Implementation

### Diff 파싱 유틸리티

```typescript
// src/webview/features/F03/parseDiff.ts
export function parseDiff(rawDiff: string): DiffLineData[] {
  // @@ -old,+new hunk header를 기준으로 old/new line number를 계산한다.
  // diff metadata(diff --git, index, ---/+++)는 렌더링 대상에서 제외한다.
}
```

### Shiki 하이라이팅

- `S03_CodeViewerScreen.tsx`에서 diff load 완료 후 `await import('./highlightDiff')`로 하이라이터를 지연 로드한다.
- `highlightDiff.ts`는 `shiki/core`, `shiki/engine/javascript`, `shiki/langs/*.mjs`, `shiki/themes/dark-plus.mjs`를 직접 import한다.
- 현재 지원 확장자: `ts`, `tsx`, `js`, `jsx`, `json`, `css`, `html`, `md`, `mdx`, `yaml`, `yml`.
- 알 수 없는 확장자는 `text`로 처리하여 plain text로 렌더링한다.

### `DiffLine.tsx`

```tsx
const LINE_PREFIX: Record<DiffLineType, string> = {
  added: '+',
  removed: '-',
  context: ' ',
};

export const DiffLine: FC<DiffLineProps> = ({ line }) => (
  <div className={`diff-line diff-line-${line.type}`} role="listitem">
    <span className="diff-line-number" aria-hidden="true">{line.oldLineNumber ?? ''}</span>
    <span className="diff-line-number" aria-hidden="true">{line.newLineNumber ?? ''}</span>
    <span className="diff-line-prefix" aria-hidden="true">{LINE_PREFIX[line.type]}</span>
    <code className="diff-line-content">
      {line.tokens.map((token, index) => (
        <span key={`${index}-${token.content}`} style={token.color ? { color: token.color } : undefined}>
          {token.content || ' '}
        </span>
      ))}
    </code>
  </div>
);
```

### `DiffViewer.tsx`

```tsx
export const DiffViewer: React.FC<DiffViewerProps> = ({
  diffLines, filePath, isLoading, error, isBinaryFile, isDeletedFile, onRetry
}) => {
  if (isLoading) return <LoadingState label="코드 변경이력을 불러오는 중..." size="lg" />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (isBinaryFile) return <EmptyState message="Binary file — diff를 표시할 수 없습니다" />;

  return (
    <section className="diff-viewer" role="region" aria-label={`${filePath} 코드 변경 내역`} tabIndex={0}>
      {isDeletedFile ? <div className="diff-deleted-notice" role="alert">삭제된 파일입니다</div> : null}
      <div className="diff-line-list" role="list">
        {diffLines.map((line, index) => <DiffLine key={`${index}-${line.type}`} line={line} />)}
      </div>
    </section>
  );
};
```

### `S03_CodeViewerScreen.tsx`

```tsx
export const S03CodeViewerScreen: FC = () => {
  const selectedCommit = useAppStore((state) => state.selectedCommit);
  const selectedFile = useAppStore((state) => state.selectedFile);
  const [diffState, setDiffState] = useState<FileDiffState>(initialDiffState);

  const applyLoadedDiff = async (payload: FileDiffPayload, filePath: string) => {
    if (payload.isBinary) {
      setDiffState({ ...initialDiffState, isBinaryFile: true });
      return;
    }

    const parsedLines = parseDiff(payload.rawDiff);
    const { highlightDiffLines } = await import('./highlightDiff');
    const highlightedLines = await highlightDiffLines(parsedLines, filePath);
    setDiffState({ ...initialDiffState, diffLines: highlightedLines, isDeletedFile: payload.isDeleted });
  };

  useEffect(() => {
    if (!selectedFile || !selectedCommit) return;
    setDiffState({ ...initialDiffState, isLoading: true });
    postMessage('FETCH_FILE_DIFF', {
      commitHash: selectedCommit.hash,
      filePath: selectedFile.path,
    });
  }, [selectedFile, selectedCommit]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data.type !== 'FILE_DIFF_LOADED') return;
      void applyLoadedDiff(event.data.payload, selectedFile.path);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [selectedFile]);

  if (!selectedCommit || !selectedFile) return null;

  return (
    <main className="app-shell commit-log-shell code-viewer-shell">
      <TopHeader title={selectedCommit.message} context={`${selectedCommit.shortHash} > ${selectedFile.path}`} showBackButton showSettingsIcon />
      <DiffViewer
        diffLines={diffState.diffLines}
        filePath={selectedFile.path}
        isLoading={diffState.isLoading}
        error={diffState.error}
        isBinaryFile={diffState.isBinaryFile}
        isDeletedFile={diffState.isDeletedFile}
        onRetry={loadFileDiff}
      />
    </main>
  );
};
```

---

## Business Rules

1. diff는 `unified=3` 컨텍스트 라인 포함 (앞뒤 3줄)
2. `@@` 헤더 라인, `diff --git`, `index`, `---`, `+++`, rename metadata는 렌더링에서 제외
3. 이진 파일: `BinaryFileNotice` 표시, diff 없음
4. 삭제된 파일: `DeletedFileNotice` + 삭제 전 내용 diff 표시
5. 이 화면은 Side Effect 없음 (read-only)
6. Shiki 하이라이팅 실패 시 토큰 없는 plain text diff로 fallback
7. 브라우저 개발 모드에서는 VSCode API가 없으므로 S03 데모 diff를 사용

---

## Verification

F03 구현 또는 수정 후 다음 검증을 실행한다.

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

`pnpm build`에서 `highlightDiff.js` chunk size warning이 발생할 수 있다. 현재는 F03 진입 시점에만 로드되는 lazy chunk이므로 기능 검증 실패로 보지 않는다.

---

## CSS Variables to Use

```css
.diff-viewer {
  font-family: var(--vscode-editor-font-family);
  font-size: var(--vscode-editor-font-size);
  background: var(--vscode-editor-background);
  overflow: auto;
}
.diff-line {
  display: grid;
  grid-template-columns: 48px 48px 18px minmax(0, 1fr);
  white-space: pre;
}
.diff-line-added { background: var(--gae-color-diff-added); }
.diff-line-removed { background: var(--gae-color-diff-removed); }
.diff-line-prefix { color: var(--vscode-descriptionForeground); user-select: none; }
.diff-deleted-notice { color: var(--vscode-descriptionForeground); padding: 8px 12px; }
```

---

## References

- [F03 spec.md](./spec.md)
- [F03 blueprint.md](./blueprint.md)
- [project/architecture.md](../../project/architecture.md)
- [core/state_model.md](../../core/state_model.md)
- [core/global_components.md](../../core/global_components.md)
