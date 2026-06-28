# Screen: S08_IntraFileSymbolDependencyCanvasScreen

## Related Features

- [F10_IntraFileSymbolDependencyCanvas](../../features/F10_intra_file_symbol_dependency_canvas/spec.md)

---

## Purpose

단일 파일 내부의 함수·클래스·변수·타입 등 노드(node) 간 호출·참조·상속 관계를 React Flow 기반 노드-엣지 그래프로 시각화하는 화면.

---

## Entry Condition

[S05_DependencyCanvasScreen](../S04_dependency_canvas/blueprint.md)에서 JS/TS/Python/Go 파일 노드를 호버하거나 클릭했을 때 나타나는 `[심볼 그래프]` 버튼 클릭 시 진입한다. 미지원 파일 유형의 노드에서는 버튼이 비활성(disabled) 상태로 표시된다.

---

## Parent Screen

- [S05_DependencyCanvasScreen](../S04_dependency_canvas/blueprint.md)

---

## Child Screens

없음

---

## Layout Structure

```
S08_IntraFileSymbolDependencyCanvasScreen
├─ TopHeader ({파일 경로})
│   ├─ BackButton → previousScreen (S05)
│   └─ SettingsIcon (⚙) → S06
├─ SymbolGraph  ← 전체 캔버스 영역
│   ├─ SymbolNode × N
│   │   ├─ SymbolKindBadge (fn/cls/ifc/typ/var/cst/enm)
│   │   ├─ 노드 이름 텍스트
│   │   └─ 라인 범위 텍스트
│   └─ SymbolEdge × M (방향 있는 엣지)
├─ SymbolLegendPanel  ← 우측 하단 오버레이 (고정, 노드 라벨 의미 포함)
└─ CanvasControls  ← 우측 상단 오버레이 (F04에서 재사용, 고정)
```

---

## Components

| 컴포넌트 | 출처 |
|---------|------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) |
| `SymbolGraph` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md) |
| `SymbolNode` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md) |
| `SymbolEdge` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md) |
| `SymbolKindBadge` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md) |
| `SymbolLegendPanel` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md) |
| `CanvasControls` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md) (재사용) |
| `EmptyState` | [global_components](../../core/global_components.md#emptystate) |
| `LoadingState` | [global_components](../../core/global_components.md#loadingstate) |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) |

---

## Screen States

| 상태 | 조건 | UI |
|------|------|-----|
| `loading` | `isLoadingSymbolGraph === true` | `LoadingState` (전체 화면) |
| `empty` | 분석 완료 + `symbolNodes.length === 0` | `EmptyState`: "분석 가능한 심볼이 없습니다" |
| `unsupported` | 미지원 파일 유형 | `EmptyState`: "이 파일 유형은 심볼 분석이 지원되지 않습니다" |
| `populated` | 분석 완료 + 심볼 존재 | `SymbolGraph` 표시 |
| `error` | `symbolGraphError !== null` | `ErrorState` |

---

## Interaction Flow

```
[S05에서 파일 노드 호버/클릭 → [심볼 그래프] 클릭]
    → goToSymbolGraphView(file)
        → currentScreen = 'S08', previousScreen = 'S05'
    → S08 마운트 → loadSymbolGraph() 호출
        → Extension Host ANALYZE_SYMBOL_GRAPH
    → (분석 성공) React Flow로 심볼 노드-엣지 렌더링
        → 노드 호버 → 연결 엣지 강조 + 비연결 엣지 감쇠
        → 노드 드래그 → 위치 조정 + 엣지 연결 면 재계산
        → 마우스 휠 → 줌
        → 빈 영역 드래그 → 패닝
        → [맞춤] 버튼 → fitView()
    → (분석 실패) ErrorState + [재시도]
    → BackButton → goBackFromDetail() → S05 복귀
    → ⚙ → S06
```

---

## Responsive Rules

- 패널 크기 변경 시 React Flow `fitView()` 자동 호출
- `SymbolLegendPanel`은 너비 < 350px에서 최소화 상태로 전환
- `CanvasControls`는 항상 표시
