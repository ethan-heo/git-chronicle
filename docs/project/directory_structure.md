# Directory Structure — GitRewind

> **버전** v1.0 | **작성일** 2026-06-26 | **상태** 확정

---

## 최상위 구조

```
git-rewind/
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
├── gitService.ts                     # simple-git 기반 Git 조회 서비스
│   - fetchCommits(filter, page)      # git log 실행
│   - GitRepositoryNotFoundError      # Git 저장소 미감지 오류 타입
├── dependencyService.ts              # 언어별 의존 관계 분석 서비스
│   - analyzeDependencies(repoPath, files[]) → DependencyEdge[]
│   - JS/TS/CJS/ESM은 dependency-cruiser, Python/Go는 텍스트 파싱 사용
├── aiService.ts                      # child_process.spawn 기반 AI CLI 스트리밍 실행
│   - streamAISummary(options)        # stdout chunk 전달, 120초 타임아웃, 취소 함수 반환
├── aiTypes.ts                        # AIProviderName 타입 ('claude' | 'gemini' | 'codex')
├── batchService.ts                   # 파일 단위 AI 정리 일괄 순차 실행
│   - runBatchAISummary(options)      # 저장본 스킵, 실패 계속 진행, 취소 플래그 확인
├── prompts.ts                        # AI 정리 프롬프트 빌더
│   - buildFileSummaryPrompt(filePath, diff)
└── summaryFileService.ts             # AI 정리 파일 읽기/쓰기/존재 확인
    - SummarySaveError                # 저장 경로 생성/쓰기 실패 전용 오류
    - loadSummary(savePath, hash, file) → { content, savedPath } | null
    - saveSummary(savePath, hash, file, content) → savedPath
    - loadCommitSummary(savePath, hash) → { content, savedPath } | null
    - saveCommitSummary(savePath, hash, content) → savedPath
    - hasSavedSummary(savePath, hash, file) → boolean
    - 파일명 규칙: filePath의 / 또는 \ 를 __로 치환 후 .md 추가
```

---

## src/webview/ 상세 구조

```
src/webview/
├── main.tsx                          # ReactDOM.createRoot 진입점
├── App.tsx                           # currentScreen에 따라 Screen 렌더링 + 라우트 전환 슬롯 관리
├── store/
│   └── appStore.ts                   # Zustand 전역 스토어 (상태 + 액션 정의)
├── types/
│   └── commit.ts                     # Commit, FilterState, ScreenID, RouteTransitionDirection 타입
├── bridge/
│   └── vscodeApi.ts                  # acquireVsCodeApi() 래퍼
│       - postMessage(type, payload)
│       - isVSCodeRuntime()
├── features/
│   ├── F01/
│   │   ├── S01_CommitListScreen.tsx  # S01 화면 조합 컴포넌트
│   │   ├── CommitFilterPanel.tsx     # 날짜/작성자/키워드/정렬 필터 UI
│   │   ├── DateRangeFilter.tsx       # 시작일/종료일 입력
│   │   ├── AuthorDropdown.tsx        # 작성자 선택
│   │   ├── KeywordSearchInput.tsx    # 300ms 디바운스 키워드 검색
│   │   ├── SortOrderToggle.tsx       # 최신순/오래된순 전환 토글
│   │   ├── CommitList.tsx            # 커밋 목록 및 상태 분기
│   │   ├── CommitListItem.tsx        # 커밋 행
│   │   ├── InfiniteScrollTrigger.tsx # IntersectionObserver 추가 로드 트리거
│   │   └── index.ts                  # F01 barrel export
│   ├── F02/
│   │   ├── S02_HistoryViewScreen.tsx # S02 화면 조합, 변경 파일 메시지 구독
│   │   ├── CommitActionBar.tsx       # 커밋 단위 액션 버튼
│   │   ├── FileTree.tsx              # 변경 파일 트리 컨테이너
│   │   ├── DirectoryNode.tsx         # 디렉토리 노드 (재귀 렌더링)
│   │   ├── FileTreeNode.tsx          # 파일 노드 (상태/저장됨/액션)
│   │   ├── tree.ts                   # ChangedFile[] → 디렉토리 트리 변환
│   │   └── index.ts                  # F02 barrel export
│   ├── F03/
│   │   ├── S03_CodeViewerScreen.tsx  # S03 화면 조합, diff 메시지 구독
│   │   ├── DiffViewer.tsx            # 상태 분기 + diff list 컨테이너
│   │   ├── DiffLine.tsx              # old/new line number + +/- prefix + code token
│   │   ├── parseDiff.ts              # unified diff → DiffLineData[]
│   │   ├── highlightDiff.ts          # Shiki lazy highlighter
│   │   ├── types.ts                  # DiffLineData, FileDiffPayload 타입
│   │   └── index.ts                  # F03 barrel export
│   ├── F04/
│   │   ├── S05_DependencyCanvasScreen.tsx # S05 화면 조합, 의존성 메시지 구독
│   │   ├── DependencyGraph.tsx       # React Flow 캔버스 루트
│   │   ├── FileNode.tsx              # React Flow 커스텀 노드
│   │   ├── DependencyEdge.tsx        # React Flow 커스텀 엣지
│   │   ├── CanvasControls.tsx        # 줌/맞춤 컨트롤
│   │   ├── LegendPanel.tsx           # 캔버스 범례
│   │   ├── graph.ts                  # ChangedFile[] + DependencyEdge[] → 그래프 데이터
│   │   └── index.ts                  # F04 barrel export
│   ├── F05/
│   │   ├── S04_AISummaryViewerScreen.tsx # S04 화면 조합, AI 요약 메시지 구독
│   │   ├── AISummaryViewer.tsx       # 상태 분기 + 마크다운 렌더링
│   │   ├── StreamingTextRenderer.tsx # 실시간 스트리밍 텍스트 + 커서
│   │   ├── RegenerateButton.tsx      # 저장본 재생성 버튼
│   │   ├── TokenLimitWarning.tsx     # 대용량 diff 경고 + 접기
│   │   ├── OverwriteConfirmDialog.tsx # 저장본 덮어쓰기 확인 모달
│   │   └── index.ts                  # F05 barrel export
│   ├── F06/
│   │   ├── S06_SettingsScreen.tsx    # S06 설정 화면 조합, 설정 메시지 구독
│   │   ├── AIProviderSection.tsx     # Claude/Gemini/Codex 등록·활성화 영역
│   │   ├── AIProviderButton.tsx      # AI CLI 등록·활성화 버튼
│   │   ├── SavePathSection.tsx       # F07 저장 경로 표시·선택·삭제 UI
│   │   ├── providers.ts              # AI provider UI 메타데이터
│   │   └── index.ts                  # F06 barrel export
│   └── F08_batch_ai_summary/
│       ├── BatchAISummaryFeature.tsx
│       ├── BatchProgressBar.tsx      # 상단 고정 프로그레스 바
│       └── useBatchAISummary.ts
├── screens/                          # 향후 독립 Screen 컴포넌트 확장 위치
│   └── 현재 화면 컴포넌트는 각 feature 디렉터리에서 구현
└── shared/
    ├── design/
    │   └── tokens.ts                 # --gae-* 디자인 토큰의 TypeScript 참조 상수
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
    │   ├── FileActionButtons.tsx
    │   └── index.ts                  # 전역 컴포넌트 barrel export
    ├── hooks/
    │   ├── useVSCodeMessage.ts       # Extension → Webview 메시지 구독
    │   └── useDebounce.ts            # 300ms 디바운싱 훅
    ├── route/
    │   └── RouteSlotContext.tsx      # active/inactive 라우트 슬롯 컨텍스트
    └── utils/
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
│   ├── F07_save_path_settings/      # 문서 전용. 실제 UI는 src/webview/features/F06/SavePathSection.tsx
│   └── F08_batch_ai_summary/
├── screens/
│   ├── S01_commit_list/blueprint.md
│   ├── S02_history_view/blueprint.md
│   ├── S03_code_viewer/blueprint.md
│   ├── S04_ai_summary_viewer/blueprint.md
│   ├── S04_dependency_canvas/blueprint.md
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
│   ├── smoke.test.ts
│   ├── parseDiff.test.ts
│   ├── dependencyGraph.test.ts
│   └── summaryFileService.test.ts
└── setup.ts
```

---

## 관련 문서

- [architecture.md](./architecture.md)
- [coding_standards.md](./coding_standards.md)
- [../core/naming_rules.md](../core/naming_rules.md)
