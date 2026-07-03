# Screen: S04_AISummaryViewerScreen

## Related Features

- [F05b_AISummaryCommit](../../features/F05b_ai_summary_commit/spec.md) — 커밋 단위 AI 정리
- [F09_AISummaryQA](../../features/F09_ai_summary_qa/spec.md) — 요약 후 단일 질문/답변

---

## Purpose

AI가 생성한 커밋 단위 마크다운 요약을 스트리밍으로 표시하고, 저장본 재활용 및 재생성을 지원하는 뷰어 화면.

---

## Entry Condition

S02_HistoryViewScreen에서 [커밋 AI 정리] 클릭 시 진입. `selectedCommit` 전역 상태 설정 후 진입. 헤더는 title: `{커밋 메시지}`, context: `커밋 전체 요약`으로 표시된다.

---

## Parent Screen

- [S02_HistoryViewScreen](../S02_history_view/blueprint.md)

---

## Child Screens

없음

---

## Layout Structure

```
S04_AISummaryViewerScreen
├─ TopHeader (title: {커밋 메시지}, context: "커밋 전체 요약")
│   ├─ BackButton → 이전 화면 복귀
│   └─ SettingsIcon (⚙) → S06
├─ TokenLimitWarning (조건부)
└─ AISummaryViewer (스크롤 영역)
    ├─ RegenerateButton (저장본/저장 완료본 있을 때)
    ├─ AI 전용 로딩 프리뷰 (설정/저장본 확인 중)
    ├─ StreamingTextRenderer (생성 중)
    ├─ [react-markdown] (완료 후)
    ├─ QAInputArea (요약 완료 시)
    ├─ EmptyState [noAI] (AI 미설정)
    └─ EmptyState [noPath] (경로 미설정)
```

---

## Components

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) | `src/webview/shared/components/TopHeader.tsx` |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) | `src/webview/shared/components/BackButton.tsx` |
| `EmptyState` | [global_components](../../core/global_components.md#emptystate) | `src/webview/shared/components/EmptyState.tsx` |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) | `src/webview/shared/components/ErrorState.tsx` |
| `AISummaryViewer` | [F05b blueprint](../../features/F05b_ai_summary_commit/blueprint.md#component-aisummaryviewer) | `src/webview/features/F05/AISummaryViewer.tsx`(코드는 아직 F05 폴더에 있음 — [known_issues.md](../../project/known_issues.md) 참고) |
| `StreamingTextRenderer` | [F05b blueprint](../../features/F05b_ai_summary_commit/blueprint.md#component-streamingtextrenderer) | `src/webview/features/F05/StreamingTextRenderer.tsx` |
| `RegenerateButton` | [F05b blueprint](../../features/F05b_ai_summary_commit/blueprint.md#component-regeneratebutton) | `src/webview/features/F05/RegenerateButton.tsx` |
| `TokenLimitWarning` | [F05b blueprint](../../features/F05b_ai_summary_commit/blueprint.md#component-tokenlimitwarning) | `src/webview/features/F05/TokenLimitWarning.tsx` |
| `OverwriteConfirmDialog` | [F05b blueprint](../../features/F05b_ai_summary_commit/blueprint.md#component-overwriteconfirmdialog) | `src/webview/features/F05/OverwriteConfirmDialog.tsx` |
| `QAInputArea` | [F09 blueprint](../../features/F09_ai_summary_qa/blueprint.md#component-qainputarea) | `src/webview/features/F09/QAInputArea.tsx` |

---

## Screen States

`noAI`/`noPath`/`loading`/`generating`/`displaying.saved`/`displaying.new`/`error`는 [F05b_ai_summary_commit/blueprint.md](../../features/F05b_ai_summary_commit/blueprint.md)의 State Model이 유일한 출처다. 아래는 F09(Q&A)가 조합될 때만 발생하는 화면 전용 상태다.

| 상태 | 조건 | UI |
|------|------|-----|
| `qa.generating` | `isGeneratingQA === true` | 질문 버튼 비활성화 + 답변 스트리밍 박스 |

---

## Interaction Flow

요약 생성/재생성 흐름은 [F05b_ai_summary_commit/blueprint.md](../../features/F05b_ai_summary_commit/blueprint.md)의 Interaction Model이, 질문/답변 흐름은 [F09_ai_summary_qa/blueprint.md](../../features/F09_ai_summary_qa/blueprint.md)의 Interaction Model이 유일한 출처다.

```
BackButton → 이전 화면 복귀
⚙ → S06
```

---

## Responsive Rules

- `AISummaryViewer`는 화면 너비에 맞게 마크다운 콘텐츠 폭 자동 조정
- `TokenLimitWarning`은 [접기] 버튼으로 숨길 수 있으며 좁은 너비에서도 텍스트와 버튼이 겹치지 않는다.
