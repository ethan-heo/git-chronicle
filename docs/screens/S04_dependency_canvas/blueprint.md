# Screen: S05_DependencyCanvasScreen

## Related Features

- [F04_DependencyCanvas](../../features/F04_dependency_canvas/spec.md)

---

## Purpose

커밋에서 변경된 파일 간의 import/require 의존 관계를 React Flow 기반 노드-엣지 그래프로 시각화하는 화면.

---

## Entry Condition

S02_HistoryViewScreen에서 [캔버스 보기] 버튼 클릭 시 진입한다. 변경 파일 로딩 중에는 버튼이 로딩 상태로 비활성화된다. S05는 안전장치로 `changedFiles`가 아직 로드되지 않았으면 변경 파일 로딩 메시지도 직접 처리한다.

---

## Parent Screen

- [S02_HistoryViewScreen](../S02_history_view/blueprint.md)

---

## Child Screens

- [S03_CodeViewerScreen](../S03_code_viewer/blueprint.md) — 노드 호버 [코드 보기] 클릭 시
- [S04_AISummaryViewerScreen](../S04_ai_summary_viewer/blueprint.md) — 노드 호버 [AI 정리 보기] 클릭 시

---

## Layout Structure

```
S05_DependencyCanvasScreen
├─ TopHeader ({커밋 메시지})
│   ├─ BackButton → S02
│   └─ SettingsIcon (⚙) → S06
├─ DependencyGraph (전체 캔버스 영역)
│   ├─ FileNode × N (force-directed 자동 배치)
│   │   ├─ FileStatusBadge
│   │   ├─ SavedBadge (조건부)
│   │   └─ FileActionButtons (호버 시)
│   └─ DependencyEdge × M
├─ LegendPanel (우측 하단 오버레이 고정)
└─ CanvasControls (우측 상단 오버레이 고정)
```

---

## Components

| 컴포넌트 | 출처 |
|---------|------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) |
| `DependencyGraph` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md) |
| `FileNode` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md) |
| `DependencyEdge` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md) |
| `LegendPanel` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md) |
| `CanvasControls` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md) |
| `FileActionButtons` | [global_components](../../core/global_components.md#fileactionbuttons) |
| `SavedBadge` | [global_components](../../core/global_components.md#savedbadge) |
| `FileStatusBadge` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md) |
| `EmptyState` | [global_components](../../core/global_components.md#emptystate) |
| `LoadingState` | [global_components](../../core/global_components.md#loadingstate) |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) |

---

## Screen States

| 상태 | 조건 | UI |
|------|------|-----|
| `loading` | 변경 파일 로딩 또는 의존 관계 분석 중 | `LoadingState` (전체 화면) |
| `empty` | `changedFiles.length === 0` | `EmptyState`: "변경된 파일이 없습니다" |
| `populated` | 분석 완료 | `DependencyGraph` 표시 |
| `error` | 분석 실패 | `ErrorState` |

---

## Interaction Flow

```
[S02에서 [캔버스 보기] 클릭]
    → changedFiles가 없고 아직 로드 완료 전이면 변경 파일 로딩
    → dependency-cruiser로 changedFiles 의존 관계 분석
    → (분석 성공) React Flow로 노드-엣지 렌더링
        → 노드 호버 → FileActionButtons 표시
            → [코드 보기] → S03
            → [AI 정리 보기] → S04
        → S03/S04 뒤로가기 → previousScreen이 S05이면 S05 복귀
        → 마우스 휠 → 줌
        → 빈 영역 드래그 → 패닝
        → [맞춤] 버튼 → fitView()
    → (분석 실패) ErrorState + [재시도]
    → BackButton → S02
    → ⚙ → S06
```

---

## Responsive Rules

- 패널 크기 변경 시 React Flow `fitView()` 자동 호출
- `LegendPanel`은 좁은 너비에서 축소된 폭으로 표시
- `CanvasControls`는 항상 표시
