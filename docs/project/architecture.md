# Architecture — GitChronicle

> **버전** v1.1 | **작성일** 2026-06-26 | **갱신** 2026-07-07 (F11 노트 메시지 프로토콜 반영) | **상태** 확정

---

## Architecture Style

**Feature-First Architecture** — VSCode Extension Host(Node.js)와 Webview SPA(React)가 명확히 분리된 이중 런타임 구조.

- **Extension Host**: VSCode API, Git 데이터, 파일시스템, AI CLI 프로세스를 담당하는 Node.js 런타임.
- **Webview SPA**: React + TypeScript로 구현된 UI 레이어. 브라우저 유사 환경에서 실행되며, DOM·CSS·React 생태계를 활용한다.
- **두 레이어 간 통신**: `postMessage` / `onDidReceiveMessage` API만을 유일한 통신 채널로 사용한다.
- **다국어 지원**: Webview는 `src/webview/i18n/`의 로컬 번역 리소스를 사용하고, 초기 언어는 `vscode.env.language`를 기준으로 `en`/`ko`로 정규화한다.

---

## Directory Structure

`src/`는 `extension/`(Extension Host, Node.js)과 `webview/`(Webview SPA, React)로 최상위가 분리되며, `webview/`는 다시 `features/F##/`(기능별 격리 디렉토리)와 `shared/`(전역 공유 컴포넌트·훅·유틸)로 나뉜다.

전체 파일 트리와 각 파일의 역할은 [directory_structure.md](./directory_structure.md)가 유일한 출처다 — 이 문서에 중복 나열하지 않는다.

---

## Component Rules

### Feature Isolation (피처 격리)

- 각 Feature 디렉토리는 자신의 UI 컴포넌트, 커스텀 훅, 타입을 자체적으로 포함한다.
- Feature 간 직접 import를 금지한다. 공통 로직은 반드시 `shared/`로 추출한다.
- Feature 컴포넌트는 Screen 컴포넌트에서 조합한다. 현재 F01은 `src/webview/features/F01/S01_CommitListScreen.tsx`에 화면 조합 컴포넌트를 함께 둔다.
- 스타일은 컴포넌트와 최대한 가까이 둔다. 기본은 TSX 내부 Tailwind 유틸리티이며, 예외 CSS는 해당 feature/shared 디렉터리에 colocate한다.

### Shared Component Rule (공유 컴포넌트 규칙)

- 2개 이상의 Feature 또는 Screen에서 동일한 UI 패턴이 반복되면 `shared/components/`로 이동한다.
- `EmptyState`, `LoadingState`, `ErrorState`, `Toast`, `TopHeader`, `BackButton`, `PrimaryButton`은 항상 shared 컴포넌트를 사용한다.
- FileActionButtons (`FileStatusBadge` 포함)는 F02(FileTree)와 F04(Canvas 노드) 모두에서 사용하므로 shared 컴포넌트로 관리한다.

### Business Logic Separation (비즈니스 로직 분리)

- 비즈니스 로직(git 호출, AI 실행, 파일 I/O)은 Extension Host에서만 실행한다.
- Webview 커스텀 훅(`useXxx.ts`)은 상태 관리와 postMessage 전송만 담당한다.
- `child_process`, `fs`, `path` 등 Node.js 전용 모듈은 Extension Host 코드에서만 import한다.
- JS/TS 의존성 분석은 Extension Host가 `dist/depcruiser-runner.mjs`를 별도 Node 프로세스로 실행하고, runner가 `dependency-cruiser` API를 호출한다. 결과가 `resolved` 없이 `module`만 제공되거나 상대 specifier가 확장자 없이 들어와도 Extension Host에서 변경 파일 경로로 복원한다.

### Route Slot Rule (화면 전환 슬롯 규칙)

- Webview 라우팅은 `react-router` 없이 Zustand의 `currentScreen`, `previousScreen`, `transitionDirection`으로 관리한다.
- `App.tsx`는 화면 전환 시 incoming 화면과 outgoing 화면을 `.screen-container` 내부의 두 `.screen-slot`으로 200ms 동안 동시에 렌더링한다.
- `transitionDirection = 'forward'`이면 incoming 화면은 오른쪽에서 들어오고 outgoing 화면은 왼쪽으로 나간다. `transitionDirection = 'back'`이면 incoming 화면은 왼쪽에서 들어오고 outgoing 화면은 오른쪽으로 나간다.
- outgoing 슬롯은 `aria-hidden="true"`와 `RouteSlotProvider isActive={false}`를 사용한다. 최상위 화면 컴포넌트는 `useRouteSlotActive()`가 false일 때 초기 데이터 로딩 effect와 Extension 메시지 listener 등록을 건너뛴다.
- 라우트 전환 animation은 `global.css`의 전역 motion 토큰(`--gae-motion-duration-base`)과 `App.tsx`의 `ROUTE_TRANSITION_DURATION_MS`가 같은 200ms 값으로 동작한다.
- `ToastContainer`는 라우트 슬롯 밖에 렌더링해 화면 전환 중에도 전역 피드백을 유지한다.
- `dependency-cruiser`는 패키지 자체뿐 아니라 transitive dependency까지 `dist/node_modules/dependency-cruiser/`에 복사한 뒤 runner가 참조한다. pnpm symlink에 직접 의존하지 않는다. 복사 스크립트는 `require.resolve()` 기반으로 실제 설치 레이아웃을 따라가며, 누락 시 `commander` 같은 런타임 패키지 에러가 발생할 수 있다.

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

### Webview 다국어

Webview UI 문자열은 컴포넌트 내부 하드코딩을 줄이고 `react-i18next` 호환 훅(`useTranslation`)으로 관리한다. 초기 언어는 Extension Host가 주입한 `window.__LANG__`를 우선 사용하고, 값이 없으면 브라우저/호스트 기본값을 따라 `en`으로 폴백한다.

- 번역 키는 `src/webview/i18n/locales/en/translation.json`을 기준으로 유지한다.
- 한국어는 `src/webview/i18n/locales/ko/translation.json`에서 관리한다.
- 언어 정규화는 `ko*` 계열이면 한국어, 그 외는 영어로 처리한다.

### Extension ↔ Webview 메시지 프로토콜

모든 메시지는 `{ type: string, payload?: unknown }` 구조를 따른다. 실제 정의는 `src/extension/messageHandler.ts`를 유일한 진실로 삼는다.

```typescript
// Webview → Extension (요청)
type WebviewToExtensionMessage =
  | { type: 'PING' }
  | { type: 'FETCH_COMMITS'; payload: CommitFilter & { page?: number; pageSize?: number; requestId?: number } }
  | { type: 'FETCH_CHANGED_FILES'; payload: { commitHash: string; commitMessage?: string; savePath?: string | null } }
  | { type: 'OPEN_REPOSITORY' }
  | { type: 'FETCH_FILE_DIFF'; payload: { commitHash: string; filePath: string } }
  | { type: 'ANALYZE_DEPENDENCIES'; payload: { filePaths: string[]; commitHash?: string } }
  | { type: 'ANALYZE_SYMBOL_GRAPH'; payload: { filePath: string; commitHash?: string } }
  | { type: 'FETCH_AI_SUMMARY_SETTINGS' }
  | { type: 'START_AI_SUMMARY_COMMIT'; payload: { commitHash: string; commitMessage?: string; provider?: AIProviderName | null; summaryModel?: string | null; savePath?: string | null; forceRegenerate?: boolean } }
  | { type: 'START_AI_SUMMARY_FILE'; payload: { commitHash: string; commitMessage?: string; filePath: string; provider?: AIProviderName | null; summaryModel?: string | null; savePath?: string | null; forceRegenerate?: boolean } }
  | { type: 'START_AI_QA'; payload: { question: string; diff?: string; summaryContent: string; commitHash: string; commitMessage?: string; filePath?: string; provider?: AIProviderName | null; qaModel?: string | null; savePath?: string | null } }
  | { type: 'REGISTER_AI_PROVIDER'; payload: { name: AIProviderName } }
  | { type: 'ACTIVATE_AI_PROVIDER' | 'SET_ACTIVE_AI_PROVIDER'; payload: { name: AIProviderName } }
  | { type: 'SET_AI_MODEL'; payload: { name: AIProviderName; usage: 'summary' | 'qa'; model: string } }
  | { type: 'OPEN_EXTERNAL_URL'; payload: { url: string } }
  | { type: 'SET_SAVE_PATH' }
  | { type: 'CLEAR_SAVE_PATH' }
  | { type: 'FETCH_NOTE'; payload: { commitHash: string; commitMessage?: string; savePath?: string | null } }
  | { type: 'SAVE_NOTE'; payload: { commitHash: string; commitMessage?: string; savePath?: string | null; content: string } };

// Extension → Webview (응답/이벤트)
type ExtensionToWebviewMessage =
  | { type: 'PONG'; payload: { message: string } }
  | { type: 'UNKNOWN_MESSAGE'; payload: { message: string } }
  | { type: 'COMMITS_LOADED'; payload: { commits: Commit[]; page: number; pageSize: number; requestId?: number; hasMore: boolean } }
  | { type: 'GIT_REPOSITORY_NOT_FOUND'; payload: { message: string } }
  | { type: 'COMMITS_LOAD_FAILED'; payload: { message: string } }
  | { type: 'CHANGED_FILES_LOADED'; payload: { files: ChangedFile[] } }
  | { type: 'CHANGED_FILES_LOAD_FAILED'; payload: { message: string } }
  | { type: 'FILE_DIFF_LOADED'; payload: { rawDiff: string; isBinary: boolean; isDeleted: boolean } }
  | { type: 'FILE_DIFF_LOAD_FAILED'; payload: { message: string } }
  | { type: 'DEPENDENCIES_LOADED'; payload: { edges: DependencyEdge[] } }
  | { type: 'DEPENDENCIES_LOAD_FAILED'; payload: { message: string } }
  | { type: 'SYMBOL_GRAPH_LOADED'; payload: { nodes: SymbolNode[]; edges: SymbolEdge[] } }
  | { type: 'SYMBOL_GRAPH_LOAD_FAILED'; payload: { message: string } }
  | { type: 'AI_SUMMARY_SETTINGS_LOADED'; payload: AISettingsState }
  | { type: 'AI_SUMMARY_LOADED'; payload: { content: string; savedPath: string; provider: AIProviderName; fromSaved: true } }
  | { type: 'AI_SUMMARY_STARTED'; payload: { provider: AIProviderName } }
  | { type: 'AI_SUMMARY_TOKEN_WARNING'; payload: { isOverLimit: boolean } }
  | { type: 'AI_SUMMARY_CHUNK'; payload: { chunk: string } }
  | { type: 'AI_SUMMARY_DONE'; payload: { content: string; savedPath: string; provider: AIProviderName } }
  | { type: 'AI_SUMMARY_ERROR'; payload: { message: string } }
  | { type: 'AI_QA_CHUNK'; payload: { chunk: string } }
  | { type: 'AI_QA_COMPLETE'; payload: { appendedContent: string } }
  | { type: 'AI_QA_ERROR'; payload: { message: string } }
  | { type: 'AI_PROVIDER_REGISTERED'; payload: AISettingsState & { providerName: AIProviderName } }
  | { type: 'AI_PROVIDER_REGISTRATION_FAILED'; payload: { providerName: AIProviderName; message: string; installUrl?: string } }
  | { type: 'AI_PROVIDER_STATE_UPDATED'; payload: AISettingsState & { providerName: AIProviderName } }
  | { type: 'AI_MODEL_UPDATED'; payload: AISettingsState & { providerName: AIProviderName } }
  | { type: 'AI_SETTINGS_ERROR'; payload: { message: string } }
  | { type: 'SAVE_PATH_SET'; payload: AISettingsState }
  | { type: 'SAVE_PATH_CLEARED'; payload: AISettingsState }
  | { type: 'NOTE_LOADED'; payload: { content: string; savedPath: string | null } }
  | { type: 'NOTE_LOAD_FAILED'; payload: { message: string } }
  | { type: 'NOTE_SAVED'; payload: { savedPath: string } }
  | { type: 'NOTE_SAVE_FAILED'; payload: { message: string } };

// AISettingsState (src/extension/aiProviderService.ts)
interface AISettingsState {
  registeredProviders: AIProviderName[];
  activeAIProvider: AIProviderName | null;
  savePath: string | null;
  summaryModel: string | null;
  qaModel: string | null;
  summaryModelPerProvider: Record<AIProviderName, string | undefined>;
  qaModelPerProvider: Record<AIProviderName, string | undefined>;
}
```

### Zustand 상태 관리 (Webview 전용)

- Webview 내 전역 상태는 Zustand 단일 스토어(`useAppStore`, 구현 파일: `src/webview/store/appStore.ts`)에서 관리한다.
- Extension에서 받은 메시지는 현재 `App.tsx`(AI 설정 초기화, 심볼 그래프 로드), `features/F01/S01_CommitListScreen.tsx`(커밋 목록), `features/F02/S02_WorkspaceScreen.tsx`(변경 파일, 의존성 캔버스), `features/F03/useFileDiff.ts`(코드 diff), `features/F05b/useAISummary.ts`(AI 요약), `features/F06/S06_SettingsScreen.tsx`(AI 설정), `features/F11/S07_NoteScreen.tsx`(노트)에서 구독하여 화면 또는 Zustand 상태를 업데이트한다.
- 화면 전환(`currentScreen`)도 Zustand 상태로 관리한다. `react-router`는 사용하지 않는다.

### Browser Dev Fallback

- `pnpm dev`로 Webview를 브라우저에서 직접 실행하면 VSCode API가 없으므로 `acquireVsCodeApi()`가 존재하지 않는다.
- 이 경우 `isVSCodeRuntime()`이 false가 되고, `appStore.ts`는 F01 커밋 목록과 F02 변경 파일 트리용 데모 데이터를 사용해 UI를 확인할 수 있게 한다.
- 실제 Extension Host 실행에서는 F01이 `FETCH_COMMITS`, F02가 `FETCH_CHANGED_FILES`, F03이 `FETCH_FILE_DIFF`, F04가 `ANALYZE_DEPENDENCIES`, F05b/F02가 `FETCH_AI_SUMMARY_SETTINGS` / `START_AI_SUMMARY_COMMIT` / `START_AI_SUMMARY_FILE`, F09가 `START_AI_QA`, F10이 `ANALYZE_SYMBOL_GRAPH`, F11이 `FETCH_NOTE` / `SAVE_NOTE` 메시지를 보낸다. F06/F07 설정 화면은 `FETCH_AI_SUMMARY_SETTINGS`, `REGISTER_AI_PROVIDER`, `ACTIVATE_AI_PROVIDER`/`SET_ACTIVE_AI_PROVIDER`, `SET_AI_MODEL`, `SET_SAVE_PATH`, `CLEAR_SAVE_PATH` 메시지를 보내고 Extension Host 결과로 상태를 갱신한다.
- Browser dev fallback에서는 VSCode 파일 다이얼로그를 열 수 없으므로 S06 저장 경로 선택이 데모 경로를 설정한다. 실제 디렉토리 선택은 Extension Host의 `vscode.window.showOpenDialog()`에서만 동작한다.

### child_process (Extension Host 전용)

- AI CLI 실행(`child_process.spawn`)은 Extension Host의 `aiService.ts`에서만 수행한다.
- 스트리밍 출력은 `data` 이벤트마다 `AI_SUMMARY_CHUNK` 메시지로 Webview에 전달한다.
- 타임아웃 120초 초과 시 프로세스를 `kill()`하고 `AI_SUMMARY_ERROR` 메시지를 전송한다.

---

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
