# Glossary — GitChronicle

> **요약:** 2개 이상 Feature가 공유하는 핵심 도메인 용어(Commit, Diff, Provider, Node/Edge, Symbol 등)의 정의와 관련 코드 식별자를 정리한다. 계획서 작성이나 구현 전, 여러 Feature에 걸친 용어를 재정의하지 않도록 항상 먼저 확인한다.

> Feature 전용 용어(특정 F##에서만 쓰는 개념)는 여기 두지 않고 해당 `features/F##_*/spec.md`의 "Domain Glossary" 섹션에 문서화한다. 정본 판단 기준은 [documentation_guidelines.md의 "용어집 문서화 규칙"](../project/documentation_guidelines.md#용어집-문서화-규칙)을 따른다.

---

## Git & Commit 도메인

| 용어 | 정의 | 관련 코드 식별자 | 등장 Feature |
|---|---|---|---|
| Commit | Git 커밋 1건. 목록/필터/선택의 기본 단위 | `Commit` (`src/webview/types/commit.ts`, `src/extension/gitService.ts`) | F01, F02, F03, F04, F05b, F09, F10, F11 |
| ChangedFile | 선택된 커밋에서 변경된 파일 1건(경로 + 상태 A/M/D/R) | `ChangedFile` (`src/webview/types/commit.ts`, `src/extension/gitService.ts`) | F02, F03, F04, F05b |
| shortHash | 커밋 해시 앞 7자리. 저장 디렉토리명 접두어로 사용 | `shortHash` (`Commit.shortHash`), `toCommitDirName()` (`src/extension/summaryFileService.ts`) | F02, F05b, F07, F09, F11 |
| requestId | 커밋 목록 요청의 응답 순서를 보장하기 위한 값. 오래된 응답은 폐기 기준으로 사용 | `requestId`, `lastRequestId`, `pendingRequestId` (`src/webview/store/appStore.ts`) | F01 |

## Diff & 코드 표시 도메인

| 용어 | 정의 | 관련 코드 식별자 | 등장 Feature |
|---|---|---|---|
| Diff (Unified Diff) | 파일 단위 변경 이력을 +/- 라인으로 표시하는 고정 포맷 | `DiffLineData`, `FileDiffPayload` (`src/webview/features/F03/types.ts`), `parseDiff.ts`, `useFileDiff.ts` | F02, F03, F09 |
| Symbol | 파일 내부의 함수/클래스/인터페이스/타입/변수/상수/enum 선언 1개 | `SymbolNode`, `SymbolKind` (`src/extension/intraFileDependencyService.ts`) | F02, F10 |
| Node / Edge (그래프) | 캔버스에서 파일 또는 심볼을 나타내는 시각적 단위(Node)와 그 사이의 의존 관계(Edge). F04는 파일 단위, F10은 심볼 단위로 같은 개념을 다른 대상에 적용한다 | `DependencyEdge` (F04, `src/extension/dependencyService.ts`), `SymbolNode`/`SymbolEdge` (F10, `src/extension/intraFileDependencyService.ts`) | F02, F04, F10 |

## AI 정리 도메인

| 용어 | 정의 | 관련 코드 식별자 | 등장 Feature |
|---|---|---|---|
| Provider | 등록된 AI CLI 하나(Claude/Gemini/Codex). 동시에 하나만 활성화(active) 가능 | `AIProviderName` (`src/extension/aiTypes.ts`), `activeAIProvider`, `registeredProviders` | F05b, F06, F07, F09 |
| AI Summary (AI 정리) | AI CLI로 생성한 마크다운 요약. 커밋 단위(F05b)와 파일 단위 두 스코프가 있다 | `currentSummaryContent`, `START_AI_SUMMARY_COMMIT`/`START_AI_SUMMARY_FILE` (`src/extension/messageHandler.ts`) | F02, F05b, F09, F11 |
| savePath | AI 정리/노트 결과물이 저장되는 로컬 루트 디렉토리 | `savePath`, `SET_SAVE_PATH` | F02, F05b, F06, F07, F09, F11 |
| Q&A (AI 요약 Q&A) | 완성된 AI 요약에 대해 단일 턴으로 추가 질문/답변을 이어붙이는 것 | `START_AI_QA`, `appendSummaryQA()` (`src/extension/summaryFileService.ts`) | F05b, F09, F11 |

## 화면 · 네비게이션 도메인

| 용어 | 정의 | 관련 코드 식별자 | 등장 Feature |
|---|---|---|---|
| Screen (S##) | 최상위 화면 단위. 현재 독립 화면은 S02만 남았고, 설정과 노트는 S02 내부 로컬 뷰/탭으로 흡수되었다 | `ScreenID`, `currentScreen` (`src/webview/types/commit.ts`, `src/webview/store/appStore.ts`) | 전체 |
| Workspace Tab | S02 화면 본문에서 동시에 열어둘 수 있는 콘텐츠 탭(`code`/`aiSummary`/`fileCanvas`/`symbolGraph`/`note`) | `openTabs`, `activeTabId`, `workspaceTabsSlice.ts` | F02, F03, F04, F05b, F09, F10, F11 |
| Route Slot | 화면 전환 애니메이션 동안 이전 화면이 잠시 함께 mount되는 슬롯. `useRouteSlotActive()`로 비활성 슬롯의 데이터 로딩/구독을 막는다 | `RouteSlotContext.tsx` (`src/webview/shared/route/`) | 전체 화면 |

---

## 관련 문서

- [../project/documentation_guidelines.md](../project/documentation_guidelines.md)
- [../README.md](../README.md)
