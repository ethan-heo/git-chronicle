# Feature Blueprint: F04_DependencyCanvas

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

변경 파일을 노드로, 파일 간 의존 관계를 엣지로 시각화하는 React Flow 기반 인터랙티브 그래프를 렌더링한다.

---

## Inputs

- `changedFiles: ChangedFile[]` — 전역 상태에서 참조
- `selectedCommit: Commit` — dependency-cruiser 분석 컨텍스트

---

## Outputs

- `selectedFile: ChangedFile` — 노드 클릭 시 전역 상태 업데이트 → S-03/S-04 진입

---

## Components

- `DependencyGraph`
- `FileNode`
- `DependencyEdge`
- `LegendPanel`
- `CanvasControls`

---

## Component Definitions

### Component: DependencyGraph

#### Purpose
React Flow를 기반으로 노드와 엣지 데이터를 받아 인터랙티브 그래프를 렌더링한다. 줌·패닝·자동 레이아웃을 처리한다.

#### Data
- `nodes: FileNode[]`
- `edges: DependencyEdge[]`

#### Props
```typescript
interface DependencyGraphProps {
  files: ChangedFile[];
  dependencyEdges: DependencyEdge[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onFileCodeView: (file: ChangedFile) => void;
  onFileAISummary: (file: ChangedFile) => void;
}
```

#### Interaction
- 줌: 마우스 휠
- 패닝: 빈 영역 드래그
- 노드 호버: `FileNode`의 `FileActionButtons` 표시
- 노드 호버: 연결된 `DependencyEdge` 강조
- 캔버스 리사이즈: `fitView()` 재적용

#### States
- `loading`: 의존 관계 분석 중
- `empty`: 변경 파일 없음
- `populated`: 노드·엣지 표시
- `error`: 분석 실패

#### Accessibility
- `aria-label="의존 관계 그래프"`

#### Reusability
F04_DependencyCanvas 전용. S05_DependencyCanvasScreen에서만 사용. → 상세 문서: [components/DependencyGraph.md](../../components/DependencyGraph.md)

---

### Component: FileNode

#### Purpose
변경 파일 하나를 노드로 표시하고, 호버 시 액션 버튼을 노출한다.

#### Data
- `file: ChangedFile`
- `isHovered: boolean`
- `canAnalyzeDependency: boolean` — JS/TS 외 파일이면 false

#### Props
```typescript
interface FileNodeProps {
  file: ChangedFile;
  canAnalyzeDependency: boolean;
  onCodeView: (file: ChangedFile) => void;
  onAISummary: (file: ChangedFile) => void;
}
```

#### Interaction
- 호버: `FileActionButtons` 표시
- [코드 보기] 클릭: S-03 진입
- [AI 정리 보기] 클릭: S-04 진입

#### States
- `default`: 기본 노드
- `hover`: 버튼 표시
- `noAnalysis`: JS/TS 외 파일 (툴팁 표시)
- `saved`: `SavedBadge` 표시

#### Accessibility
- `aria-label="{파일명} 노드"`
- `role="button"` (호버 시)
- JS/TS 외 파일: `title="의존 관계 분석 불가"`

#### Reusability
F04_DependencyCanvas 전용. DependencyGraph 내 React Flow 커스텀 노드로만 사용. → 상세 문서: [components/FileNode.md](../../components/FileNode.md)

---

### Component: DependencyEdge

#### Purpose
두 파일 노드 간의 import/require 의존 관계를 화살표 엣지로 표시한다.

#### Data
- `source: string` — 소스 파일 경로
- `target: string` — 대상 파일 경로
- `kind: "import" | "require"`
- `highlighted: boolean`

#### Props
```typescript
interface DependencyEdgeProps {
  source: string;
  target: string;
  kind: "import" | "require";
  highlighted: boolean;
}
```

#### Interaction
없음 (표시 전용)

#### States
- `default`: 기본 엣지
- `highlighted`: 연결된 노드 호버 시 강조

#### Reusability
F04_DependencyCanvas 전용. DependencyGraph 내 React Flow 커스텀 엣지로만 사용. → 상세 문서: [components/DependencyEdge.md](../../components/DependencyEdge.md)

---

### Component: LegendPanel

#### Purpose
노드 색상, 엣지 방향의 의미를 설명하는 범례 패널.

#### Data
없음 (정적 콘텐츠)

#### Props
```typescript
interface LegendPanelProps {
  isMinimized?: boolean;
}
```

#### Interaction
없음

#### States
- `visible`: 기본 표시
- `minimized`: 좁은 패널에서 아이콘만 표시

#### Accessibility
- `aria-label="그래프 범례"`

#### Reusability
F04_DependencyCanvas 전용. S05_DependencyCanvasScreen 우측 하단 오버레이에서만 사용.

---

### Component: CanvasControls

#### Purpose
줌 인/아웃, 전체 화면 맞춤(fit) 버튼을 제공하는 캔버스 제어 패널.

#### Data
없음

#### Props
```typescript
interface CanvasControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}
```

#### Interaction
- [+] 클릭: 줌 인
- [-] 클릭: 줌 아웃
- [맞춤] 클릭: 전체 노드가 뷰포트에 맞게 자동 조정

#### States
없음

#### Accessibility
- 각 버튼에 `aria-label` 명시

#### Reusability
F04_DependencyCanvas 전용. S05_DependencyCanvasScreen 우측 상단 오버레이에서만 사용.

---

## Component Tree

```
F04_DependencyCanvas
├─ DependencyGraph
│   ├─ FileNode × N
│   │   ├─ FileStatusBadge
│   │   ├─ SavedBadge (조건부)
│   │   └─ FileActionButtons (호버 시)
│   └─ DependencyEdge × M
├─ LegendPanel
└─ CanvasControls
```

---

## Variants

### FileNode
- `default`: 기본 노드
- `hover`: `FileActionButtons` 표시
- `noAnalysis`: JS/TS 외 파일 (툴팁 표시)
- `saved`: `SavedBadge` 포함

### DependencyEdge
- `default`: 기본 화살표
- `highlighted`: 연결 노드 호버 시 강조

### LegendPanel
- `visible`: 전체 표시
- `minimized`: 좁은 패널에서 최소화

---

## Layout Rules

```
S05_DependencyCanvasScreen
├─ TopHeader ({커밋 메시지})
├─ DependencyGraph (전체 영역)
│   ├─ FileNode × N (force-directed 자동 배치)
│   └─ DependencyEdge × M
├─ LegendPanel (우측 하단 고정)
└─ CanvasControls (우측 상단 고정)
```

- `DependencyGraph`는 화면 전체를 채우는 캔버스 영역.
- `LegendPanel`과 `CanvasControls`는 캔버스 위에 오버레이로 고정 배치.

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 노드 호버 | `FileNode` 마우스 진입 | `FileActionButtons` 표시 + 연결 엣지 강조 |
| 노드 호버 해제 | 마우스 이탈 | `FileActionButtons` 숨김 + 엣지 강조 해제 |
| [코드 보기] | 버튼 클릭 | S-03 진입, `previousScreen = "S05"` |
| [AI 정리 보기] | 버튼 클릭 | S-04 진입, `summaryMode = "file"`, `previousScreen = "S05"` |
| 줌 | 마우스 휠 | 캔버스 줌 (React Flow 내장) |
| 패닝 | 빈 영역 드래그 | 캔버스 이동 (React Flow 내장) |
| [맞춤] | 버튼 클릭 | 전체 노드 뷰포트 맞춤 |
| 뒤로가기 | `BackButton` 클릭 | S-02 복귀 |
| S03/S04 뒤로가기 | `BackButton` 클릭 | `previousScreen`이 S05이면 S05 복귀 |

---

## State Model

| 상태 | 조건 | UI |
|------|------|-----|
| `loading` | 변경 파일 로딩 또는 의존 관계 분석 중 | `LoadingState` |
| `empty` | `changedFiles.length === 0` | `EmptyState` |
| `populated` | 분석 완료 | `DependencyGraph` 표시 |
| `error` | 분석 실패 | `ErrorState` |

---

## Empty States

- `EmptyState` (message: "변경된 파일이 없습니다")

---

## Error States

- `ErrorState` (message: "의존 관계를 분석하지 못했습니다", onRetry: 재분석)
- `ErrorState` (message: "dependency-cruiser가 설치되지 않았습니다. pnpm install 후 다시 시도해주세요.", onRetry: 재시도)

---

## Loading States

| 상태 | 컴포넌트 | 위치 |
|------|---------|------|
| 변경 파일 로딩 중 | `LoadingState [lg]` | DependencyGraph 전체 영역 중앙 |
| 의존 관계 분석 중 | `LoadingState [lg]` | DependencyGraph 전체 영역 중앙 |

---

## Responsive Rules

- 패널 크기 변경 시 `fitView()` 자동 호출로 노드가 잘리지 않도록 조정
- `LegendPanel`은 좁은 너비에서 축소된 폭으로 표시

---

## Reusable Components

- [`FileActionButtons`](../../core/global_components.md#fileactionbuttons)
- [`SavedBadge`](../../core/global_components.md#savedbadge)
- [`EmptyState`](../../core/global_components.md#emptystate)
- [`LoadingState`](../../core/global_components.md#loadingstate)
- [`ErrorState`](../../core/global_components.md#errorstate)
- [`TopHeader`](../../core/global_components.md#topheader)
- [`BackButton`](../../core/global_components.md#backbutton)

---

## MCP Optimization Rules

- `DependencyGraph`는 독립 Frame으로 분리 (React Flow 캔버스 전체 영역)
- `LegendPanel`과 `CanvasControls`는 캔버스 위 오버레이 — position absolute Frame
- `FileNode`는 재사용 Component로 등록 (default/hover/noAnalysis/saved Variant)
- `DependencyEdge`는 React Flow 커스텀 엣지 — Figma에서는 Arrow 컴포넌트로 표현
- `FileActionButtons`, `SavedBadge`, `FileStatusBadge`는 전역 Component 참조
- React Flow 내 노드 드래그는 v1.0에서 비활성화 (force-directed 고정 배치)

---

## Figma Naming Rules

```
S05_DependencyCanvasScreen
├─ TopHeader
├─ DependencyGraph
│   ├─ FileNode [default]
│   ├─ FileNode [hover]
│   ├─ FileNode [noAnalysis]
│   ├─ FileNode [saved]
│   └─ DependencyEdge [default]
│   └─ DependencyEdge [highlighted]
├─ LegendPanel [visible]
├─ LegendPanel [minimized]
└─ CanvasControls
```
