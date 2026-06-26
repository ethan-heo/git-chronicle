# Implementation Prompt: F01_CommitLog

> Claude Code 또는 Cursor에 직접 입력하여 구현을 생성하는 프롬프트

---

## Technical Context

- **Git 접근**: Extension Host에서 `simple-git` 라이브러리로 `git log` 실행

---

## Files to Create / Modify

| 파일 | 역할 |
|------|------|
| `src/extension/gitService.ts` | `simple-git` 기반 `fetchCommits()` 함수 |
| `src/webview/store/appStore.ts` | 전역 상태 정의 (Zustand) |
| `src/webview/features/F01/CommitFilterPanel.tsx` | 필터 패널 컴포넌트 |
| `src/webview/features/F01/DateRangeFilter.tsx` | 날짜 범위 입력 컴포넌트 |
| `src/webview/features/F01/AuthorDropdown.tsx` | 작성자 드롭다운 컴포넌트 |
| `src/webview/features/F01/KeywordSearchInput.tsx` | 키워드 검색 입력 컴포넌트 |
| `src/webview/features/F01/CommitList.tsx` | 커밋 목록 컴포넌트 |
| `src/webview/features/F01/CommitListItem.tsx` | 개별 커밋 행 컴포넌트 |
| `src/webview/features/F01/InfiniteScrollTrigger.tsx` | Intersection Observer 트리거 |
| `src/webview/features/F01/S01_CommitListScreen.tsx` | S01 화면 조합 컴포넌트 |
| `src/webview/types/commit.ts` | `Commit`, `FilterState`, `ScreenID` 타입 |

---

## TypeScript Interfaces

```typescript
// src/webview/types/commit.ts

interface Commit {
  hash: string;          // 전체 SHA
  shortHash: string;     // 앞 7자
  message: string;       // 커밋 메시지 (첫 줄)
  author: string;        // 작성자 이름
  date: string;          // ISO 8601 형식
}

interface FilterState {
  filterDateStart: string | null;
  filterDateEnd: string | null;
  filterAuthor: string | null;
  filterKeyword: string;
}

interface AppState extends FilterState {
  commitList: Commit[];
  authorList: string[];
  selectedCommit: Commit | null;
  commitPage: number;
  hasMoreCommits: boolean;
  isLoadingCommits: boolean;
  isGitRepoDetected: boolean;
  currentScreen: ScreenID;
  commitLoadError: string | null;
  loadMoreError: string | null;
  hasLoadedCommits: boolean;
}
```

---

## Extension Host Implementation

### `src/extension/gitService.ts`

```typescript
import simpleGit from 'simple-git';

interface FetchCommitsOptions {
  repoPath: string;
  page: number;           // 0-based
  pageSize?: number;      // 기본 200
  dateStart?: string | null;
  dateEnd?: string | null;
  author?: string | null;
  keyword?: string;
}

export async function fetchCommits(opts: FetchCommitsOptions): Promise<Commit[]> {
  const git = simpleGit(opts.repoPath);
  const pageSize = opts.pageSize ?? 200;

  const args: string[] = [
    'log',
    `--max-count=${pageSize}`,
    `--skip=${opts.page * pageSize}`,
    '--date=iso-strict',
    '--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%aI%x1e',
  ];

  if (opts.dateStart) args.push(`--after=${opts.dateStart}`);
  if (opts.dateEnd) args.push(`--before=${opts.dateEnd}`);
  if (opts.author) args.push(`--author=${opts.author}`);
  if (opts.keyword) args.push(`--grep=${opts.keyword}`);

  const output = await git.raw(args);

  // 구현에서는 제어 문자 구분자 기반 raw log를 파싱한다.
  return parseRawLog(output);
}
```

Extension Host에서 Webview 메시지 핸들러:
```typescript
case 'FETCH_COMMITS': {
  const commits = await fetchCommits({ repoPath, ...message.payload });
  panel.webview.postMessage({
    type: 'COMMITS_LOADED',
    payload: { commits, page: message.payload.page, pageSize: message.payload.pageSize },
  });
  break;
}
case 'OPEN_REPOSITORY': {
  await vscode.commands.executeCommand('vscode.openFolder');
  break;
}
```

---

## Webview Implementation

### 상태 (Zustand)

```typescript
// src/webview/store/appStore.ts
const useAppStore = create<AppState>((set, get) => ({
  commitList: [],
  authorList: [],
  selectedCommit: null,
  commitPage: 0,
  hasMoreCommits: true,
  isLoadingCommits: false,
  isGitRepoDetected: true,
  filterDateStart: null,
  filterDateEnd: null,
  filterAuthor: null,
  filterKeyword: '',
  currentScreen: 'S01',

  loadCommits: async (reset = false) => {
    const state = get();
    if (state.isLoadingCommits) return;
    set({ isLoadingCommits: true });
    const page = reset ? 0 : state.commitPage;
    // Extension Host로 메시지 전송
    postMessage('FETCH_COMMITS', {
      page,
      pageSize: 200,
      filterDateStart: state.filterDateStart,
      filterDateEnd: state.filterDateEnd,
      filterAuthor: state.filterAuthor,
      filterKeyword: state.filterKeyword,
    });
  },

  setFilter: (filter: Partial<FilterState>) => {
    set({ ...filter, commitPage: 0, commitList: [] });
    get().loadCommits(true);
  },
}));
```

브라우저 개발 서버(`pnpm dev`)에서는 VSCode API가 없으므로 `isVSCodeRuntime()`이 false일 때 데모 커밋 데이터를 사용한다. 이 fallback은 필터·무한 스크롤 UI 확인용이며, Extension Host 실행 시에는 항상 `FETCH_COMMITS` 메시지와 `simple-git` 결과를 사용한다.

### `CommitListItem.tsx`

```tsx
export const CommitListItem: React.FC<CommitListItemProps> = ({ commit, onClick }) => (
  <div
    className="commit-list-item"
    role="listitem"
    tabIndex={0}
    aria-label={`${commit.message} by ${commit.author} on ${commit.date}`}
    onClick={() => onClick(commit)}
    onKeyDown={e => e.key === 'Enter' && onClick(commit)}
  >
    <span className="commit-hash">{commit.shortHash}</span>
    <span className="commit-message">{commit.message}</span>
    <span className="commit-author">{commit.author}</span>
    <span className="commit-date">{commit.date}</span>
  </div>
);
```

### `InfiniteScrollTrigger.tsx`

```tsx
export const InfiniteScrollTrigger: React.FC<InfiniteScrollTriggerProps> = ({
  onTrigger, isEnabled
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEnabled || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) onTrigger();
    }, { threshold: 0.1 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [isEnabled, onTrigger]);

  return <div ref={ref} style={{ height: 1 }} />;
};
```

### `KeywordSearchInput.tsx` — 디바운스 300ms

```tsx
export const KeywordSearchInput: React.FC<KeywordSearchInputProps> = ({
  keyword, onKeywordChange, debounceMs = 300
}) => {
  const [localValue, setLocalValue] = useState(keyword);

  useEffect(() => {
    const timer = setTimeout(() => onKeywordChange(localValue), debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs]);

  return (
    <input
      type="search"
      value={localValue}
      onChange={e => setLocalValue(e.target.value)}
      aria-label="커밋 메시지 키워드 검색"
      placeholder="키워드 검색..."
    />
  );
};
```

---

## Business Rules

1. git log는 항상 커밋 날짜 기준 내림차순 (default)
2. 페이지 크기 200, `--max-count` + `--skip` 기반
3. 로드된 커밋 수 < 200이면 `hasMoreCommits = false`
4. 필터 변경 시 반드시 `commitPage = 0`, `commitList = []`로 초기화 후 재로드
5. `authorList`는 로드된 `commitList`에서 중복 제거 후 추출

---

## Error Handling

| 상황 | 처리 |
|------|------|
| Git 저장소 없음 | `isGitRepoDetected = false` → `EmptyState` 표시 |
| git log 실패 | `ErrorState` + onRetry 콜백 |
| 무한 스크롤 실패 | 인라인 에러 표시, 기존 목록 유지 |

---

## CSS Variables to Use

```css
.commit-list-item:hover {
  background: var(--vscode-list-hoverBackground);
  cursor: pointer;
}
.commit-hash { color: var(--vscode-descriptionForeground); font-family: monospace; }
.commit-message { color: var(--vscode-editor-foreground); }
.commit-author { color: var(--vscode-descriptionForeground); }
.commit-date { color: var(--vscode-descriptionForeground); }
```

---

## References

- [F01 spec.md](./spec.md)
- [F01 blueprint.md](./blueprint.md)
- [project/architecture.md](../../project/architecture.md)
- [project/state_management.md](../../project/state_management.md)
- [core/state_model.md](../../core/state_model.md)
- [core/global_components.md](../../core/global_components.md)
- [core/design_tokens.md](../../core/design_tokens.md)
