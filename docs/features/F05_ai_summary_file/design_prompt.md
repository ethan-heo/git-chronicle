# Design Prompt: F05_AISummaryFile

> Claude Design 또는 Figma AI에 직접 입력하여 디자인을 생성하는 프롬프트

---

## Product Context

GitRewind VSCode Extension. [AI 정리 보기] 버튼 클릭 시 진입하는 S04_AISummaryViewerScreen. 파일 단위 AI 정리 결과를 스트리밍으로 표시하고 저장하는 화면. F05b_AISummaryCommit과 동일 화면을 `summaryMode`로 구분하여 공유한다.

---

## Design Goal

AI가 실시간으로 마크다운 요약을 생성하는 과정(스트리밍 타이핑 효과)과 완성된 마크다운 렌더링을 동일 화면에서 자연스럽게 전환하는 UI를 디자인한다. 저장본이 있는 경우 즉시 표시하고 재생성 옵션을 제공한다. AI 미설정/경로 미설정 안내 화면도 포함한다.

---

## Information Architecture

```
S04_AISummaryViewerScreen [file]
├─ TopHeader ({커밋 메시지} > {파일 경로} + BackButton + ⚙)
├─ TokenLimitWarning (조건부 상단 배너)
├─ RegenerateButton (저장본 있을 때)
└─ AISummaryViewer (스크롤 영역)
    ├─ StreamingTextRenderer [streaming] (생성 중)
    ├─ [react-markdown 렌더링] (완료 후)
    ├─ EmptyState [noAI] (AI 미설정)
    └─ EmptyState [noPath] (경로 미설정)
```

---

## Component Tree

- `TopHeader`: breadcrumb `{커밋 메시지} > {파일 경로}` + BackButton + ⚙
- `TokenLimitWarning`: "diff가 큽니다. AI가 일부를 생략할 수 있습니다" 경고 배너
- `RegenerateButton`: [재생성] 버튼 (저장본 있을 때만)
- `AISummaryViewer`: 마크다운 결과 표시 영역
  - `StreamingTextRenderer`: 실시간 타이핑 효과 (블링킹 커서)
  - react-markdown: 완성 후 정적 렌더링
- `OverwriteConfirmDialog`: 덮어쓰기 확인 모달 ([재생성] 클릭 시)
- `EmptyState [noAI]`: "AI가 설정되지 않았습니다" + "설정으로 이동"
- `EmptyState [noPath]`: "저장 경로를 먼저 설정해주세요" + "설정으로 이동"

---

## Interactions

| 트리거 | 동작 |
|--------|------|
| 화면 진입 (저장본 없음) | AI 생성 시작 → 스트리밍 표시 |
| 화면 진입 (저장본 있음) | 저장된 마크다운 즉시 표시 |
| [재생성] 클릭 | `OverwriteConfirmDialog` 표시 |
| 다이얼로그 [확인] | AI 재호출, 결과 덮어쓰기 |
| 다이얼로그 [취소] | 현재 저장본 유지 |
| [재시도] (에러 시) | AI 재호출 |
| BackButton | 이전 화면 복귀 |

---

## States

### AISummaryViewer
- `generating`: `StreamingTextRenderer` — 타이핑 커서 표시
- `displaying.saved`: react-markdown + `RegenerateButton`
- `displaying.new`: 새로 생성 완료 + react-markdown + `RegenerateButton`
- `noAI`: `EmptyState [noAI]`
- `noPath`: `EmptyState [noPath]`
- `error`: `ErrorState` + [재시도]

### RegenerateButton
- `default`: 활성
- `disabled`: AI 생성 중 비활성

### StreamingTextRenderer
- `streaming`: 블링킹 커서 `|` 표시
- `done`: 커서 숨김

---

## Visual Guidance

- `AISummaryViewer` 배경: `var(--vscode-editor-background)`
- 마크다운 렌더링 시: 헤더(H3) 굵게, 리스트 들여쓰기, 코드 블록 `font.family.mono`
- `StreamingTextRenderer`: 일반 텍스트 색상, 끝에 `|` 커서 (깜빡임 CSS animation)
- `TokenLimitWarning`: 주황 배경 경고 배너 (`color.semantic.warning`)
- `RegenerateButton`: 텍스트 버튼 또는 아이콘+텍스트 버튼 (우상단 배치)
- `OverwriteConfirmDialog`: 중앙 모달, "기존 저장본을 덮어쓰시겠습니까?" 메시지
- 여백: 콘텐츠 좌우 padding `spacing.lg` (16px), 상단 `spacing.md` (12px)

---

## Responsive Rules

- `AISummaryViewer`는 화면 너비에 맞게 마크다운 콘텐츠 폭 자동 조정
- `TokenLimitWarning`은 너비 < 320px에서 접기 가능 (dismiss 버튼)

---

## Naming Rules (Figma)

```
S04_AISummaryViewerScreen [file]
├─ TopHeader
├─ TokenLimitWarning
├─ RegenerateButton [default]
├─ RegenerateButton [disabled]
└─ AISummaryViewer
    ├─ AISummaryViewer [generating]
    │   └─ StreamingTextRenderer [streaming]
    ├─ AISummaryViewer [displaying]
    │   └─ [마크다운 콘텐츠]
    ├─ AISummaryViewer [noAI]
    │   └─ EmptyState [noAI]
    ├─ AISummaryViewer [noPath]
    │   └─ EmptyState [noPath]
    └─ AISummaryViewer [error]
        └─ ErrorState
```

---

## MCP Rules

- `AISummaryViewer`는 독립 Frame (스크롤 영역) — Variant로 6가지 상태
- `TokenLimitWarning`은 독립 Component (조건부)
- `RegenerateButton`은 재사용 Component (default/disabled Variant)
- `OverwriteConfirmDialog`는 독립 Modal Component
- `EmptyState`, `ErrorState`는 전역 Component 참조
- Auto Layout: AISummaryViewer는 Vertical

---

## References

- [F05 spec.md](./spec.md)
- [F05 blueprint.md](./blueprint.md)
- [F05b design_prompt.md](../F05b_ai_summary_commit/design_prompt.md)
- [design_tokens.md](../../core/design_tokens.md)
