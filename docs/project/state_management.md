# State Management — Git Author Explorer

> **버전** v1.0 | **작성일** 2026-06-26 | **상태** 확정

---

## 개요

Git Author Explorer의 상태는 두 레이어에 분리하여 관리한다.

| 레이어 | 상태 종류 | 저장소 |
|--------|-----------|--------|
| Webview (React) | UI 전역 상태 | Zustand 단일 스토어 (`useAppStore`) |
| Extension Host | 설정 영속 상태 | `ExtensionContext.globalState` |
| 컴포넌트 로컬 | hover, 드롭다운 열림 등 UI 전용 상태 | `React.useState` |

---

## Zustand 스토어 구조

```typescript
// src/webview/store/appStore.ts

interface AppState {
  // === Navigation ===
  currentScreen: ScreenID;

  // === Git Repository ===
  isGitRepoDetected: boolean;

  // === Commit ===
  commitList: Commit[];
  selectedCommit: Commit | null;
  isLoadingCommits: boolean;
  hasMoreCommits: boolean;
  commitPage: number;
  commitLoadError: string | null;
  loadMoreError: string | null;
  hasLoadedCommits: boolean;

  // === Filter ===
  filterDateStart: string | null;
  filterDateEnd: string | null;
  filterAuthor: string | null;
  filterKeyword: string;
  authorList: string[];

  // === File ===
  changedFiles: ChangedFile[];
  selectedFile: ChangedFile | null;

  // === AI Summary ===
  isGeneratingSummary: boolean;
  currentSummaryContent: string;
  summaryError: string | null;
  summaryMode: 'file' | 'commit';

  // === Batch AI Summary ===
  isBatchRunning: boolean;
  batchTotal: number;
  batchCurrent: number;
  batchFailedCount: number;
  batchCancelled: boolean;

  // === AI Providers ===
  activeAIProvider: AIProviderName | null;
  registeredProviders: AIProvider[];

  // === Save Path ===
  savePath: string | null;

  // === Actions ===
  loadCommits: (reset?: boolean) => void;
  handleCommitsLoaded: (payload: { commits: Commit[]; page: number; pageSize: number }) => void;
  handleRepositoryNotFound: () => void;
  handleCommitsLoadFailed: (message?: string) => void;
  selectCommit: (commit: Commit) => void;
  goToCommitList: () => void;
  setFilter: (filter: Partial<FilterState>) => void;
  clearFilters: () => void;
  openRepository: () => void;
  setChangedFiles: (files: ChangedFile[]) => void;
  selectFile: (file: ChangedFile) => void;
  appendSummaryChunk: (chunk: string) => void;
  setSummaryError: (message: string | null) => void;
  resetSummary: () => void;
  startBatch: (total: number) => void;
  advanceBatch: () => void;
  failBatchItem: () => void;
  cancelBatch: () => void;
  completeBatch: () => void;
  setActiveAIProvider: (name: AIProviderName | null) => void;
  setRegisteredProviders: (providers: AIProvider[]) => void;
  setSavePath: (path: string | null) => void;
}
```

---

## 액션 정의 및 부수 효과

### loadCommits / handleCommitsLoaded

```typescript
loadCommits: (reset = false) => {
  const state = get();
  if (state.isLoadingCommits) return;

  const page = reset ? 0 : state.commitPage;
  set({
    isLoadingCommits: true,
    loadMoreError: null,
    ...(reset ? { commitList: [], commitPage: 0, hasMoreCommits: true } : {}),
  });

  postMessage('FETCH_COMMITS', {
    page,
    pageSize: 200,
    filterDateStart: state.filterDateStart,
    filterDateEnd: state.filterDateEnd,
    filterAuthor: state.filterAuthor,
    filterKeyword: state.filterKeyword,
  });
},

handleCommitsLoaded: ({ commits, page, pageSize }) => set((state) => {
  const nextCommitList = page === 0 ? commits : [...state.commitList, ...commits];

  return {
    commitList: nextCommitList,
    authorList: [...new Set(nextCommitList.map((commit) => commit.author))],
    commitPage: page + 1,
    hasMoreCommits: commits.length >= pageSize,
    isLoadingCommits: false,
    hasLoadedCommits: true,
  };
}),
```

### selectCommit

커밋 선택 시 선택 커밋을 저장하고 S02로 전환한다.

```typescript
selectCommit: (commit) => set({
  selectedCommit: commit,
  currentScreen: 'S02',
}),

goToCommitList: () => set({ currentScreen: 'S01' }),
```

F02 이후에는 `selectCommit`에서 `selectedFile`, `changedFiles`, `currentSummaryContent`, `summaryError` 초기화가 함께 필요하다.

### appendSummaryChunk

스트리밍 청크를 순차적으로 누적한다.

```typescript
appendSummaryChunk: (chunk) => set((state) => ({
  currentSummaryContent: state.currentSummaryContent + chunk,
  isGeneratingSummary: true,
})),
```

### startBatch / advanceBatch / completeBatch

일괄 처리 진행 상태를 관리한다.

```typescript
startBatch: (total) => set({
  isBatchRunning: true,
  batchTotal: total,
  batchCurrent: 0,
  batchFailedCount: 0,
  batchCancelled: false,
}),

advanceBatch: () => set((state) => ({ batchCurrent: state.batchCurrent + 1 })),

failBatchItem: () => set((state) => ({
  batchCurrent: state.batchCurrent + 1,
  batchFailedCount: state.batchFailedCount + 1,
})),

completeBatch: () => set({
  isBatchRunning: false,
  batchTotal: 0,
  batchCurrent: 0,
  batchFailedCount: 0,
  batchCancelled: false,
}),
```

### setActiveAIProvider

하나를 활성화하면 나머지는 자동 비활성화된다.

```typescript
setActiveAIProvider: (name) => set((state) => ({
  activeAIProvider: name,
  registeredProviders: state.registeredProviders.map((p) => ({
    ...p,
    isActive: p.name === name,
  })),
})),
```

---

## ExtensionContext.globalState (영속 설정)

Extension Host 재시작 후에도 유지해야 하는 설정은 `ExtensionContext.globalState`에 저장한다.

| 키 | 타입 | 설명 |
|---|------|------|
| `gitAuthorExplorer.savePath` | `string \| undefined` | AI 정리 저장 경로 |
| `gitAuthorExplorer.registeredProviders` | `AIProvider[]` | 등록된 AI CLI 목록 |
| `gitAuthorExplorer.activeAIProvider` | `AIProviderName \| undefined` | 활성화된 AI CLI |

Extension 활성화 시 `globalState`에서 값을 읽어 Webview에 초기 상태로 전달한다.

---

## 상태 초기화 규칙

| 트리거 | 초기화 대상 |
|--------|------------|
| `selectedCommit` 변경 | F01에서는 `currentScreen = 'S02'`. F02 이후 `selectedFile`, `changedFiles`, `currentSummaryContent`, `summaryError` 초기화 추가 |
| `isBatchRunning` → `false` | `batchTotal`, `batchCurrent`, `batchFailedCount`, `batchCancelled` |
| Extension 재활성화 | `currentScreen = 'S01'`. AI/저장경로는 `globalState`에서 복원 |
| 필터 변경 | `commitList = []`, `commitPage = 0`, `hasMoreCommits = true` → 재로드 트리거 |

---

## Selector 사용 예시

불필요한 리렌더를 방지하기 위해 필요한 상태만 선택한다.

```typescript
// 올바른 예: 필요한 상태만 선택
const selectedCommit = useAppStore((s) => s.selectedCommit);
const isLoading = useAppStore((s) => s.isLoadingCommits);

// 피해야 할 예: 전체 스토어 구독 (모든 상태 변경마다 리렌더)
const store = useAppStore();
```

---

## 관련 문서

- [../core/state_model.md](../core/state_model.md)
- [architecture.md](./architecture.md)
- [coding_standards.md](./coding_standards.md)
