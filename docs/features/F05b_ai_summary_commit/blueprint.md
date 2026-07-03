# Feature Blueprint: F05b_AISummaryCommit

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

커밋 전체 diff를 AI CLI로 전달하여 커밋 단위 종합 요약을 스트리밍으로 생성·표시·저장한다. S-04를 F05_AISummaryFile과 공유하되, `summaryMode = "commit"`로 구분한다.

---

## Inputs

- `selectedCommit: Commit` — 커밋 전체 diff 추출용 및 헤더 표시용
- `activeAIProvider: AIProviderName | null`
- `savePath: string | null`

---

## Outputs

- `currentSummaryContent: string` — 스트리밍 누적 텍스트 (전역 상태)
- 저장 파일: `{savePath}/{shortHash}_{sanitizedCommitMessage}/전체_파일_정리.md`

---

## Components

F05_AISummaryFile과 동일한 컴포넌트를 공유하며, `summaryMode = "commit"`로 동작을 분기한다.

- `AISummaryViewer`
- `StreamingTextRenderer`
- `RegenerateButton`
- `TokenLimitWarning`
- `OverwriteConfirmDialog`

---

## Component Definitions

F05_AISummaryFile의 컴포넌트 정의를 그대로 사용한다. 아래 항목만 다르다.

### TopHeader 차이점

| 모드 | 헤더 표시 |
|------|-----------|
| 파일 단위 (F05) | `{커밋 메시지} > {파일 경로}` |
| 커밋 단위 (F05b) | `{커밋 메시지} > 커밋 전체 요약` |

### 저장 경로 차이점

| 모드 | 저장 파일명 |
|------|------------|
| 파일 단위 (F05) | `{파일명}.md` |
| 커밋 단위 (F05b) | `전체_파일_정리.md` |

---

## Variants

[F05_AISummaryFile blueprint](../F05_ai_summary_file/blueprint.md#variants)와 동일.

---

## Layout Rules

F05_AISummaryFile과 동일한 레이아웃을 사용한다. `summaryMode` 값에 따라 헤더와 저장 경로만 달라진다.

---

## Interaction Model

[F05_AISummaryFile blueprint](../F05_ai_summary_file/blueprint.md#interaction-model)와 동일.

---

## State Model

[F05_AISummaryFile blueprint](../F05_ai_summary_file/blueprint.md#state-model)와 동일. `summaryMode = "commit"` 값만 다름.

---

## Empty States

- `EmptyState` (message: "AI가 설정되지 않았습니다", ctaLabel: "설정으로 이동")
- `EmptyState` (message: "저장 경로를 먼저 설정해주세요", ctaLabel: "설정으로 이동")

---

## Error States

- `ErrorState` (message: "생성에 실패했습니다", onRetry: AI 재호출)
- `ErrorState` (message: "연결된 CLI를 찾을 수 없습니다. 설정을 확인하세요")

---

## Loading States

[F05_AISummaryFile blueprint](../F05_ai_summary_file/blueprint.md#loading-states)와 동일.

---

## Responsive Rules

[F05_AISummaryFile blueprint](../F05_ai_summary_file/blueprint.md#responsive-rules)와 동일.

---

## Reusable Components

- [`EmptyState`](../../core/global_components.md#emptystate)
- [`ErrorState`](../../core/global_components.md#errorstate)
- [`TopHeader`](../../core/global_components.md#topheader)
- [`BackButton`](../../core/global_components.md#backbutton)
