# Feature Blueprint: F10_IntraFileSymbolDependencyCanvas

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

단일 파일 내부 로컬 선언과 import 심볼을 노드로, 이들에 대한 호출·참조·상속 관계를 엣지로 시각화하는 React Flow 기반 인터랙티브 그래프를 렌더링한다.

---

## Inputs

- `selectedFileForSymbolGraph: ChangedFile` — 전역 상태. 분석 대상 파일
- `selectedCommit: Commit` — 헤더 표시 및 파일 내용 복원 컨텍스트
- `symbolNodes: SymbolNode[]` — 전역 상태
- `symbolEdges: SymbolEdge[]` — 전역 상태
- `symbolFileContent: string` — 전역 상태. 코드 패널 렌더링용 파일 본문
- `isLoadingSymbolGraph: boolean` — 전역 상태
- `symbolGraphError: string | null` — 전역 상태
- `isCodePanelOpen: boolean` — 전역 상태. 우측 코드 패널 표시 여부
- `activeSymbolNodeId: string | null` — 전역 상태. 클릭 노드 ID
- `hoveredSymbolNodeId: string | null` — 전역 상태. 호버 노드 ID

---

## Outputs

- 없음 (S02 워크스페이스의 `symbolGraph` 패널은 탐색 전용이다.)

---

## Components

- `SymbolGraph`
- `SymbolNode` (React Flow 커스텀 노드)
- `SymbolEdge` (React Flow 커스텀 엣지)
- `SymbolKindBadge`
- `SymbolLegendPanel`
- `SymbolCodePanel`
- `SymbolFileCodeViewer`
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
  activeNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
  onNodeHover?: (nodeId: string | null) => void;
  onPaneClick?: () => void;
}
```

#### Interaction
- 줌: 마우스 휠
- 패닝: 빈 영역 드래그
- 노드 드래그: 노드 위치 직접 조정
- 노드 호버: 연결 엣지 강조 + 비연결 엣지 감쇠, hover 콜백 전달
- 노드 클릭: 활성 노드 변경 및 코드 패널 스크롤 타겟 설정
- 빈 영역 클릭: hover/활성 노드 선택 해제 및 엣지 강조 원복
- 노드 드래그 후: 현재 위치 기준 엣지 연결 면 재계산
- 캔버스 리사이즈: `fitView()` 재적용

#### States
- `loading`: 분석 중 `LoadingState`
- `empty`: 심볼 없음 `EmptyState`
- `populated`: 노드·엣지 표시
- `error`: 분석 실패 `ErrorState`

#### Accessibility
- `aria-label="파일 내부 노드 의존성 그래프"`
- `LoadingState`, `EmptyState`, 코드 패널, 범례 패널, 코드 뷰어의 접근성 라벨은 `symbol_graph.*` 번역 키를 사용한다

#### Reusability
F10 전용. S02_WorkspaceScreen의 `symbolGraph` 패널에서만 사용.

---

### Component: SymbolNode

#### Purpose
노드 하나를 카드형 노드로 표시한다. 로컬 노드는 종류 배지(`SymbolKindBadge`), 이름, 라인 범위를 기본으로 표시하고, 심볼 종류에 따라 시그니처·멤버 목록·타입 어노테이션·enum 값도 함께 표시한다. import 노드는 `imp` 배지와 모듈 경로, import kind를 함께 표시한다.

#### Data
- `symbolNode: SymbolNode`

#### Props
```typescript
interface SymbolNodeData extends Record<string, unknown> {
  symbolNode: SymbolNode;
  label: string;       // 노드 이름
  lineRange: string;   // "L12–28" 형태
  width: number;       // 내용 길이에 따라 계산된 노드 폭
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
- `import`: `nodeCategory === "import"` 시 점선 테두리, `imp` 배지, 모듈 경로, import kind 표시

#### 표시 규칙
- `function`: 시그니처를 노드 본문에 표시하며, 파라미터와 반환 타입의 옵셔널 표기(`?`)를 유지한다.
- `class` / `interface`: 멤버를 속성(attribute)과 메서드(operation)로 나누어 표시하며, 멤버명과 파라미터의 옵셔널 표기(`?`)를 유지한다.
- `enum`: enum 멤버 값을 줄 단위로 표시한다.
- `type` / `variable` / `constant`: 타입 표현식을 보조 정보로 표시한다.

#### Accessibility
- `aria-label="{이름} ({kind 또는 import kind}) 노드"`
- `role="button"`

#### Reusability
F10 전용. SymbolGraph 내 React Flow 커스텀 노드로만 사용.

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
F10 전용. SymbolGraph 내 React Flow 커스텀 엣지로만 사용.

---

### Component: SymbolKindBadge

#### Purpose
노드의 종류를 짧은 약어와 색상으로 표시하는 인라인 배지.

#### Props
```typescript
interface SymbolKindBadgeProps {
  kind: SymbolKind | 'import';
}
```

#### 배지 명세

| kind | 표시 텍스트 | 색상 변수 |
|------|------------|-----------|
| `function` | `fn` | `--gae-color-symbol-function` (파란색 계열) |
| `class` | `cls` | `--gae-color-symbol-class` (초록색 계열) |
| `interface` | `ifc` | `--gae-color-symbol-interface` (청록색 계열) |
| `type` | `typ` | `--gae-color-symbol-type` (보라색 계열) |
| `variable` | `var` | `--gae-color-symbol-variable` (회색 계열) |
| `constant` | `cst` | `--gae-color-symbol-constant` (주황색 계열) |
| `enum` | `enm` | `--gae-color-symbol-enum` (분홍색 계열) |
| `import` | `imp` | `--gae-color-symbol-imp` (회색 계열) |

> 실제 토큰 정의는 [core/design_tokens.md](../../core/design_tokens.md#symbol-f10-파일-내부-심볼-캔버스-전용)와 `src/webview/global.css`를 기준으로 한다.

#### Reusability
F10 전용. SymbolNode 내부에서만 사용.

---

### Component: SymbolLegendPanel

#### Purpose
노드 종류(노드 색상), 노드 라벨의 의미, 엣지 방향의 의미를 설명하는 범례 패널. F04 `LegendPanel`과 같은 위치·구조로 F10 전용 내용을 표시하며, 접기/펼치기 토글로 캔버스 공간을 확보할 수 있다.

#### Props
```typescript
interface SymbolLegendPanelProps {
  isMinimized?: boolean;
}
```

#### Interaction
없음 (정적 콘텐츠)

#### Accessibility
- 패널 제목, 토글 버튼, 라벨 설명, 엣지 설명은 모두 `symbol_graph.*` 번역 키를 사용해 한국어/영어를 함께 지원한다

#### States
- `visible`: 전체 표시
- `minimized`: 좁은 패널에서 아이콘만 표시
- 초기 상태는 `minimized`

#### Accessibility
- `aria-label="노드 그래프 범례"`
- 접기/펼치기 버튼을 통해 `isMinimized` 상태를 전환한다

#### Reusability
F10 전용. S02_WorkspaceScreen의 `symbolGraph` 패널 우측 하단 오버레이에서만 사용.

#### Legend Contents

- 노드 라벨 의미: 종류 배지, 이름, 라인 범위, export 표시
- 노드 종류: `function`, `class`, `interface`, `type`, `variable`, `constant`, `enum`, `import`
- 엣지 종류: `calls`, `uses`, `extends`, `implements`

---

### Component: SymbolCodePanel

#### Purpose
S02 `symbolGraph` 패널 우측에서 슬라이드 인하는 코드 패널. 파일명과 닫기 버튼을 보여주고, 내부에 `SymbolFileCodeViewer`를 포함한다.

#### Props
```typescript
interface SymbolCodePanelProps {
  isOpen: boolean;
  filePath: string;
  fileContent: string;
  language: string;
  highlightRange: { start: number; end: number } | null;
  scrollToRange: { start: number; end: number } | null;
  onClose: () => void;
}
```

#### Interaction
- `isOpen === true` 일 때 우측에서 슬라이드 인
- 닫기 버튼 클릭 시 `onClose()` 호출
- 활성 노드 클릭 시 `scrollToRange`와 `scrollRequestId`로 해당 라인 범위 이동
- 호버 노드 변경 시 `highlightRange`로 배경 강조
- 호버는 스크롤을 유발하지 않음

#### Reusability
F10 전용. S02_WorkspaceScreen 내에서만 사용.

---

### Component: SymbolFileCodeViewer

#### Purpose
Shiki 기반 구문 강조 코드 뷰어. 라인 번호와 노드 라인 범위 강조를 렌더링한다.

#### Props
```typescript
interface SymbolFileCodeViewerProps {
  fileContent: string;
  language: string;
  highlightRange: { start: number; end: number } | null;
  scrollToRange: { start: number; end: number } | null;
}
```

#### Interaction
- `highlightRange`에 포함된 라인 배경 강조
- 클릭으로 활성화된 노드의 라인 범위를 우선 강조
- `scrollToRange`와 `scrollRequestId` 변경 시 해당 라인으로 smooth scroll

#### Reusability
F10 전용. `SymbolCodePanel` 내부에서만 사용.

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
- `minimized`: 사용자가 접기 버튼을 눌러 제목과 토글 버튼만 남긴 상태로 전환

### SymbolCodePanel
- `open`: 우측 슬라이드 인
- `closed`: 우측 슬라이드 아웃

---

## Layout Rules

- `SymbolGraph`는 화면 전체를 채우는 캔버스 영역.
- `SymbolNode` 크기: 최소 180px × 56px, 최대 400px (심볼명 길이 기반 가변).
- 엣지가 있으면 Dagre 계층 레이아웃 (`rankdir: 'LR'`), 없으면 심볼 종류(kind) 그룹 기반 앵커 배치.
- 고립 노드(엣지 없음)는 kind 그룹 규칙으로 Dagre 영역 하단에 배치.
- `SymbolLegendPanel`과 `CanvasControls`는 캔버스 위 오버레이로 고정 배치.
- `SymbolLegendPanel`은 기본적으로 접혀 있으며, 사용자가 펼치기로 화면 공간을 사용할 수 있다.

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 노드 호버 | `SymbolNode` 마우스 진입 | 연결 엣지 강조 + 비연결 엣지 감쇠 |
| 노드 호버 해제 | 마우스 이탈 | 강조 해제 + 감쇠 해제 |
| 노드 드래그 | `SymbolNode` 드래그 | 위치 이동 + 엣지 연결 면 재계산 |
| 빈 영역 클릭 | `ReactFlow` pane 클릭 | hover/활성 선택 해제 + 엣지 원복 |
| 줌 | 마우스 휠 | React Flow 내장 |
| 패닝 | 빈 영역 드래그 | React Flow 내장 |
| [맞춤] | CanvasControls 버튼 | `fitView()` |
| 워크스페이스 이탈 | 좌측 `BackButton` 클릭 | S01로 복귀 |

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

- 초기 진입 시 노드/엣지 초기화 완료 후 `fitView()` 1회 호출
- `SymbolLegendPanel`은 필요 시 사용자가 직접 최소화 상태로 전환

---

## Reusable Components

- [`CanvasControls`](../F04_dependency_canvas/blueprint.md) (F04에서 재사용)
- [`EmptyState`](../../core/global_components.md#emptystate)
- [`LoadingState`](../../core/global_components.md#loadingstate)
- [`ErrorState`](../../core/global_components.md#errorstate)
- [`TopHeader`](../../core/global_components.md#topheader)
- [`BackButton`](../../core/global_components.md#backbutton)
