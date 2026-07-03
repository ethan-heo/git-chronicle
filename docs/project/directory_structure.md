# Directory Structure — GitChronicle

> **버전** v1.1 | **작성일** 2026-06-26 | **갱신** 2026-07-01 (F09/F10, docs 색인 정리) | **상태** 확정

---

## 최상위 구조

```
git-chronicle/
├── .vscode/
│   └── launch.json                   # Extension 디버그 실행 설정
├── dist/
│   ├── extension/                    # 컴파일된 Extension Host JS
│   └── webview/                      # Vite 번들링된 Webview SPA
├── docs/                             # 제품 문서 (이 파일이 있는 위치)
├── src/                              # 소스 코드
│   ├── extension/                    # Extension Host (Node.js)
│   └── webview/                      # Webview SPA (React)
│       ├── global.css                # Tailwind v4 엔트리 + @theme inline 토큰 + 전역 reset/motion
│       ├── i18n/                     # 로컬 번역 리소스 및 최소 런타임
│       ├── i18next.ts                # i18next 호환 로컬 엔트리
│       └── react-i18next.ts          # react-i18next 호환 로컬 엔트리
├── tests/                            # 테스트 코드
├── scripts/                          # 빌드/릴리스/문서 검증용 스크립트
│   ├── copy-dependency-cruiser.mjs   # dependency-cruiser 및 transitive deps를 dist로 복사
│   ├── changelog.config.cjs          # conventional-changelog 커밋 정렬 설정
│   └── check-docs-sync.mjs           # docs/가 소스 코드와 어긋나지 않았는지 검증 (pre-commit 훅에서 실행)
├── .husky/
│   └── pre-commit                    # `pnpm docs:check` 실행, 실패 시 커밋 차단
├── package.json
├── package.nls.json                  # VSCode manifest 기본 언어 문자열
├── package.nls.ko.json               # VSCode manifest 한국어 문자열
├── tsconfig.json                     # Webview 타입스크립트 설정
├── tsconfig.extension.json           # Extension Host 타입스크립트 설정
├── tsconfig.graph.json               # MCP/코드 그래프용 통합 타입스크립트 설정 (webview + extension + tests)
├── vite.config.ts                    # Vite 빌드 설정
├── tailwind.config.ts                # TailwindCSS 보조 설정 파일(현재 스타일 토큰의 기준은 `src/webview/global.css`)
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
│   - JS/TS/CJS/ESM은 `dist/depcruiser-runner.mjs`를 통한 dependency-cruiser API, Python/Go는 텍스트 파싱 사용
├── intraFileDependencyService.ts     # F10 파일 내부 심볼 의존성 분석
│   - analyzeSymbolGraph(repoPath, filePath, commitHash) → { nodes: SymbolNode[], edges: SymbolEdge[] }
│   - JS/TS는 TypeScript Compiler API, Python/Go는 정규식 파서 사용
├── aiService.ts                      # child_process.spawn 기반 AI CLI 스트리밍 실행
│   - streamAISummary(options)        # stdout chunk 전달, 120초 타임아웃, 취소 함수 반환
├── aiTypes.ts                        # AIProviderName 타입 ('claude' | 'gemini' | 'codex')
├── aiProviderService.ts              # AI 프로바이더/모델 선택 상태(AISettingsState) 관리
│   - registerAIProvider / setActiveAIProvider / setAIModel / setSavePath
├── batchService.ts                   # 파일 단위 AI 정리 일괄 순차 실행
│   - runBatchAISummary(options)      # 저장본 스킵, 실패 계속 진행, 취소 플래그 확인
├── prompts.ts                        # AI 정리 프롬프트 빌더
│   - buildFileSummaryPrompt(filePath, diff)
│   - buildCommitSummaryPrompt(commitHash, diff)
│   - buildSummaryQAPrompt(summaryContent, diff, question)  # F09 Q&A
└── summaryFileService.ts             # AI 정리 파일 읽기/쓰기/존재 확인
    - SummarySaveError                # 저장 경로 생성/쓰기 실패 전용 오류
    - loadSummary(savePath, hash, file) → { content, savedPath } | null
    - saveSummary(savePath, hash, file, content) → savedPath
    - loadCommitSummary(savePath, hash) → { content, savedPath } | null
    - saveCommitSummary(savePath, hash, content) → savedPath
    - hasSavedSummary(savePath, hash, file) → boolean
    - appendSummaryQA(savedPath, question, answer) → string  # F09 질문/답변 append
    - 파일명 규칙: filePath의 / 또는 \ 를 __로 치환 후 .md 추가
```

---

## src/webview/ 상세 구조

```
src/webview/
├── global.css                        # Tailwind v4 엔트리, VSCode 토큰 매핑, 전역 reset/keyframes
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
│   ├── F08/
│   │   ├── BatchCancelButton.tsx
│   │   ├── BatchProgressBar.tsx      # 상단 고정 프로그레스 바
│   │   └── BatchProgressBar.css
│   ├── F09/                          # AI 요약 Q&A + 인라인 분할 패널
│   │   ├── S07CodeAndAISummaryScreen.tsx # 미참조 레거시 파일 (더 이상 라우팅되지 않음)
│   │   ├── AISummaryPanel.tsx        # S03 우측 인라인 AI 요약 패널
│   │   ├── DiffViewerPanel.tsx       # S04 우측 인라인 코드 패널
│   │   ├── QAInputArea.tsx           # 요약 완료 후 질문 입력 영역
│   │   ├── SplitSidePanel.css
│   │   └── index.ts
│   └── F10/                          # 파일 내부 심볼 의존성 캔버스 (S08)
│       ├── S08_IntraFileSymbolDependencyCanvasScreen.tsx
│       ├── SymbolGraph.tsx           # React Flow 캔버스 컨테이너
│       ├── SymbolNode.tsx / SymbolEdge.tsx / SymbolKindBadge.tsx
│       ├── SymbolLegendPanel.tsx
│       ├── SymbolCodePanel.tsx       # 우측 슬라이드 인 코드 패널
│       ├── SymbolFileCodeViewer.tsx  # Shiki 기반 코드 뷰어
│       ├── symbolGraphUtils.ts       # Dagre/kind 그룹 레이아웃 계산
│       └── index.ts
├── screens/                          # 향후 독립 Screen 컴포넌트 확장 위치
│   └── 현재 화면 컴포넌트는 각 feature 디렉터리에서 구현
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
    │   ├── FileActionButtons.tsx
    │   └── index.ts                  # 전역 컴포넌트 barrel export
    ├── hooks/
    │   ├── useVSCodeMessage.ts       # Extension → Webview 메시지 구독
    │   └── useDebounce.ts            # 300ms 디바운싱 훅
    ├── route/
    │   └── RouteSlotContext.tsx      # active/inactive 라우트 슬롯 컨텍스트
    ├── design/
    │   └── tokens.ts                 # legacy `--gae-*` alias의 TypeScript 참조 상수
    └── utils/
        ├── fileStatus.ts             # getStatusLabel(status) → 'A' | 'M' | 'D' | 'R'
        └── formatDate.ts             # ISO 8601 → 'YYYY.MM.DD' 포매터
```

### Webview 스타일 구조 규칙

> 스타일 작성 규칙은 [coding_standards.md](./coding_standards.md)의 "스타일 작성 규칙" 섹션이 유일한 출처다.

---

## docs/ 구조

전체 문서 색인은 [docs/README.md](../README.md)를 기준으로 한다(이 섹션에 중복 나열하지 않는다 — 목록이 실제 파일과 어긋나는 것을 방지하기 위함). 요약하면:

- `product/`, `project/`, `core/`: 프로젝트 전반의 고정 규칙 문서.
- `features/F##_*/`: 기능별 `spec.md`(요구사항) + `blueprint.md`(UI/컴포넌트 계약) 2개 파일만 유지한다. AI 생성용 프롬프트나 구현 상세는 영구 문서로 두지 않고, 작업 시 계획서(Plan)로 생성 후 완료 시 spec/blueprint에 반영하고 폐기한다.
- `screens/S##_*/blueprint.md`: 화면 단위 진입 조건·상태·내비게이션 흐름. 여러 Feature를 조합하는 화면(S04, S06)만 별도로 조합 관계를 문서화하고, 단일 Feature 화면은 해당 Feature `blueprint.md`와 함께 참고한다.
- Feature 전용 컴포넌트는 별도 `components/*.md`를 두지 않고 해당 `blueprint.md`의 Component Definitions 섹션이 유일한 문서다. 여러 Feature가 공유하는 컴포넌트만 [core/global_components.md](../core/global_components.md)에 문서화한다.

---

## tests/ 구조

```
tests/
├── unit/
│   ├── smoke.test.ts
│   ├── parseDiff.test.ts
│   ├── graph.test.ts
│   ├── dependencyGraph.test.ts
│   ├── dependencyService.test.ts
│   ├── intraFileDependencyService.test.ts    # F10
│   ├── summaryFileService.test.ts
│   ├── aiService.test.ts
│   ├── aiProviderService.test.ts
│   ├── appStorePersistence.test.ts
│   └── batchService.test.ts
└── setup.ts
```

---

## 관련 문서

- [architecture.md](./architecture.md)
- [coding_standards.md](./coding_standards.md)
- [../core/naming_rules.md](../core/naming_rules.md)

## 다국어 관련 파일

- `package.nls.json` / `package.nls.ko.json`: VSCode 확장 매니페스트와 설정 설명 문자열의 로컬라이즈 버전이다.
- `src/webview/i18n/locales/en/translation.json` / `src/webview/i18n/locales/ko/translation.json`: Webview 화면과 공통 컴포넌트에서 사용하는 UI 문자열을 관리한다.
- `src/webview/i18next.ts` / `src/webview/react-i18next.ts`: Webview 내부에서 외부 패키지 import 경로를 유지하기 위한 로컬 호환 엔트리다.
