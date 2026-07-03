# Screen: S03_CodeViewerScreen

## Related Features

- [F03_CodeViewer](../../features/F03_code_viewer/spec.md)

---

## Purpose

선택된 파일의 Git diff를 unified diff 형식 + Shiki 신텍스 하이라이팅으로 표시하는 읽기 전용 뷰어 화면. 현재 구현은 파일 전체를 로드해 첫 변경 지점으로 자동 스크롤한다.

---

## Entry Condition

다음 화면에서 [코드 보기] 버튼 클릭 시 진입. `selectedFile` 전역 상태 설정 후 진입.
진입 시 AI 요약 관련 상태는 현재 파일 기준으로 초기화되며, 우측 패널은 새 요약을 생성하는 전제로 동작한다.

- [S02_HistoryViewScreen](../S02_history_view/blueprint.md) — 파일 트리 노드 호버 → [코드 보기]
- [S05_DependencyCanvasScreen](../S04_dependency_canvas/blueprint.md) — 캔버스 노드 호버 → [코드 보기]

---

## Parent Screen

- [S02_HistoryViewScreen](../S02_history_view/blueprint.md) (주 진입 경로)
- [S05_DependencyCanvasScreen](../S04_dependency_canvas/blueprint.md) (보조 진입 경로)

---

## Child Screens

- 우측 인라인 AI 요약 패널: `AISummaryPanel`

---

## Layout Structure

```
S03_CodeViewerScreen
├─ TopHeader ({커밋 메시지} > {파일 경로})
│   ├─ BackButton → 이전 화면 복귀
│   └─ SettingsIcon (⚙) → S06
└─ code-split-workspace
   ├─ code-split-main-panel
   │  └─ DiffViewer (스크롤 영역)
   │      ├─ DeletedFileNotice (조건부, 삭제된 파일)
   │      └─ DiffLine × N
   │         OR BinaryFileNotice
   │      └─ 로드 후 첫 변경 라인으로 자동 스크롤
   └─ AISummaryPanel (조건부 인라인 패널)
```

---

## Components

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) | `src/webview/shared/components/TopHeader.tsx` |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) | `src/webview/shared/components/BackButton.tsx` |
| `DiffViewer` | [F03 blueprint](../../features/F03_code_viewer/blueprint.md#component-diffviewer) | `src/webview/features/F03/DiffViewer.tsx` |
| `DiffLine` | [F03 blueprint](../../features/F03_code_viewer/blueprint.md#component-diffline) | `src/webview/features/F03/DiffLine.tsx` |
| `BinaryFileNotice` | [F03 blueprint](../../features/F03_code_viewer/blueprint.md#component-binaryfilenotice) | `src/webview/features/F03/DiffViewer.tsx` (내부 조건부 렌더링) |
| `DeletedFileNotice` | [F03 blueprint](../../features/F03_code_viewer/blueprint.md#component-deletedfilenotice) | `src/webview/features/F03/DiffViewer.tsx` (내부 조건부 렌더링) |
| `AISummaryPanel` | [F05 blueprint](../../features/F05_ai_summary_file/blueprint.md) (인라인 `ResizableSplitPane` 우측 패널) | `src/webview/features/F09/AISummaryPanel.tsx` |
| `LoadingState` | [global_components](../../core/global_components.md#loadingstate) | `src/webview/shared/components/LoadingState.tsx` |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) | `src/webview/shared/components/ErrorState.tsx` |

---

## Screen States

> 화면 상태 조건·UI 매핑과 인터랙션 흐름은 [F03_code_viewer/blueprint.md](../../features/F03_code_viewer/blueprint.md)의 State Model / Interaction Model이 유일한 출처다. S03은 F03 하나로만 구성된 화면이라 별도 문서를 두지 않는다. 개발 환경에서 diff 요청보다 메시지 리스너 활성화가 항상 먼저여야 한다는 순서 규칙도 F03 blueprint의 State Model에 있다.

---

## Responsive Rules

- `DiffViewer`는 가로 스크롤 지원 (긴 라인 잘림 방지)
- 라인 번호 컬럼은 좁은 너비에서 숨기기 가능
