# Architecture — Git Author Explorer

> **버전** v1.0 | **작성일** 2026-06-26 | **상태** 확정

---

## Architecture Style

**Feature-First Architecture** — VSCode Extension Host(Node.js)와 Webview SPA(React)가 명확히 분리된 이중 런타임 구조.

- **Extension Host**: VSCode API, Git 데이터, 파일시스템, AI CLI 프로세스를 담당하는 Node.js 런타임.
- **Webview SPA**: React + TypeScript로 구현된 UI 레이어. 브라우저 유사 환경에서 실행되며, DOM·CSS·React 생태계를 활용한다.
- **두 레이어 간 통신**: `postMessage` / `onDidReceiveMessage` API만을 유일한 통신 채널로 사용한다.

---

## Directory Structure

```
src/
├── extension/                        # Extension Host (Node.js)
│   ├── index.ts                      # Extension 진입점 (activate / deactivate)
│   ├── webviewPanel.ts               # WebviewPanel 생성·관리
│   ├── messageHandler.ts             # Webview → Extension 메시지 라우터
│   ├── gitService.ts                 # simple-git 기반 커밋 조회 서비스
│   ├── dependencyService.ts          # dependency-cruiser spawn 실행·결과 파싱, tsconfig alias 보조
│   ├── aiService.ts                  # child_process.spawn 기반 AI CLI 스트리밍 실행
│   ├── aiTypes.ts                    # AIProviderName 타입
│   ├── prompts.ts                    # 파일/커밋 AI 정리 프롬프트 빌더
│   └── summaryFileService.ts         # AI 정리 파일 읽기/쓰기/존재 확인
│
└── webview/                          # Webview SPA (React + TypeScript)
    ├── main.tsx                      # React 진입점 (ReactDOM.createRoot)
    ├── App.tsx                       # 화면 라우터 (currentScreen 기반 라우트 슬롯 렌더링)
    ├── store/
    │   └── appStore.ts               # Zustand 전역 상태 스토어
    ├── types/
    │   └── commit.ts                 # Commit, FilterState, ScreenID, RouteTransitionDirection 타입
    ├── bridge/
    │   └── vscodeApi.ts              # acquireVsCodeApi() 래퍼, postMessage/Webview State 헬퍼
    ├── features/
    │   ├── F01/
    │   │   ├── S01_CommitListScreen.tsx
    │   │   ├── CommitFilterPanel.tsx
    │   │   ├── DateRangeFilter.tsx
    │   │   ├── AuthorDropdown.tsx
    │   │   ├── KeywordSearchInput.tsx
    │   │   ├── CommitList.tsx
    │   │   ├── CommitListItem.tsx
    │   │   └── InfiniteScrollTrigger.tsx
    │   ├── F02/
    │   │   ├── S02_HistoryViewScreen.tsx
    │   │   ├── CommitActionBar.tsx
    │   │   ├── FileTree.tsx
    │   │   ├── DirectoryNode.tsx
    │   │   ├── FileTreeNode.tsx
    │   │   ├── tree.ts
    │   │   └── index.ts
    │   ├── F03/
    │   │   ├── S03_CodeViewerScreen.tsx
    │   │   ├── DiffViewer.tsx
    │   │   ├── DiffLine.tsx
    │   │   ├── parseDiff.ts
    │   │   ├── highlightDiff.ts
    │   │   ├── types.ts
    │   │   └── index.ts
    │   ├── F04/
    │   │   ├── S05_DependencyCanvasScreen.tsx
    │   │   ├── DependencyGraph.tsx
    │   │   ├── FileNode.tsx
    │   │   ├── DependencyEdge.tsx
    │   │   ├── CanvasControls.tsx
    │   │   ├── LegendPanel.tsx
    │   │   ├── graph.ts
    │   │   └── index.ts
    │   ├── F05/
    │   │   ├── S04_AISummaryViewerScreen.tsx
    │   │   ├── AISummaryViewer.tsx
    │   │   ├── StreamingTextRenderer.tsx
    │   │   ├── RegenerateButton.tsx
    │   │   ├── TokenLimitWarning.tsx
    │   │   ├── OverwriteConfirmDialog.tsx
    │   │   └── index.ts
    │   ├── F06/
    │   │   ├── S06_SettingsScreen.tsx
    │   │   ├── AIProviderSection.tsx
    │   │   ├── AIProviderButton.tsx
    │   │   ├── SavePathSection.tsx
    │   │   ├── providers.ts
    │   │   └── index.ts
    │   └── F08_batch_ai_summary/
    │       ├── BatchAISummaryFeature.tsx
    │       ├── BatchProgressBar.tsx
    │       └── useBatchAISummary.ts
    ├── screens/                      # 향후 독립 Screen 컴포넌트 확장 위치
    │   ├── S01_CommitListScreen.tsx  # 현재 F01/S01_CommitListScreen.tsx에서 구현
    │   ├── S02_HistoryViewScreen.tsx
    │   ├── S03_CodeViewerScreen.tsx
    │   ├── S04_AISummaryViewerScreen.tsx
    │   ├── S05_DependencyCanvasScreen.tsx
    │   └── S06_SettingsScreen.tsx
    └── shared/
        ├── components/
        │   ├── TopHeader.tsx
        │   ├── BackButton.tsx
        │   ├── PrimaryButton.tsx
        │   ├── EmptyState.tsx
        │   ├── LoadingState.tsx
        │   ├── ErrorState.tsx
        │   ├── Toast.tsx
        │   ├── ProgressBar.tsx
        │   ├── Badge.tsx
        │   └── ActionButton.tsx
        ├── hooks/
        │   └── useVSCodeMessage.ts   # Extension → Webview 메시지 구독 훅
        ├── route/
        │   └── RouteSlotContext.tsx  # active/inactive 라우트 슬롯 컨텍스트
        └── utils/
            └── fileStatus.ts         # 파일 상태 코드(A/M/D/R) 레이블 변환
```

---

## Component Rules

### Feature Isolation (피처 격리)

- 각 Feature 디렉토리는 자신의 UI 컴포넌트, 커스텀 훅, 타입을 자체적으로 포함한다.
- Feature 간 직접 import를 금지한다. 공통 로직은 반드시 `shared/`로 추출한다.
- Feature 컴포넌트는 Screen 컴포넌트에서 조합한다. 현재 F01은 `src/webview/features/F01/S01_CommitListScreen.tsx`에 화면 조합 컴포넌트를 함께 둔다.

### Shared Component Rule (공유 컴포넌트 규칙)

- 2개 이상의 Feature 또는 Screen에서 동일한 UI 패턴이 반복되면 `shared/components/`로 이동한다.
- `EmptyState`, `LoadingState`, `ErrorState`, `Toast`, `TopHeader`, `BackButton`, `PrimaryButton`은 항상 shared 컴포넌트를 사용한다.
- FileActionButtons (`FileStatusBadge`, `SavedBadge` 포함)는 F02(FileTree)와 F04(Canvas 노드) 모두에서 사용하므로 shared 컴포넌트로 관리한다.

### Business Logic Separation (비즈니스 로직 분리)

- 비즈니스 로직(git 호출, AI 실행, 파일 I/O)은 Extension Host에서만 실행한다.
- Webview 커스텀 훅(`useXxx.ts`)은 상태 관리와 postMessage 전송만 담당한다.
- `child_process`, `fs`, `path` 등 Node.js 전용 모듈은 Extension Host 코드에서만 import한다.

### Route Slot Rule (화면 전환 슬롯 규칙)

- Webview 라우팅은 `react-router` 없이 Zustand의 `currentScreen`, `previousScreen`, `transitionDirection`으로 관리한다.
- `App.tsx`는 화면 전환 시 incoming 화면과 outgoing 화면을 `.screen-container` 내부의 두 `.screen-slot`으로 200ms 동안 동시에 렌더링한다.
- `transitionDirection = 'forward'`이면 incoming 화면은 오른쪽에서 들어오고 outgoing 화면은 왼쪽으로 나간다. `transitionDirection = 'back'`이면 incoming 화면은 왼쪽에서 들어오고 outgoing 화면은 오른쪽으로 나간다.
- outgoing 슬롯은 `aria-hidden="true"`와 `RouteSlotProvider isActive={false}`를 사용한다. 최상위 화면 컴포넌트는 `useRouteSlotActive()`가 false일 때 초기 데이터 로딩 effect와 Extension 메시지 listener 등록을 건너뛴다.
- 라우트 전환 animation은 `styles.css`의 `--gae-motion-duration-base`와 `App.tsx`의 `ROUTE_TRANSITION_DURATION_MS`가 같은 200ms 값으로 동작한다.
- `BatchProgressBar`와 `ToastContainer`는 라우트 슬롯 밖에 렌더링해 화면 전환 중에도 전역 피드백을 유지한다.

---

## Communication Rules

### Webview API 래퍼

`src/webview/bridge/vscodeApi.ts`는 VSCode 런타임 API 접근을 한 곳으로 모은다. Webview에서 Extension Host로 요청을 보낼 때는 `postMessage()`를 사용하고, 웹뷰 재생성 후 복원해야 하는 최소 UI 상태는 `getWebviewState()` / `setWebviewState()`로 읽고 쓴다.

```typescript
export function postMessage(type: string, payload?: unknown): void;
export function isVSCodeRuntime(): boolean;
export function getWebviewState<T>(): T | undefined;
export function setWebviewState<T>(state: T): void;
```

브라우저 개발 모드에서는 `acquireVsCodeApi()`가 없으므로 `isVSCodeRuntime()`이 false가 되고, Webview State 읽기/쓰기는 no-op으로 동작한다.

### Extension ↔ Webview 메시지 프로토콜

모든 메시지는 `{ type: string, payload: unknown }` 구조를 따른다.

```typescript
// Webview → Extension (요청)
type WebviewToExtensionMessage =
  | { type: 'FETCH_COMMITS'; payload: CommitFilter & { page: number; pageSize: number } }
  | { type: 'FETCH_CHANGED_FILES'; payload: { commitHash: string; savePath?: string | null } }
  | { type: 'OPEN_REPOSITORY' }
  | { type: 'FETCH_FILE_DIFF'; payload: { commitHash: string; filePath: string } }
  | { type: 'FETCH_AI_SUMMARY_SETTINGS' }
  | { type: 'START_AI_SUMMARY_FILE'; payload: { commitHash: string; filePath: string; provider?: AIProviderName | null; savePath?: string | null; forceRegenerate?: boolean } }
  | { type: 'START_AI_SUMMARY_COMMIT'; payload: { commitHash: string; provider?: AIProviderName | null; savePath?: string | null; forceRegenerate?: boolean } }
  | { type: 'START_BATCH_AI_SUMMARY'; payload: { commitHash: string; provider: AIProviderName; savePath: string; files: ChangedFile[] } }
  | { type: 'CANCEL_BATCH_AI_SUMMARY' }
  | { type: 'LOAD_DEPENDENCY_GRAPH'; payload: { commitHash: string } }
  | { type: 'REGISTER_AI_PROVIDER'; payload: { name: AIProviderName } }
  | { type: 'ACTIVATE_AI_PROVIDER'; payload: { name: AIProviderName } }
  | { type: 'SET_SAVE_PATH' }
  | { type: 'CLEAR_SAVE_PATH' };

// Extension → Webview (응답/이벤트)
type ExtensionToWebviewMessage =
  | { type: 'COMMITS_LOADED'; payload: { commits: Commit[]; page: number; pageSize: number } }
  | { type: 'GIT_REPOSITORY_NOT_FOUND'; payload: { message: string } }
  | { type: 'COMMITS_LOAD_FAILED'; payload: { message: string } }
  | { type: 'CHANGED_FILES_LOADED'; payload: { files: ChangedFile[] } }
  | { type: 'CHANGED_FILES_LOAD_FAILED'; payload: { message: string } }
  | { type: 'FILE_DIFF_LOADED'; payload: { rawDiff: string; isBinary: boolean; isDeleted: boolean } }
  | { type: 'FILE_DIFF_LOAD_FAILED'; payload: { message: string } }
  | { type: 'AI_SUMMARY_SETTINGS_LOADED'; payload: { savePath: string | null; registeredProviders: AIProviderName[]; activeAIProvider: AIProviderName | null } }
  | { type: 'AI_SUMMARY_LOADED'; payload: { content: string; savedPath: string; provider: AIProviderName; fromSaved: true } }
  | { type: 'AI_SUMMARY_STARTED'; payload: { provider: AIProviderName } }
  | { type: 'AI_SUMMARY_TOKEN_WARNING'; payload: { isOverLimit: boolean } }
  | { type: 'AI_SUMMARY_CHUNK'; payload: { chunk: string } }
  | { type: 'AI_SUMMARY_DONE'; payload: { content: string; savedPath: string; provider: AIProviderName } }
  | { type: 'AI_SUMMARY_ERROR'; payload: { message: string } }
  | { type: 'BATCH_AI_SUMMARY_STARTED'; payload: { batchTotal: number } }
  | { type: 'BATCH_AI_SUMMARY_PROGRESS'; payload: { batchCompleted: number; batchFailedCount: number; completedFilePath: string; hasSavedSummary: boolean } }
  | { type: 'BATCH_AI_SUMMARY_CANCELLING' }
  | { type: 'BATCH_AI_SUMMARY_DONE'; payload: { batchCompleted: number; batchFailedCount: number } }
  | { type: 'BATCH_AI_SUMMARY_CANCELLED'; payload: { batchCompleted: number; batchFailedCount: number } }
  | { type: 'BATCH_AI_SUMMARY_ERROR'; payload: { message: string } }
  | { type: 'DEPENDENCY_GRAPH_LOADED'; payload: { nodes: GraphNode[]; edges: GraphEdge[] } }
  | { type: 'AI_PROVIDER_REGISTERED'; payload: { registeredProviders: AIProviderName[]; activeAIProvider: AIProviderName | null; providerName: AIProviderName } }
  | { type: 'AI_PROVIDER_REGISTRATION_FAILED'; payload: { providerName: AIProviderName; message: string; installUrl?: string } }
  | { type: 'AI_PROVIDER_STATE_UPDATED'; payload: { registeredProviders: AIProviderName[]; activeAIProvider: AIProviderName | null; providerName: AIProviderName } }
  | { type: 'SAVE_PATH_SET'; payload: { savePath: string; registeredProviders: AIProviderName[]; activeAIProvider: AIProviderName | null } }
  | { type: 'SAVE_PATH_CLEARED'; payload: { savePath: null; registeredProviders: AIProviderName[]; activeAIProvider: AIProviderName | null } };
```

### Zustand 상태 관리 (Webview 전용)

- Webview 내 전역 상태는 Zustand 단일 스토어(`useAppStore`, 구현 파일: `src/webview/store/appStore.ts`)에서 관리한다.
- Extension에서 받은 메시지는 현재 `App.tsx`(AI 설정 초기화, F08 전역 배치 상태), `features/F01/S01_CommitListScreen.tsx`, `features/F02/S02_HistoryViewScreen.tsx`, `features/F03/S03_CodeViewerScreen.tsx`, `features/F05/S04_AISummaryViewerScreen.tsx`, `features/F06/S06_SettingsScreen.tsx`에서 구독하여 화면 또는 Zustand 상태를 업데이트한다. 메시지 구독 로직이 더 확장되면 `shared/hooks/useVSCodeMessage.ts`로 분리한다.
- 화면 전환(`currentScreen`)도 Zustand 상태로 관리한다. `react-router`는 사용하지 않는다.

### Browser Dev Fallback

- `pnpm dev`로 Webview를 브라우저에서 직접 실행하면 VSCode API가 없으므로 `acquireVsCodeApi()`가 존재하지 않는다.
- 이 경우 `isVSCodeRuntime()`이 false가 되고, `appStore.ts`는 F01 커밋 목록과 F02 변경 파일 트리용 데모 데이터를 사용해 UI를 확인할 수 있게 한다.
- 실제 Extension Host 실행에서는 F01이 `FETCH_COMMITS`, F02가 `FETCH_CHANGED_FILES` / `START_BATCH_AI_SUMMARY`, F03이 `FETCH_FILE_DIFF`, F05/F05b가 `FETCH_AI_SUMMARY_SETTINGS` / `START_AI_SUMMARY_FILE` / `START_AI_SUMMARY_COMMIT` 메시지를 보낸다. F08 취소는 App 전역 `BatchProgressBar`에서 `CANCEL_BATCH_AI_SUMMARY`로 요청한다. F06/F07 설정 화면은 `FETCH_AI_SUMMARY_SETTINGS`, `REGISTER_AI_PROVIDER`, `ACTIVATE_AI_PROVIDER`, `SET_SAVE_PATH`, `CLEAR_SAVE_PATH` 메시지를 보내고 Extension Host 결과로 상태를 갱신한다.
- Browser dev fallback에서는 VSCode 파일 다이얼로그를 열 수 없으므로 S06 저장 경로 선택이 데모 경로를 설정한다. 실제 디렉토리 선택은 Extension Host의 `vscode.window.showOpenDialog()`에서만 동작한다.

### child_process (Extension Host 전용)

- AI CLI 실행(`child_process.spawn`)은 Extension Host의 `aiService.ts`에서만 수행한다.
- 스트리밍 출력은 `data` 이벤트마다 `AI_SUMMARY_CHUNK` 메시지로 Webview에 전달한다.
- 타임아웃 120초 초과 시 프로세스를 `kill()`하고 `AI_SUMMARY_ERROR` 메시지를 전송한다.

---

## Data Flow Example: AI 정리 파일 단위 생성

```
Webview (F05_AISummaryFile)
  └─ [AI 정리 보기 클릭]
       └─ postMessage({ type: 'START_AI_SUMMARY_FILE', payload: { commitHash, filePath, provider, savePath } })
            ↓
Extension Host (messageHandler.ts)
  └─ summaryFileService.loadSummary(savePath, commitHash, filePath)
       ├─ [존재 시] → postMessage({ type: 'AI_SUMMARY_LOADED', payload: { content, savedPath, provider, fromSaved: true } })
       └─ [없을 시]
            └─ gitService.fetchFileDiff(repoPath, commitHash, filePath)
                 ├─ postMessage({ type: 'AI_SUMMARY_TOKEN_WARNING', payload: { isOverLimit } })
                 ├─ postMessage({ type: 'AI_SUMMARY_STARTED', payload: { provider } })
                 └─ aiService.streamAISummary(provider, prompt)
                      ├─ [stdout chunk] → postMessage({ type: 'AI_SUMMARY_CHUNK', payload: { chunk } })
                      └─ [close]        → summaryFileService.saveSummary(...)
                                          ├─ [성공] → postMessage({ type: 'AI_SUMMARY_DONE', payload: { content, savedPath, provider } })
                                          └─ [저장 실패] → postMessage({ type: 'AI_SUMMARY_ERROR', payload: { message: '저장 경로를 생성할 수 없습니다. 권한을 확인하세요' } })
```

## Data Flow Example: AI 정리 커밋 단위 생성

```
Webview (F05b_AISummaryCommit)
  └─ [커밋 AI 정리 클릭]
       └─ postMessage({ type: 'START_AI_SUMMARY_COMMIT', payload: { commitHash, provider, savePath } })
            ↓
Extension Host (messageHandler.ts)
  └─ summaryFileService.loadCommitSummary(savePath, commitHash)
       ├─ [존재 시] → postMessage({ type: 'AI_SUMMARY_LOADED', payload: { content, savedPath, provider, fromSaved: true } })
       └─ [없을 시]
            └─ gitService.fetchCommitFullDiff(repoPath, commitHash)
                 ├─ postMessage({ type: 'AI_SUMMARY_TOKEN_WARNING', payload: { isOverLimit } })
                 ├─ postMessage({ type: 'AI_SUMMARY_STARTED', payload: { provider } })
                 └─ aiService.streamAISummary(provider, prompt)
                      ├─ [stdout chunk] → postMessage({ type: 'AI_SUMMARY_CHUNK', payload: { chunk } })
                      └─ [close]        → summaryFileService.saveCommitSummary(...)
                                          ├─ [성공] → postMessage({ type: 'AI_SUMMARY_DONE', payload: { content, savedPath, provider } })
                                          └─ [저장 실패] → postMessage({ type: 'AI_SUMMARY_ERROR', payload: { message: '저장 경로를 생성할 수 없습니다. 권한을 확인하세요' } })
```

---

## Related Documents

- [development_environment.md](./development_environment.md)
- [state_management.md](./state_management.md)
- [directory_structure.md](./directory_structure.md)
- [coding_standards.md](./coding_standards.md)
