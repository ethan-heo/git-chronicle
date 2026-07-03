# Screen: S05_DependencyCanvasScreen

## Related Features

- [F04_DependencyCanvas](../../features/F04_dependency_canvas/spec.md)

---

## Purpose

커밋에서 변경된 파일 간의 import/require 의존 관계를 React Flow 기반 노드-엣지 그래프로 시각화하는 화면. 분석 시에는 현재 디스크 파일을 임시 디렉토리로 복사하고, 누락 파일은 `git show <commitHash>:<filePath>`로 복원한 뒤 동일한 입력 세트로 `dist/depcruiser-runner.mjs`를 통해 `dependency-cruiser` API를 실행한다.

---

## Entry Condition

S02_HistoryViewScreen에서 [캔버스 보기] 버튼 클릭 시 진입한다. 변경 파일 로딩 중에는 버튼이 로딩 상태로 비활성화된다. S05는 안전장치로 `changedFiles`가 아직 로드되지 않았으면 변경 파일 로딩 메시지도 직접 처리한다.

---

## Parent Screen

- [S02_HistoryViewScreen](../S02_history_view/blueprint.md)

---

## Child Screens

- [S03_CodeViewerScreen](../S03_code_viewer/blueprint.md) — 노드 호버 [코드 보기] 클릭 시
- [S04_AISummaryViewerScreen](../S05_ai_summary_viewer/blueprint.md) — 노드 호버 [AI 정리 보기] 클릭 시

---

## Layout Structure

```
S05_DependencyCanvasScreen
├─ TopHeader ({커밋 메시지})
│   ├─ BackButton → S02
│   └─ SettingsIcon (⚙) → S06
├─ DependencyGraph (전체 캔버스 영역)
│   ├─ FileNode × N (확장자 그룹 기반 배치)
│   │   ├─ FileStatusBadge
│   │   ├─ SavedBadge (조건부)
│   │   └─ FileActionButtons (호버 시)
│   └─ DependencyEdge × M
├─ LegendPanel (우측 하단 오버레이 고정)
└─ CanvasControls (우측 상단 오버레이 고정)
```

---

## Components

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) | `src/webview/shared/components/TopHeader.tsx` |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) | `src/webview/shared/components/BackButton.tsx` |
| `DependencyGraph` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md#component-dependencygraph) | `src/webview/features/F04/DependencyGraph.tsx` |
| `FileNode` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md#component-filenode) | `src/webview/features/F04/FileNode.tsx` |
| `DependencyEdge` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md#component-dependencyedge) | `src/webview/features/F04/DependencyEdge.tsx` |
| `LegendPanel` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md#component-legendpanel) | `src/webview/features/F04/LegendPanel.tsx` |
| `CanvasControls` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md#component-canvascontrols) | `src/webview/features/F04/CanvasControls.tsx` |
| `FileActionButtons` | [global_components](../../core/global_components.md#fileactionbuttons) | `src/webview/shared/components/FileActionButtons.tsx` |
| `SavedBadge` | [global_components](../../core/global_components.md#savedbadge) | `src/webview/shared/components/SavedBadge.tsx` |
| `FileStatusBadge` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md#component-filestatusbadge) | `src/webview/shared/components/FileStatusBadge.tsx` |
| `EmptyState` | [global_components](../../core/global_components.md#emptystate) | `src/webview/shared/components/EmptyState.tsx` |
| `LoadingState` | [global_components](../../core/global_components.md#loadingstate) | `src/webview/shared/components/LoadingState.tsx` |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) | `src/webview/shared/components/ErrorState.tsx` |

---

## Screen States

> 화면 상태 조건·UI 매핑과 인터랙션 흐름은 [F04_dependency_canvas/blueprint.md](../../features/F04_dependency_canvas/blueprint.md)의 State Model / Interaction Model이 유일한 출처다. S05는 F04 하나로만 구성된 화면이라 별도 문서를 두지 않는다. 분석 전 파일 복사·git 복원 절차는 F04 spec.md의 Business Rules를 참고한다.

---

## Responsive Rules

- 패널 크기 변경 시 React Flow `fitView()` 자동 호출
- `LegendPanel`은 좁은 너비에서 축소된 폭으로 표시
- `CanvasControls`는 항상 표시
