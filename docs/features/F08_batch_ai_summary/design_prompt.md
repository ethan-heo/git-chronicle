# Design Prompt: F08_BatchAISummary

> Claude Design 또는 Figma AI에 직접 입력하여 디자인을 생성하는 프롬프트

---

## Product Context

GitRewind VSCode Extension. 모든 변경 파일에 대해 AI 정리를 일괄 자동 실행하는 기능. 화면 최상단에 고정되는 `BatchProgressBar`가 유일한 UI 컴포넌트이며, 어떤 화면에 있어도 항상 표시된다.

---

## Design Goal

일괄 생성이 실행 중일 때 화면 최상단에 고정되는 얇은 프로그레스 바 + 진행 카운트 + 취소 버튼을 디자인한다. 화면 전환 시에도 사라지지 않는 전역 오버레이 컴포넌트로, 미니멀하고 방해가 적은 스타일을 지향한다.

---

## Information Architecture

```
[전역 레이아웃]
BatchProgressBar [running] ← 화면 최상단 sticky/fixed
├─ ProgressBar (시각적 진행 바)
├─ "{batchCompleted} / {batchTotal}" 텍스트
└─ BatchCancelButton

[S02 내 시작 진입점]
CommitActionBar
└─ PrimaryButton [전체 파일 AI 정리] ← F08 시작 트리거
```

---

## Component Tree

- `BatchProgressBar`: 화면 최상단 고정 전역 컴포넌트
  - `ProgressBar`: 진행률 시각화 바 (`batchCompleted / batchTotal`)
  - Progress 텍스트: `{n} / {전체}` 숫자 표시
  - `BatchCancelButton`: [취소] 버튼

---

## Interactions

| 트리거 | 동작 |
|--------|------|
| [전체 파일 AI 정리] 클릭 (S02) | `isBatchRunning = true` → `BatchProgressBar [running]` 표시 |
| 파일 완료마다 | `batchCompleted++`, ProgressBar 업데이트 |
| `BatchCancelButton` 클릭 | 현재 파일 완료 후 중단, Toast 표시 |
| 전체 완료 | `isBatchRunning = false` → `BatchProgressBar` 숨김, Toast 표시 |

---

## States

### BatchProgressBar
- `running`: 진행 중 — ProgressBar 애니메이션, `BatchCancelButton` 표시
- `hidden`: `isBatchRunning === false` — 렌더링 스킵 (DOM에 없음)

---

## Visual Guidance

- `BatchProgressBar` 높이: 36–44px, 전체 패널 너비, 최상단 고정
- 배경: `var(--vscode-editor-background)` 또는 `var(--vscode-statusBar-background)` (상태 바와 유사한 느낌)
- 하단 테두리: `1px solid var(--vscode-panel-border)` (콘텐츠 영역과 구분)
- `ProgressBar` 진행 부분: `color.accent.primary` (`var(--vscode-focusBorder)`)
- `ProgressBar` 배경: `var(--vscode-editorWidget-background)` 또는 `color.surface.tertiary`
- `ProgressBar` 높이: 3–4px, 전체 너비 하단 또는 컴포넌트 내 배치
- 텍스트: `font.size.sm` (11–12px), `color.text.secondary`, 우측 또는 중앙 배치
- `BatchCancelButton`: 소형 "취소" 텍스트 버튼 또는 ×(닫기) 아이콘, 우측 배치
- 전체 레이아웃: Horizontal — [ProgressBar(flex-grow)] [텍스트] [취소 버튼]
- 패딩: 좌우 `spacing.sm` (8px), 상하 `spacing.xs` (4px)

---

## Responsive Rules

- 항상 전체 너비 사용
- 좁은 너비에서 텍스트와 취소 버튼은 한 줄 유지 (줄 바꿈 없음)
- `ProgressBar`는 나머지 너비를 모두 채움

---

## Naming Rules (Figma)

```
BatchProgressBar [running]
├─ ProgressBar
│   └─ ProgressBar-fill (진행 부분)
├─ ProgressText ("{n} / {total}")
└─ BatchCancelButton

BatchProgressBar [hidden]
```

---

## MCP Rules

- `BatchProgressBar`는 전역 Frame — 모든 Screen Frame 최상단에 배치
- Variant Component: `running` / `hidden` 2가지 상태
- `BatchCancelButton`은 `BatchProgressBar` 내부 Component (단독 재사용 불가)
- Auto Layout: `BatchProgressBar`는 Horizontal
- position: `sticky`/`fixed` (스크롤 시에도 항상 상단 고정)
- 화면 레이아웃 상 `TopHeader` 위에 배치

---

## References

- [F08 spec.md](./spec.md)
- [F08 blueprint.md](./blueprint.md)
- [global_components.md](../../core/global_components.md#toast)
- [design_tokens.md](../../core/design_tokens.md)
