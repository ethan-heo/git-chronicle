# Screen: S04_AISummaryViewerScreen

## Related Features

- [F05_AISummaryFile](../../features/F05_ai_summary_file/spec.md) — 파일 단위 AI 정리
- [F05b_AISummaryCommit](../../features/F05b_ai_summary_commit/spec.md) — 커밋 단위 AI 정리
- [F09_AISummaryQA](../../features/F09_ai_summary_qa/spec.md) — 요약 후 단일 질문/답변

---

## Purpose

AI가 생성한 마크다운 요약을 스트리밍으로 표시하고, 저장본 재활용 및 재생성을 지원하는 뷰어 화면. 파일 단위와 커밋 단위 요약을 `summaryMode`로 구분하여 하나의 화면에서 처리한다.

---

## Entry Condition

다음 경로에서 진입. `selectedFile` 또는 `selectedCommit`, `summaryMode` 설정 후 진입.

| 진입 경로 | summaryMode | 헤더 |
|-----------|-------------|------|
| S02 파일 호버 → [AI 정리 보기] | `"file"` | title: `{커밋 메시지}`, context: `{파일 경로}` |
| S05 노드 호버 → [AI 정리 보기] | `"file"` | title: `{커밋 메시지}`, context: `{파일 경로}` |
| S02 [커밋 AI 정리] | `"commit"` | title: `{커밋 메시지}`, context: `커밋 전체 요약` |

---

## Parent Screen

- [S02_HistoryViewScreen](../S02_history_view/blueprint.md) (주 진입 경로)
- [S05_DependencyCanvasScreen](../S04_dependency_canvas/blueprint.md) (보조 진입 경로)

---

## Child Screens

- 우측 인라인 코드 패널: `DiffViewerPanel`

---

## Layout Structure

```
S04_AISummaryViewerScreen
├─ TopHeader (title: {커밋 메시지}, context: {파일 경로 or "커밋 전체 요약"})
│   ├─ BackButton → 이전 화면 복귀
│   └─ SettingsIcon (⚙) → S06
└─ ai-split-workspace
   ├─ ai-split-main-panel
   │  ├─ TokenLimitWarning (조건부)
   │  └─ AISummaryViewer (스크롤 영역)
   │      ├─ RegenerateButton (저장본/저장 완료본 있을 때)
   │      ├─ AI 전용 로딩 프리뷰 (설정/저장본 확인 중)
   │      ├─ StreamingTextRenderer (생성 중)
   │      ├─ [react-markdown] (완료 후)
   │      ├─ QAInputArea (요약 완료 시)
   │      ├─ EmptyState [noAI] (AI 미설정)
   │      └─ EmptyState [noPath] (경로 미설정)
   └─ DiffViewerPanel (조건부 인라인 패널)
```

---

## Components

| 컴포넌트 | 출처 |
|---------|------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) |
| `EmptyState` | [global_components](../../core/global_components.md#emptystate) |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) |
| `AISummaryViewer` | [F05 blueprint](../../features/F05_ai_summary_file/blueprint.md) |
| `StreamingTextRenderer` | [F05 blueprint](../../features/F05_ai_summary_file/blueprint.md) |
| `RegenerateButton` | [F05 blueprint](../../features/F05_ai_summary_file/blueprint.md) |
| `TokenLimitWarning` | [F05 blueprint](../../features/F05_ai_summary_file/blueprint.md) |
| `OverwriteConfirmDialog` | [F05 blueprint](../../features/F05_ai_summary_file/blueprint.md) |
| `DiffViewerPanel` | [S07 blueprint](../S07_code_and_ai_summary/blueprint.md) |

---

## Screen States

| 상태 | 조건 | UI |
|------|------|-----|
| `noAI` | `activeAIProvider === null` | `EmptyState` (AI 미설정) |
| `noPath` | `savePath === null` | `EmptyState` (경로 미설정) |
| `loading` | 설정 또는 저장본 확인 중 | AI 전용 로딩 프리뷰 |
| `generating` | `isGeneratingSummary === true` | `StreamingTextRenderer` |
| `qa.generating` | `isGeneratingQA === true` | 질문 버튼 비활성화 + 답변 스트리밍 박스 |
| `displaying.saved` | 저장본 존재 | react-markdown + `RegenerateButton` |
| `displaying.new` | 새로 생성 완료 | react-markdown + `RegenerateButton` |
| `error` | 타임아웃 또는 CLI 실패 | `ErrorState` |

---

## Interaction Flow

```
[진입]
    → FETCH_AI_SUMMARY_SETTINGS
    → activeAIProvider 확인
        → (null) EmptyState [noAI] + "설정으로 이동" CTA
    → savePath 확인
        → (null) EmptyState [noPath] + "설정으로 이동" CTA
    → 저장본 확인
        → (있음) react-markdown 즉시 표시 + RegenerateButton
        → (없음) AI 호출 시작
            → StreamingTextRenderer (타이핑 효과)
            → 완료 → react-markdown + RegenerateButton + 저장
            → 타임아웃/실패 → ErrorState + [재시도]
    → RegenerateButton 클릭
        → OverwriteConfirmDialog
            → [확인] → AI 재호출
            → [취소] → 현재 저장본 유지
    → 요약 완료 후 질문 입력 영역 노출
        → Enter / [질문하기]
            → START_AI_QA
            → AI_QA_CHUNK
            → AI_QA_COMPLETE
            → 현재 요약 + 저장된 .md 파일에 질문/답변 블록 append (`### Q. ...`)
    → [코드 함께 보기] 클릭 시 isSplitPanelOpen 토글
    → 우측 DiffViewerPanel 슬라이드 인
    → BackButton → 이전 화면 복귀
    → ⚙ → S06
```

---

## Responsive Rules

- `AISummaryViewer`는 화면 너비에 맞게 마크다운 콘텐츠 폭 자동 조정
- `TokenLimitWarning`은 [접기] 버튼으로 숨길 수 있으며 좁은 너비에서도 텍스트와 버튼이 겹치지 않는다.
