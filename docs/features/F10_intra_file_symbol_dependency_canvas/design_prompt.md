# Design Prompt: F10_IntraFileSymbolDependencyCanvas

> Claude Design 또는 Figma AI에 직접 입력하여 디자인을 생성하는 프롬프트

---

## Product Context

GitRewind VSCode Extension. S05 의존성 캔버스에서 파일 노드의 `[심볼 그래프]` 버튼을 클릭하면 진입하는 S08_IntraFileSymbolDependencyCanvasScreen. React Flow 기반 노드-엣지 인터랙티브 그래프.

---

## Design Goal

단일 파일 내부의 함수·클래스·변수·타입 등 노드들과 노드 간 호출·참조·상속 관계를 캔버스 그래프로 시각화하는 화면을 디자인한다. 노드는 종류별 색상 배지를 포함하고, 엣지는 관계 종류(calls/uses/extends/implements)에 따라 선 스타일이 다르다. 범례는 노드 라벨의 의미와 노드 종류 7종(function/class/interface/type/variable/constant/enum)을 모두 설명해야 한다. 전체 화면을 캔버스가 채우며, 범례 패널과 줌 컨트롤은 오버레이로 고정 배치된다.

---

## Information Architecture

```
S08_IntraFileSymbolDependencyCanvasScreen
├─ TopHeader ({파일 경로} + BackButton + ⚙)
├─ SymbolGraph (전체 캔버스 영역)
│   ├─ SymbolNode × N (Dagre 계층 또는 kind 그룹 배치)
│   │   ├─ SymbolKindBadge (fn/cls/ifc/typ/var/cst/enm)
│   │   ├─ 노드 이름
│   │   └─ 라인 범위 (L12–28)
│   └─ SymbolEdge × M (방향 화살표, 관계 종류별 선 스타일)
├─ SymbolLegendPanel (우측 하단 오버레이)
└─ CanvasControls (우측 상단 오버레이)
```

---

## Component Tree

- `SymbolGraph`: React Flow 캔버스 전체 영역. 줌·패닝·노드 드래그 내장.
  - `SymbolNode`: 노드 하나를 나타내는 카드형 노드
    - `SymbolKindBadge`: fn/cls/ifc/typ/var/cst/enm 약어 + 색상
    - 노드 이름 텍스트
    - 라인 범위 텍스트 (회색, 소형)
  - `SymbolEdge`: 방향성 화살표 엣지 (관계 종류별 스타일)
- `SymbolLegendPanel`: 노드 종류, 노드 라벨 의미, 엣지 관계 의미 설명 패널
- `CanvasControls`: [+] [-] [맞춤] 버튼 (F04와 동일)

---

## Interactions

| 트리거 | 동작 |
|--------|------|
| `SymbolNode` 호버 | 연결 엣지 강조 + 비연결 엣지 감쇠 |
| `SymbolNode` 드래그 | 노드 위치 이동, 엣지는 가장 가까운 면으로 재연결 |
| 마우스 휠 (캔버스 위) | 줌 인/아웃 (최소 0.3x, 최대 2.0x) |
| 빈 영역 드래그 | 캔버스 패닝 |
| [맞춤] 버튼 클릭 | 전체 노드 뷰포트 맞춤 |
| BackButton 클릭 | S05(파일 간 의존성 캔버스)로 복귀 |

---

## States

### SymbolNode
- `default`: 기본 카드 (SymbolKindBadge + 심볼명 + 라인 범위)
- `hover`: 테두리 강조 색상 변화
- `exported`: 우측 상단에 export 인디케이터 (점 또는 작은 화살표 아이콘)

### SymbolEdge
- `calls` (기본): 실선 화살표, accent.primary
- `uses`: 점선 화살표, 기본 회색
- `extends`: 굵은 실선 화살표, accent.success 계열
- `implements`: 굵은 점선 화살표, accent.info 계열
- `highlighted`: 강조 색상 (더 진하게)
- `dimmed`: 투명도 낮춤

### SymbolGraph
- `loading`: `LoadingState`
- `populated`: 노드·엣지 표시
- `empty`: `EmptyState`
- `error`: `ErrorState`

### SymbolLegendPanel
- `visible`: 전체 표시
- `minimized`: 사용자가 접기 버튼을 눌러 제목과 토글 버튼만 남긴 상태로 전환

---

## Visual Guidance

- 캔버스 배경: `var(--vscode-editor-background)` + 미세한 점 패턴 (F04와 동일)
- `SymbolNode` 카드: 테두리 `var(--vscode-panel-border)`, 배경 `var(--vscode-editorWidget-background)`, 모서리 radius 6px
- `SymbolNode` 크기: 최소 180px × 56px, 최대 400px (심볼명 길이 기반 가변)
- `SymbolKindBadge`: 작은 pill 형태, 종류별 고유 색상 (F04 `FileStatusBadge`와 유사한 크기)
- 라인 범위 텍스트: `font-size: 10px`, `color: var(--vscode-descriptionForeground)`, 우측 하단 정렬
- export 인디케이터: `↑` 또는 `⬆` 아이콘, `color: var(--vscode-symbolIcon-functionForeground)`
- `SymbolEdge` calls: `strokeWidth: 1.5`, `color: var(--vscode-charts-blue)`
- `SymbolEdge` uses: `strokeWidth: 1.5`, `strokeDasharray: 4 2`, `color: var(--vscode-panel-border)` 계열
- `SymbolEdge` extends: `strokeWidth: 2.5`, `color: var(--vscode-charts-green)`
- `SymbolEdge` implements: `strokeWidth: 2.5`, `strokeDasharray: 6 3`, `color: var(--vscode-charts-purple)`
- `SymbolLegendPanel`: 반투명 배경 (`backdrop-filter: blur`), F04 LegendPanel과 동일 위치, 접기/펼치기 토글 제공
- `CanvasControls`: F04와 동일 디자인 재사용

---

## Responsive Rules

- 패널 크기 변경 시 React Flow `fitView()` 자동 호출
- `SymbolLegendPanel`은 사용자가 토글하여 최소화 상태로 전환

---

## Naming Rules (Figma)

```
S08_IntraFileSymbolDependencyCanvasScreen
├─ TopHeader
├─ SymbolGraph
│   ├─ SymbolNode [default]
│   ├─ SymbolNode [hover]
│   ├─ SymbolNode [exported]
│   ├─ SymbolEdge [calls]
│   ├─ SymbolEdge [uses]
│   ├─ SymbolEdge [extends]
│   ├─ SymbolEdge [implements]
│   ├─ SymbolEdge [highlighted]
│   └─ SymbolEdge [dimmed]
├─ SymbolLegendPanel [visible]
├─ SymbolLegendPanel [minimized]
└─ CanvasControls
```

---

## MCP Rules

- `SymbolGraph`는 독립 Frame (전체 캔버스 영역)
- `SymbolNode`는 재사용 Component (3가지 Variant)
- `SymbolEdge`는 4가지 kind × 3가지 state Variant
- `SymbolLegendPanel`과 `CanvasControls`는 오버레이 Frame (absolute position)
- `SymbolKindBadge`는 전역 Component 참조 (7가지 kind Variant)
- Auto Layout: `SymbolNode` 내부는 Vertical Auto Layout

---

## References

- [F10 spec.md](./spec.md)
- [F10 blueprint.md](./blueprint.md)
- [F04 design_prompt.md](../F04_dependency_canvas/design_prompt.md)
- [design_tokens.md](../../core/design_tokens.md)
- [global_components.md](../../core/global_components.md)
