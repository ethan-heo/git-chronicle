# Feature Blueprint: F02_ChangedFileTree

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

선택된 커밋의 변경 파일을 디렉토리 트리로 렌더링하고, 파일 호버 시 복사/코드 보기/파일 AI 요약 보기/심볼 그래프 액션 버튼을 하나의 그룹으로 노출한다. 현재 F02는 S02 사이드바의 `FileTreeSection` 안에서 렌더링된다.

---

## Inputs

- `selectedCommit: Commit` — 전역 상태에서 참조
- `savePath: string | null` — 저장본 존재 여부 판단용
- `changedFiles: ChangedFile[]` — simple-git으로 로드

---

## Outputs

- `selectedFile: ChangedFile` — 파일 [코드 보기] 클릭 시 전역 상태 업데이트 → S02 본문 `code` 패널 활성화

---

## Components

- `FileTree`
- `DirectoryNode`
- `FileTreeNode`
- `FileStatusBadge`
- `FileActionButtons`

---

## Component Definitions

### Component: FileTree

#### Purpose
변경 파일 목록을 디렉토리 경로 기준 계층 트리로 렌더링한다.

#### Data
- `changedFiles: ChangedFile[]`

#### Props
```typescript
interface FileTreeProps {
  changedFiles: ChangedFile[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onFileCodeView: (file: ChangedFile) => void;
  onFileAIView: (file: ChangedFile) => void;
  onFileSymbolGraph: (file: ChangedFile) => void;
}
```

#### Interaction
- 디렉토리 노드 클릭 → 펼침/접힘 토글
- 파일 노드 호버 → `FileActionButtons` 표시

#### States
- `loading`, `empty`, `populated`, `error`

#### Accessibility
- `role="tree"`, `aria-label="변경 파일 트리"`

#### Reusability
F02_ChangedFileTree 전용. S02_WorkspaceScreen 사이드바 `FileTreeSection` 본문에서만 사용한다.

---

### Component: DirectoryNode

#### Purpose
디렉토리 경로를 펼칠 수 있는 노드로 표시한다.

#### Data
- `name: string` — 디렉토리명
- `isExpanded: boolean`
- `children: (DirectoryNode | FileTreeNode)[]`

#### Props
```typescript
interface DirectoryNodeProps {
  node: DirectoryTreeNode;
  depth: number;
  onCodeView: (file: ChangedFile) => void;
  onAIView: (file: ChangedFile) => void;
  onSymbolGraph: (file: ChangedFile) => void;
}
```

#### Interaction
- 클릭 시 `isExpanded` 토글

#### States
- `expanded`, `collapsed`

#### Accessibility
- `role="treeitem"`, `aria-expanded`

#### Reusability
F02_ChangedFileTree 전용. FileTree 내에서 재귀적으로 사용.

---

### Component: FileTreeNode

#### Purpose
개별 변경 파일을 트리 노드로 표시하고, 호버 시 액션 버튼을 노출한다.

#### Data
- `file: ChangedFile`
- `isHovered: boolean`

#### Props
```typescript
interface FileTreeNodeProps {
  file: ChangedFile;
  name: string;
  depth: number;
  onCodeView: (file: ChangedFile) => void;
  onAIView: (file: ChangedFile) => void;
  onSymbolGraph: (file: ChangedFile) => void;
}
```

#### Interaction
- 호버 시 `FileActionButtons` 표시, `FileStatusBadge` 유지
- [마크다운으로 복사] 클릭 → 해당 파일의 핵심 식별 텍스트만(기본은 현재 경로, rename은 `oldPath -> path`) 클립보드에 복사
- [코드 보기] 클릭 → `selectedFile` 업데이트 → S02 본문 `code` 패널 활성화
- [AI 요약 보기] 클릭 → 해당 파일을 컨텍스트로 S02 본문 `aiSummary` 패널 활성화
- [심볼 그래프] 클릭 → `selectedFileForSymbolGraph` 업데이트 → S02 본문 `symbolGraph` 패널 활성화

#### States
- `default`, `hover`

#### Accessibility
- `role="treeitem"`, `aria-label="{파일경로} — {상태}"`, `tabIndex={0}`

#### Reusability
F02_ChangedFileTree 전용. FileTree 내에서만 사용.

---

### Component: FileStatusBadge

#### Purpose
파일 변경 상태(A/M/D/R)를 색상 + 레터로 표시하는 뱃지.

#### Data
- `status: "A" | "M" | "D" | "R"`

#### Props
```typescript
interface FileStatusBadgeProps {
  status: "A" | "M" | "D" | "R";
}
```

#### States
- `added`: `color.status.added` 색상 + `A` 레터
- `modified`: `color.status.modified` 색상 + `M` 레터
- `deleted`: `color.status.deleted` 색상 + `D` 레터
- `renamed`: `color.status.renamed` 색상 + `R` 레터

#### Accessibility
- `aria-label="추가됨"` / `"수정됨"` / `"삭제됨"` / `"이름변경됨"`

#### Reusability
**재사용 가능.** FileTreeNode(F02)와 FileNode(F04 캔버스) 모두에서 사용. → [core/global_components.md](../../core/global_components.md#filestatusbadge)

---

## Variants

### FileTreeNode
- `default`: 기본 파일 행
- `hover`: `FileActionButtons` 노출

### DirectoryNode
- `expanded`: 하위 항목 표시
- `collapsed`: 하위 항목 숨김

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 파일 호버 | `FileTreeNode` 마우스 진입 | 복사/코드/AI/심볼 액션 그룹 표시 |
| 파일 호버 해제 | 마우스 이탈 | `FileActionButtons` 숨김 |
| [마크다운으로 복사] | 버튼 클릭 | 파일의 핵심 식별 텍스트만 클립보드에 복사 |
| [코드 보기] | 버튼 클릭 | `selectedFile` 설정 후 S02 본문 `code` 패널 활성화 |
| [AI 요약 보기] | 버튼 클릭 | 해당 파일을 선택 컨텍스트로 S02 본문 `aiSummary` 패널 활성화 |
| [심볼 그래프] | 버튼 클릭 | `selectedFileForSymbolGraph` 설정 후 S02 본문 `symbolGraph` 패널 활성화 |
| 디렉토리 클릭 | `DirectoryNode` 클릭 | 펼침/접힘 토글 |

---

## State Model

| 상태 | 조건 | UI |
|------|------|-----|
| `loading` | `changedFiles` 로드 중 | `LoadingState` |
| `empty` | `changedFiles.length === 0` | `EmptyState`: "변경된 파일이 없습니다" |
| `populated` | `changedFiles.length > 0` | `FileTree` 표시 |
| `error` | 로드 실패 | `ErrorState` |

---

## Empty States

- `EmptyState` (message: "변경된 파일이 없습니다")

---

## Error States

- `ErrorState` (message: "변경 파일 목록을 불러오지 못했습니다", onRetry: 재로드)

---

## Loading States

| 상태 | 컴포넌트 | 위치 |
|------|---------|------|
| 변경 파일 로드 중 | `LoadingState [lg]` | FileTree 전체 영역 중앙 |

---

## Responsive Rules

- S02 사이드바 최상단에는 `WorkspaceHeading`이 고정되고, 그 아래 `FileTreeSection`이 남은 세로 공간을 차지한다.
- 커밋 단위 `aiSummary` / `fileCanvas` 진입은 파일 트리 헤더가 아니라 F01 커밋 목록 항목의 호버 액션에서 담당한다.
- 좁은 사이드바 폭에서는 섹션 헤더와 파일 행 모두 말줄임을 사용한다.

---

## Reusable Components

- [`FileActionButtons`](../../core/global_components.md#fileactionbuttons)
- [`EmptyState`](../../core/global_components.md#emptystate)
- [`LoadingState`](../../core/global_components.md#loadingstate)
- [`ErrorState`](../../core/global_components.md#errorstate)
