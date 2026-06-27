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
  currentSummaryContent: string;
  isLoadingSummary: boolean;
  isGeneratingSummary: boolean;
  summaryError: string | null;
  summarySavedPath: string | null;
  hasCurrentSavedSummary: boolean;
  isSummaryTokenLimitExceeded: boolean;

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
  setAISummarySettings: (settings: { savePath?: string | null; activeAIProvider?: AIProviderName | null }) => void;
  resetAISummary: () => void;
  startAISummaryLoading: () => void;
  startAISummaryGeneration: () => void;
  appendAISummaryChunk: (chunk: string) => void;
  completeAISummary: (payload: { content?: string; savedPath?: string | null; provider?: AIProviderName | null }) => void;
  loadSavedAISummary: (payload: { content: string; savedPath?: string | null; provider?: AIProviderName | null }) => void;
  failAISummary: (message?: string) => void;
  setSummaryTokenWarning: (isOverLimit: boolean) => void;
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

현재 구현은 `selectCommit`에서 `selectedFile`, `changedFiles`, `changedFilesError`, `isLoadingChangedFiles`, `dependencyEdges`, `dependenciesError`, `currentSummaryContent`, `isLoadingSummary`, `isGeneratingSummary`, `summaryError`, `summarySavedPath`, `hasCurrentSavedSummary`, `isSummaryTokenLimitExceeded`를 함께 초기화한다.

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

### F02/F03/F04 화면 전환 액션

F02와 S05에서 후속 화면으로 전환한다. S03은 `selectedFile`과 `selectedCommit`을 기준으로 diff를 로드한다. S05 의존성 캔버스에서 S03/S04로 진입할 때는 `previousScreen = "S05"`를 저장해 뒤로가기 시 캔버스로 복귀한다.

```typescript
selectFileForCode: (file) => set({
  selectedFile: file,
  previousScreen: currentScreen === 'S05' ? 'S05' : 'S02',
  currentScreen: 'S03',
}),

selectFileForAI: (file) => set({
  selectedFile: file,
  summaryMode: 'file',
  previousScreen: currentScreen === 'S05' ? 'S05' : 'S02',
  currentScreen: 'S04',
}),

goToCommitAISummary: () => set({
  selectedFile: null,
  summaryMode: 'commit',
  previousScreen: 'S02',
  currentScreen: 'S04',
}),

goToCanvasView: () => set({
  currentScreen: 'S05',
  previousScreen: 'S02',
}),

goBackFromDetail: () => set({
  currentScreen: previousScreen ?? 'S02',
  previousScreen: null,
}),

goToSettingsView: () => set({ currentScreen: 'S06' }),
```

S03 자체의 diff 로딩 상태(`diffLines`, `isLoading`, `error`, `isBinaryFile`, `isDeletedFile`)는 읽기 전용 화면의 로컬 상태로 관리한다. Extension Host 메시지는 `features/F03/S03_CodeViewerScreen.tsx`에서 직접 구독한다.

S05 의존성 캔버스는 전역 상태의 `dependencyEdges`, `isLoadingDependencies`, `dependenciesError`를 사용한다. 변경 파일 로딩 중 S05로 진입하는 상황에 대비해 `hasLoadedChangedFiles`로 빈 커밋과 아직 로드 전 상태를 구분한다.

### F05 AI 정리 액션

S04 파일 단위 AI 정리 화면은 전역 상태로 저장본 로딩, AI 생성, 스트리밍 청크, 저장 완료, 에러 상태를 구분한다. Extension Host 메시지는 `features/F05/S04_AISummaryViewerScreen.tsx`에서 직접 구독한다.

```typescript
setAISummarySettings: ({ savePath, activeAIProvider }) => set({
  ...(savePath !== undefined ? { savePath } : {}),
  ...(activeAIProvider !== undefined ? { activeAIProvider } : {}),
}),

startAISummaryLoading: () => set({
  currentSummaryContent: '',
  isLoadingSummary: true,
  isGeneratingSummary: false,
  summaryError: null,
  summarySavedPath: null,
  hasCurrentSavedSummary: false,
}),

startAISummaryGeneration: () => set({
  currentSummaryContent: '',
  isLoadingSummary: false,
  isGeneratingSummary: true,
  summaryError: null,
  summarySavedPath: null,
  hasCurrentSavedSummary: false,
}),

appendAISummaryChunk: (chunk) => set((state) => ({
  currentSummaryContent: `${state.currentSummaryContent}${chunk}`,
  isLoadingSummary: false,
  isGeneratingSummary: true,
  summaryError: null,
})),

loadSavedAISummary: ({ content, savedPath, provider }) => set({
  currentSummaryContent: content,
  isLoadingSummary: false,
  isGeneratingSummary: false,
  summaryError: null,
  summarySavedPath: savedPath ?? null,
  hasCurrentSavedSummary: true,
  isSummaryTokenLimitExceeded: false,
  ...(provider ? { activeAIProvider: provider } : {}),
}),

completeAISummary: ({ content, savedPath, provider }) => {
  const selectedPath = get().selectedFile?.path;
  set((state) => ({
    currentSummaryContent: content ?? state.currentSummaryContent,
    isLoadingSummary: false,
    isGeneratingSummary: false,
    summaryError: null,
    summarySavedPath: savedPath ?? null,
    hasCurrentSavedSummary: true,
    ...(provider ? { activeAIProvider: provider } : {}),
    changedFiles: selectedPath
      ? state.changedFiles.map((file) => file.path === selectedPath ? { ...file, hasSavedSummary: true } : file)
      : state.changedFiles,
  }));
},

failAISummary: (message = '생성에 실패했습니다') => set({
  isLoadingSummary: false,
  isGeneratingSummary: false,
  summaryError: message,
}),

setSummaryTokenWarning: (isOverLimit) => set({
  isSummaryTokenLimitExceeded: isOverLimit,
}),
```

S04 진입 시 파일 단위 정리는 `FETCH_AI_SUMMARY_SETTINGS`로 VSCode 설정값을 먼저 복원하고, `activeAIProvider`와 `savePath`가 모두 있으면 `START_AI_SUMMARY_FILE`을 보낸다. 저장본 확인 중에는 `isLoadingSummary = true`, AI stdout 청크가 시작되면 `isGeneratingSummary = true`로 전환된다.

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

F06 구현 범위에서 하나를 활성화하면 나머지를 자동 비활성화하는 액션을 추가한다. 현재 F05 구현은 VSCode 설정 `gitAuthorExplorer.activeAIProvider`를 `FETCH_AI_SUMMARY_SETTINGS` 응답으로 읽어 `setAISummarySettings`에 반영한다.

---

## ExtensionContext.globalState (영속 설정)

Extension Host 재시작 후에도 유지해야 하는 설정은 F06/F07 구현에서 `ExtensionContext.globalState`에 저장한다. 현재 F05는 VSCode 설정(`workspace.getConfiguration('gitAuthorExplorer')`)의 `savePath`, `activeAIProvider`를 읽어 사용한다.

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
| `selectedCommit` 변경 | `currentScreen = 'S02'`, `selectedFile`, `changedFiles`, 변경 파일 로딩/에러, 의존성 상태, AI 정리 상태 초기화 |
| `selectFileForAI` | `summaryMode = 'file'`, `currentScreen = 'S04'`, 이전 화면 저장, AI 정리 상태 초기화 |
| `goToCommitAISummary` | `summaryMode = 'commit'`, `currentScreen = 'S04'`, AI 정리 상태 초기화. 실제 커밋 단위 생성은 F05b 구현 범위 |
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
