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
│   ├── git/
│   │   ├── gitService.ts             # simple-git 래퍼 (log, diff, show)
│   │   └── gitTypes.ts               # Commit, ChangedFile 등 공통 타입
│   ├── ai/
│   │   ├── aiRunner.ts               # child_process.spawn 기반 AI CLI 실행기
│   │   ├── aiTypes.ts                # AIProvider, AIRunResult 타입
│   │   └── cliDetector.ts            # {cli} --version 실행으로 CLI 등록 확인
│   ├── storage/
│   │   ├── summaryStorage.ts         # AI 정리 파일 읽기/쓰기 (fs.mkdirSync recursive)
│   │   └── settingsStorage.ts        # VSCode ExtensionContext.globalState 래퍼
│   └── dependency/
│       └── dependencyAnalyzer.ts     # dependency-cruiser 실행·결과 파싱
│
└── webview/                          # Webview SPA (React + TypeScript)
    ├── main.tsx                      # React 진입점 (ReactDOM.createRoot)
    ├── App.tsx                       # 화면 라우터 (currentScreen 기반 조건부 렌더링)
    ├── store/
    │   ├── useAppStore.ts            # Zustand 전역 상태 스토어
    │   └── types.ts                  # 스토어 타입 정의
    ├── bridge/
    │   └── vscodeApi.ts              # acquireVsCodeApi() 래퍼, postMessage 헬퍼
    ├── features/
    │   ├── F01_commit_log/
    │   │   ├── CommitLogFeature.tsx
    │   │   ├── CommitFilterPanel.tsx
    │   │   └── useCommitLog.ts
    │   ├── F02_changed_file_tree/
    │   │   ├── ChangedFileTreeFeature.tsx
    │   │   ├── FileTreeNode.tsx
    │   │   └── useFileTree.ts
    │   ├── F03_code_viewer/
    │   │   ├── CodeViewerFeature.tsx
    │   │   ├── DiffViewer.tsx
    │   │   └── useCodeViewer.ts
    │   ├── F04_dependency_canvas/
    │   │   ├── DependencyCanvasFeature.tsx
    │   │   ├── DependencyGraph.tsx
    │   │   ├── FileNode.tsx
    │   │   ├── DependencyEdge.tsx
    │   │   └── useDependencyCanvas.ts
    │   ├── F05_ai_summary_file/
    │   │   ├── AISummaryFileFeature.tsx
    │   │   ├── AISummaryViewer.tsx
    │   │   └── useAISummaryFile.ts
    │   ├── F05b_ai_summary_commit/
    │   │   ├── AISummaryCommitFeature.tsx
    │   │   └── useAISummaryCommit.ts
    │   ├── F06_ai_settings/
    │   │   ├── AISettingsFeature.tsx
    │   │   ├── AIProviderButton.tsx
    │   │   └── useAISettings.ts
    │   ├── F07_save_path_settings/
    │   │   ├── SavePathSettingsFeature.tsx
    │   │   ├── SavePathSelector.tsx
    │   │   └── useSavePath.ts
    │   └── F08_batch_ai_summary/
    │       ├── BatchAISummaryFeature.tsx
    │       ├── BatchProgressBar.tsx
    │       └── useBatchAISummary.ts
    ├── screens/
    │   ├── S01_CommitListScreen.tsx
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
        └── utils/
            ├── folderName.ts         # 커밋 메시지 → 폴더명 변환 (50자 + 특수문자 치환)
            └── fileStatus.ts         # 파일 상태 코드(A/M/D/R) 레이블 변환
```

---

## Component Rules

### Feature Isolation (피처 격리)

- 각 Feature 디렉토리는 자신의 UI 컴포넌트, 커스텀 훅, 타입을 자체적으로 포함한다.
- Feature 간 직접 import를 금지한다. 공통 로직은 반드시 `shared/`로 추출한다.
- Feature 컴포넌트는 Screen 컴포넌트에서만 조합된다.

### Shared Component Rule (공유 컴포넌트 규칙)

- 2개 이상의 Feature 또는 Screen에서 동일한 UI 패턴이 반복되면 `shared/components/`로 이동한다.
- `EmptyState`, `LoadingState`, `ErrorState`, `Toast`, `TopHeader`, `BackButton`, `PrimaryButton`은 항상 shared 컴포넌트를 사용한다.
- FileActionButtons (`FileStatusBadge`, `SavedBadge` 포함)는 F02(FileTree)와 F04(Canvas 노드) 모두에서 사용하므로 shared 컴포넌트로 관리한다.

### Business Logic Separation (비즈니스 로직 분리)

- 비즈니스 로직(git 호출, AI 실행, 파일 I/O)은 Extension Host에서만 실행한다.
- Webview 커스텀 훅(`useXxx.ts`)은 상태 관리와 postMessage 전송만 담당한다.
- `child_process`, `fs`, `path` 등 Node.js 전용 모듈은 Extension Host 코드에서만 import한다.

---

## Communication Rules

### Extension ↔ Webview 메시지 프로토콜

모든 메시지는 `{ type: string, payload: unknown }` 구조를 따른다.

```typescript
// Webview → Extension (요청)
type WebviewToExtensionMessage =
  | { type: 'LOAD_COMMITS'; payload: CommitFilter }
  | { type: 'LOAD_FILE_DIFF'; payload: { commitHash: string; filePath: string } }
  | { type: 'START_AI_SUMMARY_FILE'; payload: { commitHash: string; filePath: string } }
  | { type: 'START_AI_SUMMARY_COMMIT'; payload: { commitHash: string } }
  | { type: 'START_BATCH_AI_SUMMARY'; payload: { commitHash: string; files: string[] } }
  | { type: 'CANCEL_BATCH_AI_SUMMARY' }
  | { type: 'LOAD_DEPENDENCY_GRAPH'; payload: { commitHash: string } }
  | { type: 'REGISTER_AI_PROVIDER'; payload: { name: AIProviderName } }
  | { type: 'ACTIVATE_AI_PROVIDER'; payload: { name: AIProviderName } }
  | { type: 'SET_SAVE_PATH' }
  | { type: 'CLEAR_SAVE_PATH' };

// Extension → Webview (응답/이벤트)
type ExtensionToWebviewMessage =
  | { type: 'COMMITS_LOADED'; payload: { commits: Commit[]; hasMore: boolean } }
  | { type: 'FILE_DIFF_LOADED'; payload: { diff: string } }
  | { type: 'AI_SUMMARY_CHUNK'; payload: { chunk: string } }
  | { type: 'AI_SUMMARY_DONE'; payload: { savedPath: string } }
  | { type: 'AI_SUMMARY_ERROR'; payload: { message: string } }
  | { type: 'BATCH_PROGRESS'; payload: { current: number; total: number } }
  | { type: 'BATCH_DONE'; payload: { failedCount: number } }
  | { type: 'DEPENDENCY_GRAPH_LOADED'; payload: { nodes: GraphNode[]; edges: GraphEdge[] } }
  | { type: 'AI_PROVIDER_REGISTERED'; payload: { providers: AIProvider[] } }
  | { type: 'SAVE_PATH_SET'; payload: { path: string } };
```

### Zustand 상태 관리 (Webview 전용)

- Webview 내 전역 상태는 Zustand 단일 스토어(`useAppStore`)에서 관리한다.
- Extension에서 받은 메시지는 `useVSCodeMessage` 훅에서 구독하여 Zustand 스토어를 업데이트한다.
- 화면 전환(`currentScreen`)도 Zustand 상태로 관리한다. `react-router`는 사용하지 않는다.

### child_process (Extension Host 전용)

- AI CLI 실행(`child_process.spawn`)은 Extension Host의 `aiRunner.ts`에서만 수행한다.
- 스트리밍 출력은 `data` 이벤트마다 `AI_SUMMARY_CHUNK` 메시지로 Webview에 전달한다.
- 타임아웃 120초 초과 시 프로세스를 `kill()`하고 `AI_SUMMARY_ERROR` 메시지를 전송한다.

---

## Data Flow Example: AI 정리 파일 단위 생성

```
Webview (F05_AISummaryFile)
  └─ [AI 정리 보기 클릭]
       └─ postMessage({ type: 'START_AI_SUMMARY_FILE', payload: { commitHash, filePath } })
            ↓
Extension Host (messageHandler.ts)
  └─ gitService.getFileDiff(commitHash, filePath)
       └─ summaryStorage.checkExists(savePath, folderName, fileName)
            ├─ [존재 시] → postMessage({ type: 'AI_SUMMARY_DONE', payload: { savedPath } })
            └─ [없을 시] → aiRunner.spawn(activeProvider, diff)
                              ├─ [data chunk] → postMessage({ type: 'AI_SUMMARY_CHUNK', payload: { chunk } })
                              └─ [close]       → summaryStorage.save(...)
                                                  → postMessage({ type: 'AI_SUMMARY_DONE', ... })
```

---

## Related Documents

- [development_environment.md](./development_environment.md)
- [state_management.md](./state_management.md)
- [directory_structure.md](./directory_structure.md)
- [coding_standards.md](./coding_standards.md)
