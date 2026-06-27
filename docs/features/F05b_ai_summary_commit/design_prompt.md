# Design Prompt: F05b_AISummaryCommit

> Claude Design 또는 Figma AI에 직접 입력하여 디자인을 생성하는 프롬프트

---

## Product Context

F05_AISummaryFile과 동일한 S04_AISummaryViewerScreen을 공유한다. `summaryMode = "commit"` 값으로 분기. TopHeader의 breadcrumb과 저장 파일명만 다르다.

---

## Design Goal

F05_AISummaryFile의 디자인을 그대로 사용하되, 아래 두 가지 차이점만 반영한 Variant를 추가한다:

1. TopHeader breadcrumb: `{커밋 메시지} > 커밋 전체 요약`
2. 저장 경로: 저장본 또는 생성 완료 상태에서 `{savePath}/{커밋해시}/_commit_summary.md`를 액션바에 표시

---

## Information Architecture

F05_AISummaryFile과 동일. Variant만 추가.

```
S04_AISummaryViewerScreen [commit]
├─ TopHeader ({커밋 메시지} > 커밋 전체 요약)
├─ TokenLimitWarning (조건부)
├─ RegenerateButton (저장본 있을 때)
└─ AISummaryViewer (스크롤 영역)
    └─ [F05와 동일 구조]
```

---

## Component Tree

[F05_AISummaryFile design_prompt.md](../F05_ai_summary_file/design_prompt.md)와 동일. TopHeader title 텍스트만 다름.

---

## Interactions

[F05_AISummaryFile design_prompt.md](../F05_ai_summary_file/design_prompt.md)와 동일.

---

## States

[F05_AISummaryFile design_prompt.md](../F05_ai_summary_file/design_prompt.md)와 동일.

---

## Visual Guidance

[F05_AISummaryFile design_prompt.md](../F05_ai_summary_file/design_prompt.md)와 동일.

---

## Naming Rules (Figma)

```
S04_AISummaryViewerScreen [commit]
├─ TopHeader  ← breadcrumb: "{커밋 메시지} > 커밋 전체 요약"
├─ TokenLimitWarning
├─ RegenerateButton [default]
├─ RegenerateButton [disabled]
└─ AISummaryViewer (F05와 동일)
```

---

## MCP Rules

S04_AISummaryViewerScreen의 `summaryMode` Variant로 처리. 별도 Frame 불필요.

- `S04_AISummaryViewerScreen [file]`과 `S04_AISummaryViewerScreen [commit]`은 동일 Component의 Variant
- TopHeader의 `title` prop 값만 다름

---

## References

- [F05b spec.md](./spec.md)
- [F05b blueprint.md](./blueprint.md)
- [F05 design_prompt.md](../F05_ai_summary_file/design_prompt.md)
