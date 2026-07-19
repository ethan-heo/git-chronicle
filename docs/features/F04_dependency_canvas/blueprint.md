# Feature Blueprint: F04_DependencyCanvas

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

변경 파일을 노드로, 파일 간 의존 관계를 엣지로 시각화하는 React Flow 기반 인터랙티브 그래프를 렌더링한다. S02 워크스페이스의 본문 `fileCanvas` 패널에서 사용한다.

---

## Inputs

- `changedFiles: ChangedFile[]` — 전역 상태에서 참조
- `selectedCommit: Commit` — 언어별 분석 컨텍스트 및 `commitHash` 제공

---

## Outputs

- `selectedFile: ChangedFile` — 노드 클릭 시 전역 상태 업데이트 → S02 본문 `code` 패널 활성화

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
React Flow를 기반으로 노드와 엣지 데이터를 받아 인터랙티브 그래프를 렌더링한다. 줌·패닝·노드 드래그·자동 레이아웃을 처리하며, 의존 관계가 없는 파일은 한곳에 응집된 컴팩트 클러스터로 배치한다.

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
}
```

#### Interaction
- 줌: 마우스 휠
- 패닝: 빈 영역 드래그
- 노드 드래그: 노드 위치 직접 조정
- 노드 호버: 해당 노드가 의존하는 대상의 `DependencyEdge` 강조, 나머지 `DependencyEdge` 감쇠
- 노드 클릭: 선택 상태를 고정하고, 이후 다른 노드 호버 시 호버 노드 기준 강조를 우선 적용
- 노드 드래그 후: 현재 노드 위치 기준으로 `DependencyEdge` 연결 면 재계산
- 캔버스 리사이즈: `fitView()` 재적용

#### States
- `loading`: 의존 관계 분석 중
- `empty`: 변경 파일 없음
- `populated`: 노드·엣지 표시
- `error`: 분석 실패

#### Accessibility
- `aria-label="의존 관계 그래프"`

#### Reusability
F04_DependencyCanvas 전용. S02_WorkspaceScreen의 `fileCanvas` 패널에서만 사용.

---

### Component: FileNode

#### Purpose
변경 파일 하나를 노드로 표시한다. 노드 호버 시 복사 아이콘을 노출하고, 연결 엣지 강조와 함께 빠른 인용 복사를 지원한다.

#### Data
- `file: ChangedFile`
- `isHovered: boolean`
- `canAnalyzeDependency: boolean` — JS/TS, Python, Go 이외 파일이면 false

#### Props
```typescript
interface FileNodeProps {
  file: ChangedFile;
  canAnalyzeDependency: boolean;
  onCodeView: (file: ChangedFile) => void;
}
```

#### Interaction
- 호버: 복사 아이콘 표시 + 연결 엣지 강조
- [복사] 클릭: 해당 파일이 의존하는 대상 노드/엣지만 함께 Mermaid 마크다운으로 복사
- 드래그: 노드 위치 이동

#### States
- `default`: 기본 노드
- `hover`: 복사 아이콘 표시
- `noAnalysis`: JS/TS, Python, Go 이외 파일 (툴팁 표시)

#### Accessibility
- `aria-label="{파일명} 노드"`
- `role="button"` (호버 시)
- 지원 언어 외 파일: `title="의존 관계 분석 불가"`

#### Reusability
F04_DependencyCanvas 전용. DependencyGraph 내 React Flow 커스텀 노드로만 사용.

#### Copy Format
- Mermaid 노드 라벨은 경로 전체가 아니라 파일명만 사용한다.
- 복사 범위는 클릭한 파일 노드에서 바깥으로 나가는 `DependencyEdge`와 그 대상 파일 노드다.

---

### Component: DependencyEdge

#### Purpose
두 파일 노드 간의 import/require 의존 관계를 화살표 엣지로 표시한다.

#### Data
- `source: string` — 소스 파일 경로
- `target: string` — 대상 파일 경로
- `kind: "import" | "require"`
- `highlighted: boolean`
- `dimmed: boolean`

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
- 직접 조작 없음 (표시 전용)
- 노드 위치 변경 시 source/target 노드의 가장 가까운 면으로 연결 핸들이 갱신됨

#### States
- `default`: 기본 엣지
- `highlighted`: 연결된 노드 호버 시 강조
- `dimmed`: 노드 호버 중 비연결 엣지 감쇠

#### Reusability
F04_DependencyCanvas 전용. DependencyGraph 내 React Flow 커스텀 엣지로만 사용.

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
- 토글 버튼 클릭: `visible` ↔ `minimized` 전환

#### States
- `visible`: 전체 표시
- `minimized`: 제목과 토글 버튼만 남긴 기본 접힘 상태

#### Accessibility
- `aria-label="그래프 범례"`

#### Reusability
F04_DependencyCanvas 전용. S02_WorkspaceScreen 본문 `fileCanvas` 패널 우측 하단 오버레이에서만 사용.

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
- 화면 맞춤 아이콘 클릭: 전체 노드가 뷰포트에 맞게 자동 조정

#### States
없음

#### Accessibility
- 각 버튼에 `aria-label` 명시

#### Reusability
F04_DependencyCanvas 전용. S02_WorkspaceScreen 본문 `fileCanvas` 패널 우측 상단 오버레이에서만 사용.

---

## Variants

### FileNode
- `default`: 기본 노드
- `noAnalysis`: JS/TS 외 파일 (툴팁 표시)

### DependencyEdge
- `default`: 기본 화살표
- `highlighted`: 활성 노드가 의존하는 대상 강조

### LegendPanel
- `visible`: 전체 표시
- `minimized`: 기본 접힘 상태로 제목과 토글 버튼만 표시

---

## Layout Rules

- `DependencyGraph`는 화면 전체를 채우는 캔버스 영역.
- `FileNode`는 엣지가 있으면 Dagre 계층 레이아웃으로 배치되며, 엣지가 없거나 고립된 파일은 컴팩트 클러스터로 모아 배치한다.
- 컴팩트 클러스터는 파일 수에 따라 1~3열 정도로 자동 배치되며, 불필요하게 넓게 퍼지지 않도록 한다.
- 긴 파일명은 노드 폭을 확장하거나 줄바꿈하여 끝까지 표시한다.
- `LegendPanel`과 `CanvasControls`는 캔버스 위에 오버레이로 고정 배치.
- `LegendPanel`은 초기 렌더 시 `minimized` 상태로 시작한다.

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 노드 호버 | `FileNode` 마우스 진입 | 연결 엣지 강조 + 비연결 엣지 감쇠 |
| 노드 호버 해제 | 마우스 이탈 | 엣지 강조 해제 + 감쇠 해제 |
| 노드 드래그 | `FileNode` 드래그 | 노드 위치 이동 + 엣지 연결 면 재계산 |
| 줌 | 마우스 휠 | 캔버스 줌 (React Flow 내장) |
| 패닝 | 빈 영역 드래그 | 캔버스 이동 (React Flow 내장) |
| [맞춤] | 버튼 클릭 | 전체 노드 뷰포트 맞춤 |
| 범례 토글 | `LegendPanel` 버튼 클릭 | 접힘(`minimized`) / 펼침(`visible`) 전환 |

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
- `LegendPanel`은 기본적으로 접힌 폭으로 표시되며, 펼친 상태에서도 좁은 너비에 맞춰 축소된 폭을 유지

---

## Reusable Components

- [`FileActionButtons`](../../core/global_components.md#fileactionbuttons)
- [`EmptyState`](../../core/global_components.md#emptystate)
- [`LoadingState`](../../core/global_components.md#loadingstate)
- [`ErrorState`](../../core/global_components.md#errorstate)
