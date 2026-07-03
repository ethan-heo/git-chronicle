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
│   ├─ [코드 보기] 토글 버튼 → 우측 코드 패널 열기/닫기
│   └─ SettingsIcon (⚙) → S06
├─ SymbolGraph  ← 좌측 캔버스 영역
│   ├─ SymbolNode × N
│   │   ├─ SymbolKindBadge (fn/cls/ifc/typ/var/cst/enm)
│   │   ├─ 노드 이름 텍스트
│   │   ├─ 시그니처/멤버/타입/enum 값 보조 정보
│   │   └─ 라인 범위 텍스트
│   └─ SymbolEdge × M (방향 있는 엣지)
├─ SymbolCodePanel  ← 우측 슬라이드 인 코드 패널
├─ SymbolLegendPanel  ← 캔버스 우측 하단 오버레이 (고정, 노드 라벨 의미 포함)
└─ CanvasControls  ← 캔버스 우측 상단 오버레이 (F04에서 재사용, 고정)
```

---

## Components

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) | `src/webview/shared/components/TopHeader.tsx` |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) | `src/webview/shared/components/BackButton.tsx` |
| `SymbolGraph` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md#component-symbolgraph) | `src/webview/features/F10/SymbolGraph.tsx` |
| `SymbolNode` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md#component-symbolnode) | `src/webview/features/F10/SymbolNode.tsx` |
| `SymbolEdge` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md#component-symboledge) | `src/webview/features/F10/SymbolEdge.tsx` |
| `SymbolKindBadge` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md#component-symbolkindbadge) | `src/webview/features/F10/SymbolKindBadge.tsx` |
| `SymbolLegendPanel` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md#component-symbollegendpanel) | `src/webview/features/F10/SymbolLegendPanel.tsx` |
| `SymbolCodePanel` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md#component-symbolcodepanel) | `src/webview/features/F10/SymbolCodePanel.tsx` |
| `SymbolFileCodeViewer` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md#component-symbolfilecodeviewer) | `src/webview/features/F10/SymbolFileCodeViewer.tsx` |
| `CanvasControls` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md#component-canvascontrols) (재사용) | `src/webview/features/F04/CanvasControls.tsx` |
| `EmptyState` | [global_components](../../core/global_components.md#emptystate) | `src/webview/shared/components/EmptyState.tsx` |
| `LoadingState` | [global_components](../../core/global_components.md#loadingstate) | `src/webview/shared/components/LoadingState.tsx` |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) | `src/webview/shared/components/ErrorState.tsx` |

---

## Screen States

> 화면 상태 조건·UI 매핑과 인터랙션 흐름은 [F10_intra_file_symbol_dependency_canvas/blueprint.md](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md)의 State Model / Interaction Model이 유일한 출처다. S08은 F10 하나로만 구성된 화면이라 별도 문서를 두지 않는다.

---

## Responsive Rules

- 패널 크기 변경 시 React Flow `fitView()` 자동 호출
- 우측 코드 패널이 열리면 캔버스 영역이 축소되고, 닫히면 원래 크기로 복원
- `SymbolLegendPanel`은 너비 < 350px에서 최소화 상태로 전환
- `CanvasControls`는 항상 표시
- 코드 패널은 라인 번호와 본문 사이에 충분한 간격을 유지해 번호가 본문에 붙어 보이지 않도록 한다
