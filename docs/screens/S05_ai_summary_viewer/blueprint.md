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

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) | `src/webview/shared/components/TopHeader.tsx` |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) | `src/webview/shared/components/BackButton.tsx` |
| `EmptyState` | [global_components](../../core/global_components.md#emptystate) | `src/webview/shared/components/EmptyState.tsx` |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) | `src/webview/shared/components/ErrorState.tsx` |
| `AISummaryViewer` | [F05 blueprint](../../features/F05_ai_summary_file/blueprint.md#component-aisummaryviewer) | `src/webview/features/F05/AISummaryViewer.tsx` |
| `StreamingTextRenderer` | [F05 blueprint](../../features/F05_ai_summary_file/blueprint.md#component-streamingtextrenderer) | `src/webview/features/F05/StreamingTextRenderer.tsx` |
| `RegenerateButton` | [F05 blueprint](../../features/F05_ai_summary_file/blueprint.md#component-regeneratebutton) | `src/webview/features/F05/RegenerateButton.tsx` |
| `TokenLimitWarning` | [F05 blueprint](../../features/F05_ai_summary_file/blueprint.md#component-tokenlimitwarning) | `src/webview/features/F05/TokenLimitWarning.tsx` |
| `OverwriteConfirmDialog` | [F05 blueprint](../../features/F05_ai_summary_file/blueprint.md#component-overwriteconfirmdialog) | `src/webview/features/F05/OverwriteConfirmDialog.tsx` |
| `QAInputArea` | [F09 blueprint](../../features/F09_ai_summary_qa/blueprint.md#component-qainputarea) | `src/webview/features/F09/QAInputArea.tsx` |
| `DiffViewerPanel` | [F03 blueprint](../../features/F03_code_viewer/blueprint.md) (인라인 `ResizableSplitPane` 우측 패널) | `src/webview/features/F09/DiffViewerPanel.tsx` |

---

## Screen States

`noAI`/`noPath`/`loading`/`generating`/`displaying.saved`/`displaying.new`/`error`는 [F05_ai_summary_file/blueprint.md](../../features/F05_ai_summary_file/blueprint.md)의 State Model이 유일한 출처다(F05b도 동일하게 공유). 아래는 F09(Q&A)가 조합될 때만 발생하는 화면 전용 상태다.

| 상태 | 조건 | UI |
|------|------|-----|
| `qa.generating` | `isGeneratingQA === true` | 질문 버튼 비활성화 + 답변 스트리밍 박스 |

---

## Interaction Flow

요약 생성/재생성 흐름은 [F05_ai_summary_file/blueprint.md](../../features/F05_ai_summary_file/blueprint.md)의 Interaction Model이, 질문/답변 흐름은 [F09_ai_summary_qa/blueprint.md](../../features/F09_ai_summary_qa/blueprint.md)의 Interaction Model이 유일한 출처다. 아래는 F03(코드 패널)과 조합될 때만 발생하는 화면 전용 흐름이다.

```
[코드 함께 보기] 클릭 → isSplitPanelOpen 토글 → 우측 DiffViewerPanel 슬라이드 인
BackButton → 이전 화면 복귀
⚙ → S06
```

---

## Responsive Rules

- `AISummaryViewer`는 화면 너비에 맞게 마크다운 콘텐츠 폭 자동 조정
- `TokenLimitWarning`은 [접기] 버튼으로 숨길 수 있으며 좁은 너비에서도 텍스트와 버튼이 겹치지 않는다.
