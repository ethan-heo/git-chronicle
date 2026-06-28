# Feature Blueprint: F10_IntraFileSymbolDependencyCanvas

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

단일 파일 내부 노드들을 노드로, 노드 간 호출·참조·상속 관계를 엣지로 시각화하는 React Flow 기반 인터랙티브 그래프를 렌더링한다.

---

## Inputs

- `selectedFileForSymbolGraph: ChangedFile` — 전역 상태. 분석 대상 파일
- `selectedCommit: Commit` — 헤더 표시 및 파일 내용 복원 컨텍스트
- `symbolNodes: SymbolNode[]` — 전역 상태
- `symbolEdges: SymbolEdge[]` — 전역 상태
- `isLoadingSymbolGraph: boolean` — 전역 상태
- `symbolGraphError: string | null` — 전역 상태

---

## Outputs

- 없음 (S08은 탐색 전용 화면. 별도 액션 없음)

---

## Components

- `SymbolGraph`
- `SymbolNode` (React Flow 커스텀 노드)
- `SymbolEdge` (React Flow 커스텀 엣지)
- `SymbolKindBadge`
- `SymbolLegendPanel`
- `CanvasControls` (F04에서 재사용)

---

## Component Definitions

### Component: SymbolGraph

#### Purpose
React Flow를 기반으로 노드와 엣지 데이터를 받아 인터랙티브 그래프를 렌더링한다. 줌·패닝·노드 드래그·Dagre 계층 레이아웃을 처리한다.

#### Data
- `nodes: SymbolNodeType[]`
- `edges: SymbolEdgeType[]`

#### Props
```typescript
interface SymbolGraphProps {
  symbolNodes: SymbolNode[];
  symbolEdges: SymbolEdge[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}
```

#### Interaction
- 줌: 마우스 휠
- 패닝: 빈 영역 드래그
- 노드 드래그: 노드 위치 직접 조정
- 노드 호버: 연결 엣지 강조 + 비연결 엣지 감쇠
- 노드 드래그 후: 현재 위치 기준 엣지 연결 면 재계산
- 캔버스 리사이즈: `fitView()` 재적용

#### States
- `loading`: 분석 중 `LoadingState`
- `empty`: 심볼 없음 `EmptyState`
- `populated`: 노드·엣지 표시
- `error`: 분석 실패 `ErrorState`

#### Accessibility
- `aria-label="파일 내부 노드 의존성 그래프"`

#### Reusability
F10 전용. S08_IntraFileSymbolDependencyCanvasScreen에서만 사용. → 상세 문서: [components/SymbolGraph.md](../../components/SymbolGraph.md)

---

### Component: SymbolNode

#### Purpose
노드 하나를 카드형 노드로 표시한다. 종류 배지(`SymbolKindBadge`), 이름, 라인 범위를 포함한다.

#### Data
- `symbolNode: SymbolNode`

#### Props
```typescript
interface SymbolNodeData extends Record<string, unknown> {
  symbolNode: SymbolNode;
  label: string;       // 노드 이름
  lineRange: string;   // "L12–28" 형태
}
type SymbolNodeType = Node<SymbolNodeData, 'symbolNode'>;
```

#### Interaction
- 호버: `SymbolGraph`의 `onNodeMouseEnter`/`onNodeMouseLeave`로 엣지 강조 처리 (노드 내부 버튼 없음)
- 드래그: 노드 위치 이동

#### States
- `default`: 기본 노드
- `hover`: 테두리 강조 (엣지 강조는 `SymbolGraph`에서 처리)
- `exported`: `isExported === true` 시 우측 상단에 export 인디케이터

#### Accessibility
- `aria-label="{이름} ({kind}) 노드"`
- `role="button"`

#### Reusability
F10 전용. SymbolGraph 내 React Flow 커스텀 노드로만 사용. → 상세 문서: [components/SymbolNode.md](../../components/SymbolNode.md)

---

### Component: SymbolEdge

#### Purpose
두 노드 간의 의존 관계를 방향 있는 엣지로 표시한다.

#### Data
- `source: string` — from 심볼 ID
- `target: string` — to 심볼 ID
- `kind: SymbolDependencyKind`
- `highlighted: boolean`
- `dimmed: boolean`

#### Props
```typescript
interface SymbolEdgeData extends Record<string, unknown> {
  kind: SymbolDependencyKind;
  highlighted: boolean;
  dimmed: boolean;
}
type SymbolEdgeType = Edge<SymbolEdgeData, 'symbolEdge'>;
```

#### Interaction
- 직접 조작 없음 (표시 전용)
- 노드 위치 변경 시 source/target 노드의 가장 가까운 면으로 핸들 갱신

#### States
- `default`: 기본 엣지
- `highlighted`: 연결된 노드 호버 시 강조
- `dimmed`: 노드 호버 중 비연결 엣지 감쇠

#### 엣지 스타일 구분

| kind | 선 스타일 | 색상 |
|------|-----------|------|
| `calls` | 실선 화살표 | accent.primary |
| `uses` | 점선 화살표 | 기본 회색 |
| `extends` | 굵은 실선 | accent.success 계열 |
| `implements` | 굵은 점선 | accent.info 계열 |

#### Reusability
F10 전용. SymbolGraph 내 React Flow 커스텀 엣지로만 사용. → 상세 문서: [components/SymbolEdge.md](../../components/SymbolEdge.md)

---

### Component: SymbolKindBadge

#### Purpose
노드의 종류를 짧은 약어와 색상으로 표시하는 인라인 배지.

#### Props
```typescript
interface SymbolKindBadgeProps {
  kind: SymbolKind;
}
```

#### 배지 명세

| kind | 표시 텍스트 | 색상 변수 |
|------|------------|-----------|
| `function` | `fn` | `--color-symbol-fn` (파란색 계열) |
| `class` | `cls` | `--color-symbol-cls` (초록색 계열) |
| `interface` | `ifc` | `--color-symbol-ifc` (청록색 계열) |
| `type` | `typ` | `--color-symbol-typ` (보라색 계열) |
| `variable` | `var` | `--color-symbol-var` (회색 계열) |
| `constant` | `cst` | `--color-symbol-cst` (주황색 계열) |
| `enum` | `enm` | `--color-symbol-enm` (분홍색 계열) |

#### Reusability
F10 전용. SymbolNode 내부에서만 사용. → 상세 문서: [components/SymbolKindBadge.md](../../components/SymbolKindBadge.md)

---

### Component: SymbolLegendPanel

#### Purpose
노드 종류(노드 색상), 노드 라벨의 의미, 엣지 방향의 의미를 설명하는 범례 패널. F04 `LegendPanel`과 같은 위치·구조로 F10 전용 내용을 표시한다.

#### Props
```typescript
interface SymbolLegendPanelProps {
  isMinimized?: boolean;
}
```

#### Interaction
없음 (정적 콘텐츠)

#### States
- `visible`: 전체 표시
- `minimized`: 좁은 패널에서 아이콘만 표시

#### Accessibility
- `aria-label="노드 그래프 범례"`

#### Reusability
F10 전용. S08_IntraFileSymbolDependencyCanvasScreen 우측 하단 오버레이에서만 사용. → 상세 문서: [components/SymbolLegendPanel.md](../../components/SymbolLegendPanel.md)

#### Legend Contents

- 노드 라벨 의미: 종류 배지, 이름, 라인 범위, export 표시
- 노드 종류: `function`, `class`, `interface`, `type`, `variable`, `constant`, `enum`
- 엣지 종류: `calls`, `uses`, `extends`, `implements`

---

## Component Tree

```
F10_IntraFileSymbolDependencyCanvas
├─ SymbolGraph
│   ├─ SymbolNode × N
│   │   ├─ SymbolKindBadge
│   │   ├─ 심볼명 텍스트
│   │   └─ 라인 범위 텍스트
│   └─ SymbolEdge × M
├─ SymbolLegendPanel
└─ CanvasControls (재사용)
```

---

## Variants

### SymbolNode
- `default`: 기본 카드 노드
- `hover`: 테두리 강조
- `exported`: export 인디케이터 표시

### SymbolEdge
- `default`: 기본 화살표
- `highlighted`: 활성 노드 연결 엣지 강조
- `dimmed`: 비활성 엣지 감쇠

### SymbolLegendPanel
- `visible`: 전체 표시
- `minimized`: 좁은 패널에서 최소화

---

## Layout Rules

```
S08_IntraFileSymbolDependencyCanvasScreen
├─ TopHeader ({파일 경로})
├─ SymbolGraph (전체 영역)
│   ├─ SymbolNode × N (Dagre 우선, 고립 노드는 kind 그룹 배치)
│   └─ SymbolEdge × M
├─ SymbolLegendPanel (우측 하단 고정)
└─ CanvasControls (우측 상단 고정)
```

- `SymbolGraph`는 화면 전체를 채우는 캔버스 영역.
- `SymbolNode` 크기: 최소 180px × 56px, 최대 400px (심볼명 길이 기반 가변).
- 엣지가 있으면 Dagre 계층 레이아웃 (`rankdir: 'LR'`), 없으면 심볼 종류(kind) 그룹 기반 앵커 배치.
- 고립 노드(엣지 없음)는 kind 그룹 규칙으로 Dagre 영역 하단에 배치.
- `SymbolLegendPanel`과 `CanvasControls`는 캔버스 위 오버레이로 고정 배치.

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 노드 호버 | `SymbolNode` 마우스 진입 | 연결 엣지 강조 + 비연결 엣지 감쇠 |
| 노드 호버 해제 | 마우스 이탈 | 강조 해제 + 감쇠 해제 |
| 노드 드래그 | `SymbolNode` 드래그 | 위치 이동 + 엣지 연결 면 재계산 |
| 줌 | 마우스 휠 | React Flow 내장 |
| 패닝 | 빈 영역 드래그 | React Flow 내장 |
| [맞춤] | CanvasControls 버튼 | `fitView()` |
| 뒤로가기 | `BackButton` 클릭 | `previousScreen`(S05)으로 복귀 |

---

## State Model

| 상태 | 조건 | UI |
|------|------|-----|
| `loading` | `isLoadingSymbolGraph === true` | `LoadingState` |
| `empty` | `symbolNodes.length === 0` (분석 완료) | `EmptyState` |
| `unsupported` | 미지원 파일 유형 | `EmptyState` (별도 메시지) |
| `populated` | 분석 완료 + 심볼 존재 | `SymbolGraph` |
| `error` | `symbolGraphError !== null` | `ErrorState` |

---

## Empty States

- `EmptyState` (message: "분석 가능한 심볼이 없습니다")
- `EmptyState` (message: "이 파일 유형은 심볼 분석이 지원되지 않습니다")

---

## Error States

- `ErrorState` (message: "심볼을 분석하지 못했습니다", onRetry: `loadSymbolGraph()`)

---

## Loading States

| 상태 | 컴포넌트 | 위치 |
|------|---------|------|
| 심볼 분석 중 | `LoadingState [lg]` | SymbolGraph 전체 영역 중앙 |

---

## Responsive Rules

- 패널 크기 변경 시 `fitView()` 자동 호출
- `SymbolLegendPanel`은 너비 < 350px에서 최소화 상태로 전환

---

## Reusable Components

- [`CanvasControls`](../F04_dependency_canvas/blueprint.md) (F04에서 재사용)
- [`EmptyState`](../../core/global_components.md#emptystate)
- [`LoadingState`](../../core/global_components.md#loadingstate)
- [`ErrorState`](../../core/global_components.md#errorstate)
- [`TopHeader`](../../core/global_components.md#topheader)
- [`BackButton`](../../core/global_components.md#backbutton)

---

## MCP Optimization Rules

- `SymbolGraph`는 독립 Frame (React Flow 캔버스 전체 영역)
- `SymbolLegendPanel`과 `CanvasControls`는 캔버스 위 오버레이 — position absolute Frame
- `SymbolNode`는 재사용 Component (default/hover/exported Variant)
- `SymbolEdge`는 React Flow 커스텀 SmoothStep 엣지 — Figma에서는 Arrow 컴포넌트로 표현
- `SymbolKindBadge`는 전역 Component 참조 (7가지 kind 별 색상 Variant)
- React Flow 내 노드 드래그 활성화

---

## Figma Naming Rules

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
│   └─ SymbolEdge [implements]
├─ SymbolLegendPanel [visible]
├─ SymbolLegendPanel [minimized]
└─ CanvasControls
```
