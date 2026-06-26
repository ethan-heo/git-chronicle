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
  isLoadingChangedFiles: boolean;
  changedFilesError: string | null;

  // === AI Summary ===
  summaryMode: 'file' | 'commit';

  // === Batch AI Summary ===
  isBatchRunning: boolean;
  batchTotal: number;
  batchCurrent: number;

  // === AI Providers ===
  activeAIProvider: AIProviderName | null;
  registeredProviders: AIProvider[];

  // === Save Path ===
  savePath: string | null;

  // === Actions ===
  loadCommits: (reset?: boolean) => void;
  loadChangedFiles: () => void;
  handleCommitsLoaded: (payload: { commits: Commit[]; page: number; pageSize: number }) => void;
  handleRepositoryNotFound: () => void;
  handleCommitsLoadFailed: (message?: string) => void;
  selectCommit: (commit: Commit) => void;
  goToCommitList: () => void;
  goToHistoryView: () => void;
  setFilter: (filter: Partial<FilterState>) => void;
  clearFilters: () => void;
  openRepository: () => void;
  selectFileForCode: (file: ChangedFile) => void;
  selectFileForAI: (file: ChangedFile) => void;
  goToCommitAISummary: () => void;
  goToCanvasView: () => void;
  startBatchAISummary: () => void;
  handleChangedFilesLoaded: (files: ChangedFile[]) => void;
  handleChangedFilesLoadFailed: (message?: string) => void;
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
  selectedFile: null,
  changedFiles: [],
  changedFilesError: null,
  isLoadingChangedFiles: false,
  currentScreen: 'S02',
}),

goToCommitList: () => set({ currentScreen: 'S01' }),
goToHistoryView: () => set({ currentScreen: 'S02' }),
```

F02 현재 구현은 `selectCommit`에서 `selectedFile`, `changedFiles`, `changedFilesError`, `isLoadingChangedFiles`를 초기화한다. `currentSummaryContent`, `summaryError` 초기화는 F05 구현 시 추가한다.

### loadChangedFiles / handleChangedFilesLoaded

선택 커밋 기준 변경 파일 목록을 요청하고 결과를 전역 상태에 반영한다.

```typescript
loadChangedFiles: () => {
  const state = get();
  if (!state.selectedCommit || state.isLoadingChangedFiles) return;

  set({ isLoadingChangedFiles: true, changedFilesError: null });

  postMessage('FETCH_CHANGED_FILES', {
    commitHash: state.selectedCommit.hash,
    savePath: state.savePath,
  });
},

handleChangedFilesLoaded: (files) => set({
  changedFiles: files,
  isLoadingChangedFiles: false,
  changedFilesError: null,
}),
```

### F02 화면 전환 액션

F02에서 후속 화면으로 전환한다. 현재 S03/S04/S05는 placeholder 화면이며, 실제 데이터 로딩은 후속 Feature 구현에서 연결한다.

```typescript
selectFileForCode: (file) => set({
  selectedFile: file,
  currentScreen: 'S03',
}),

selectFileForAI: (file) => set({
  selectedFile: file,
  summaryMode: 'file',
  currentScreen: 'S04',
}),

goToCommitAISummary: () => set({
  selectedFile: null,
  summaryMode: 'commit',
  currentScreen: 'S04',
}),

goToCanvasView: () => set({ currentScreen: 'S05' }),
```

### startBatchAISummary

F08 시작 상태를 설정하고 VSCode 런타임에서는 Extension Host로 `START_BATCH_AI_SUMMARY` 메시지를 보낸다. 진행/완료/취소 상태 처리는 F08 구현 범위에서 확장한다.

```typescript
startBatchAISummary: () => set({
  isBatchRunning: true,
  batchTotal: changedFiles.length,
  batchCurrent: 0,
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
| `selectedCommit` 변경 | `currentScreen = 'S02'`, `selectedFile`, `changedFiles`, `changedFilesError`, `isLoadingChangedFiles` 초기화 |
| `isBatchRunning` → `false` | F08 구현 시 `batchTotal`, `batchCurrent` 초기화 규칙 추가 |
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
