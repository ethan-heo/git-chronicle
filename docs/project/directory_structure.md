# Directory Structure — Git Author Explorer

> **버전** v1.0 | **작성일** 2026-06-26 | **상태** 확정

---

## 최상위 구조

```
git-author-explorer/
├── .vscode/
│   └── launch.json                   # Extension 디버그 실행 설정
├── dist/
│   ├── extension/                    # 컴파일된 Extension Host JS
│   └── webview/                      # Vite 번들링된 Webview SPA
├── docs/                             # 제품 문서 (이 파일이 있는 위치)
├── src/                              # 소스 코드
│   ├── extension/                    # Extension Host (Node.js)
│   └── webview/                      # Webview SPA (React)
├── tests/                            # 테스트 코드
├── package.json
├── tsconfig.json                     # Webview 타입스크립트 설정
├── tsconfig.extension.json           # Extension Host 타입스크립트 설정
├── vite.config.ts                    # Vite 빌드 설정
├── tailwind.config.ts                # TailwindCSS 설정
└── .vscodeignore                     # 패키징 제외 파일 목록
```

---

## src/extension/ 상세 구조

```
src/extension/
├── index.ts                          # activate() / deactivate() 진입점
├── webviewPanel.ts                   # WebviewPanel 생성·HTML 주입·패널 관리
├── messageHandler.ts                 # Webview → Extension 메시지 switch 라우터
├── git/
│   ├── gitService.ts                 # simple-git 래퍼
│   │   - getCommits(filter, page)    # git log 실행
│   │   - getChangedFiles(hash)       # git diff-tree --name-status 실행
│   │   - getFileDiff(hash, path)     # git diff 실행
│   │   - getFileContent(hash, path)  # git show 실행
│   └── gitTypes.ts                   # Commit, ChangedFile, CommitFilter 타입
├── ai/
│   ├── aiRunner.ts                   # child_process.spawn 기반 AI CLI 실행
│   │   - run(provider, prompt)       # 스트리밍 실행. 120초 타임아웃
│   ├── aiTypes.ts                    # AIProvider, AIProviderName, AIRunOptions
│   └── cliDetector.ts               # {cli} --version 실행으로 CLI 존재 확인
├── storage/
│   ├── summaryStorage.ts             # AI 정리 파일 읽기/쓰기
│   │   - exists(savePath, hash, file) → boolean
│   │   - read(savePath, hash, file)  → string
│   │   - write(savePath, hash, file, content)
│   │   - getFolderName(commitMessage) → 앞 50자 + 특수문자 치환
│   └── settingsStorage.ts            # ExtensionContext.globalState 래퍼
│       - getSavePath() / setSavePath()
│       - getProviders() / setProviders()
└── dependency/
    └── dependencyAnalyzer.ts         # dependency-cruiser 실행·그래프 결과 파싱
        - analyze(repoPath, files[])  → { nodes[], edges[] }
```

---

## src/webview/ 상세 구조

```
src/webview/
├── main.tsx                          # ReactDOM.createRoot 진입점
├── App.tsx                           # currentScreen에 따라 Screen 렌더링
├── store/
│   ├── useAppStore.ts                # Zustand 전역 스토어 (상태 + 액션 정의)
│   └── types.ts                      # AppState, ScreenID, Commit 등 공통 타입
├── bridge/
│   └── vscodeApi.ts                  # acquireVsCodeApi() 래퍼
│       - postMessage(type, payload)
│       - onMessage(handler)
├── features/
│   ├── F01_commit_log/
│   │   ├── CommitLogFeature.tsx      # S01에 마운트되는 Feature 루트 컴포넌트
│   │   ├── CommitFilterPanel.tsx     # 날짜/작성자/키워드 필터 UI
│   │   └── useCommitLog.ts           # 커밋 로드 훅 (postMessage, 디바운싱)
│   ├── F02_changed_file_tree/
│   │   ├── ChangedFileTreeFeature.tsx
│   │   ├── FileTreeNode.tsx          # 디렉토리/파일 노드 (재귀 렌더링)
│   │   └── useFileTree.ts
│   ├── F03_code_viewer/
│   │   ├── CodeViewerFeature.tsx
│   │   ├── DiffViewer.tsx            # unified diff + Shiki 하이라이팅
│   │   └── useCodeViewer.ts
│   ├── F04_dependency_canvas/
│   │   ├── DependencyCanvasFeature.tsx
│   │   ├── DependencyGraph.tsx       # React Flow 캔버스 루트
│   │   ├── FileNode.tsx              # React Flow 커스텀 노드
│   │   ├── DependencyEdge.tsx        # React Flow 커스텀 엣지
│   │   └── useDependencyCanvas.ts
│   ├── F05_ai_summary_file/
│   │   ├── AISummaryFileFeature.tsx
│   │   ├── AISummaryViewer.tsx       # 마크다운 렌더링 + 스트리밍 타이핑 효과
│   │   └── useAISummaryFile.ts
│   ├── F05b_ai_summary_commit/
│   │   ├── AISummaryCommitFeature.tsx
│   │   └── useAISummaryCommit.ts
│   ├── F06_ai_settings/
│   │   ├── AISettingsFeature.tsx
│   │   ├── AIProviderButton.tsx      # Claude/Gemini/Codex 등록·활성화 버튼
│   │   └── useAISettings.ts
│   ├── F07_save_path_settings/
│   │   ├── SavePathSettingsFeature.tsx
│   │   ├── SavePathSelector.tsx      # 경로 표시 + [변경] / [삭제] 버튼
│   │   └── useSavePath.ts
│   └── F08_batch_ai_summary/
│       ├── BatchAISummaryFeature.tsx
│       ├── BatchProgressBar.tsx      # 상단 고정 프로그레스 바
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
    │   ├── ActionButton.tsx
    │   ├── FileStatusBadge.tsx
    │   ├── SavedBadge.tsx
    │   └── FileActionButtons.tsx
    ├── hooks/
    │   ├── useVSCodeMessage.ts       # Extension → Webview 메시지 구독
    │   └── useDebounce.ts            # 300ms 디바운싱 훅
    └── utils/
        ├── folderName.ts             # getFolderName(message) → 파일시스템 안전 문자열
        ├── fileStatus.ts             # getStatusLabel(status) → 'A' | 'M' | 'D' | 'R'
        └── formatDate.ts             # ISO 8601 → 'YYYY.MM.DD' 포매터
```

---

## docs/ 구조

```
docs/
├── product/
│   └── product_overview.md
├── project/
│   ├── architecture.md
│   ├── development_environment.md
│   ├── coding_standards.md
│   ├── state_management.md
│   ├── directory_structure.md      ← 이 파일
│   └── testing_strategy.md
├── core/
│   ├── design_principles.md
│   ├── naming_rules.md
│   ├── interaction_model.md
│   ├── state_model.md
│   ├── design_tokens.md
│   └── global_components.md
├── features/
│   ├── F01_commit_log/
│   │   ├── spec.md
│   │   ├── blueprint.md
│   │   └── design_prompt.md
│   ├── F02_changed_file_tree/
│   ├── F03_code_viewer/
│   ├── F04_dependency_canvas/
│   ├── F05_ai_summary_file/
│   ├── F05b_ai_summary_commit/
│   ├── F06_ai_settings/
│   ├── F07_save_path_settings/
│   └── F08_batch_ai_summary/
├── screens/
│   ├── S01_commit_list/blueprint.md
│   ├── S02_history_view/blueprint.md
│   ├── S03_code_viewer/blueprint.md
│   ├── S04_ai_summary_viewer/blueprint.md
│   ├── S05_dependency_canvas/blueprint.md
│   └── S06_settings/blueprint.md
└── components/
    ├── TopHeader.md
    ├── BackButton.md
    ├── CommitListItem.md
    ├── CommitFilterPanel.md
    ├── FileTreeNode.md
    ├── AISummaryViewer.md
    ├── DiffViewer.md
    ├── DependencyGraph.md
    ├── FileNode.md
    ├── DependencyEdge.md
    ├── BatchProgressBar.md
    ├── AIProviderButton.md
    └── SavePathSelector.md
```

---

## tests/ 구조

```
tests/
├── unit/
│   ├── utils/
│   │   ├── folderName.test.ts
│   │   └── fileStatus.test.ts
│   └── store/
│       └── useAppStore.test.ts
├── component/
│   ├── CommitListItem.test.tsx
│   ├── FileTreeNode.test.tsx
│   ├── AISummaryViewer.test.tsx
│   └── BatchProgressBar.test.tsx
└── extension/
    ├── gitService.test.ts
    ├── summaryStorage.test.ts
    └── cliDetector.test.ts
```

---

## 관련 문서

- [architecture.md](./architecture.md)
- [coding_standards.md](./coding_standards.md)
- [../core/naming_rules.md](../core/naming_rules.md)
