# Feature Blueprint: F02_ChangedFileTree

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

선택된 커밋의 변경 파일을 디렉토리 트리로 렌더링하고, 파일 호버 시 액션 버튼을 노출한다.

---

## Inputs

- `selectedCommit: Commit` — 전역 상태에서 참조
- `savePath: string | null` — 저장본 존재 여부 판단용
- `changedFiles: ChangedFile[]` — simple-git으로 로드

---

## Outputs

- `selectedFile: ChangedFile` — 파일 클릭 시 전역 상태 업데이트 → S-03/S-04 진입
- `isBatchRunning` 트리거 → F08 진입

---

## Components

- `CommitActionBar`
- `FileTree`
- `DirectoryNode`
- `FileTreeNode`
- `FileStatusBadge`
- `SavedBadge`
- `FileActionButtons`

---

## Component Definitions

### Component: CommitActionBar

#### Purpose
커밋 단위 액션 버튼([커밋 AI 정리], [전체 파일 AI 정리], [캔버스 보기])을 상단에 표시한다.

#### Data
- `selectedCommit: Commit`
- `isBatchRunning: boolean`

#### Props
```typescript
interface CommitActionBarProps {
  selectedCommit: Commit;
  isBatchRunning: boolean;
  onCommitAISummary: () => void;
  onBatchAISummary: () => void;
  onCanvasView: () => void;
}
```

#### Interaction
- [커밋 AI 정리] 클릭 → `summaryMode = "commit"` 설정 → S-04 진입
- [전체 파일 AI 정리] 클릭 → F08 시작 (`isBatchRunning = true`)
- [캔버스 보기] 클릭 → S-05 진입

#### States
- `default`: 모든 버튼 활성
- `batchRunning`: [전체 파일 AI 정리] 버튼 비활성화

#### Accessibility
- 각 버튼에 `aria-label` 명시

#### Reusability
F02_ChangedFileTree 전용. S02_HistoryViewScreen 상단에서만 사용.

---

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
  onFileAISummary: (file: ChangedFile) => void;
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
F02_ChangedFileTree 전용. S02_HistoryViewScreen 내 스크롤 영역에서만 사용.

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
  onAISummary: (file: ChangedFile) => void;
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
  onAISummary: (file: ChangedFile) => void;
}
```

#### Interaction
- 호버 시 `FileActionButtons` 표시, `FileStatusBadge` 유지
- [코드 보기] 클릭 → `selectedFile` 업데이트 → S-03 진입
- [AI 정리 보기] 클릭 → `selectedFile` 업데이트 → S-04 진입

#### States
- `default`, `hover`

#### Accessibility
- `role="treeitem"`, `aria-label="{파일경로} — {상태}"`, `tabIndex={0}`

#### Reusability
F02_ChangedFileTree 전용. FileTree 내에서만 사용. → 상세 문서: [components/FileTreeNode.md](../../components/FileTreeNode.md)

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
**재사용 가능.** FileTreeNode(S02)와 FileNode(S05 캔버스) 모두에서 사용. → 상세 문서: [components/FileStatusBadge.md](../../components/FileStatusBadge.md)

---

## Component Tree

```
F02_ChangedFileTree
├─ CommitActionBar
│   ├─ PrimaryButton [커밋 AI 정리]
│   ├─ PrimaryButton [전체 파일 AI 정리]
│   └─ PrimaryButton [캔버스 보기]
└─ FileTree
    ├─ DirectoryNode (재귀)
    │   └─ FileTreeNode
    │       ├─ FileStatusBadge
    │       ├─ SavedBadge (조건부)
    │       └─ FileActionButtons (호버 시)
    ├─ LoadingState (로드 중)
    └─ EmptyState (변경 파일 없음)
```

---

## Variants

### FileTreeNode
- `default`: 기본 파일 행
- `hover`: `FileActionButtons` 노출

### DirectoryNode
- `expanded`: 하위 항목 표시
- `collapsed`: 하위 항목 숨김

### CommitActionBar
- `default`: 모든 버튼 활성
- `batchRunning`: [전체 파일 AI 정리] 버튼 비활성

---

## Layout Rules

```
S02_HistoryViewScreen
├─ TopHeader (커밋 메시지 표시)
├─ CommitActionBar
│   ├─ PrimaryButton [커밋 AI 정리]
│   ├─ PrimaryButton [전체 파일 AI 정리]
│   └─ PrimaryButton [캔버스 보기]
└─ FileTree (스크롤 영역)
    ├─ DirectoryNode
    │   └─ FileTreeNode
    │       ├─ FileStatusBadge
    │       ├─ [파일명]
    │       ├─ SavedBadge (조건부)
    │       └─ FileActionButtons (호버 시)
    └─ ...
```

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 파일 호버 | `FileTreeNode` 마우스 진입 | `FileActionButtons` 표시 |
| 파일 호버 해제 | 마우스 이탈 | `FileActionButtons` 숨김 |
| [코드 보기] | 버튼 클릭 | `selectedFile` 설정 후 S-03 진입 |
| [AI 정리 보기] | 버튼 클릭 | `selectedFile` 설정 후 S-04 진입, `summaryMode = "file"` |
| [커밋 AI 정리] | 버튼 클릭 | S-04 진입, `summaryMode = "commit"` |
| [전체 파일 AI 정리] | 버튼 클릭 | `isBatchRunning = true`, `batchTotal` 설정 |
| [캔버스 보기] | 버튼 클릭 | S-05 진입 |
| 디렉토리 클릭 | `DirectoryNode` 클릭 | 펼침/접힘 토글 |

> 현재 S-03은 코드 뷰어로, S-05는 의존성 캔버스로 라우팅된다. S-04 AI 요약 화면은 placeholder 화면으로 유지되며 실제 AI 로딩은 후속 Feature 구현에서 연결한다.

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

- 현재 구현은 `CommitActionBar` 텍스트 버튼을 유지한다.
- 좁은 패널에서 버튼 레이블을 아이콘만 표시하는 개선은 후속 UI polish 항목으로 남긴다.

---

## Current Implementation Files

| 파일 | 역할 |
|------|------|
| `src/webview/features/F02/S02_HistoryViewScreen.tsx` | S02 화면 조합, 변경 파일 메시지 구독 |
| `src/webview/features/F02/CommitActionBar.tsx` | 커밋 단위 액션 버튼 |
| `src/webview/features/F02/FileTree.tsx` | 변경 파일 트리 상태 분기와 요약 |
| `src/webview/features/F02/DirectoryNode.tsx` | 디렉토리 노드 토글 |
| `src/webview/features/F02/FileTreeNode.tsx` | 파일 행, 상태 배지, 저장됨 뱃지, 호버 액션 |
| `src/webview/features/F02/tree.ts` | `ChangedFile[]` → 디렉토리 트리 변환 |
| `src/webview/shared/components/FileStatusBadge.tsx` | A/M/D/R 공유 상태 배지 |
| `src/webview/shared/components/FileActionButtons.tsx` | 코드 보기/AI 정리 보기 공유 액션 버튼 |

---

## Reusable Components

- [`FileActionButtons`](../../core/global_components.md#fileactionbuttons)
- [`SavedBadge`](../../core/global_components.md#savedbadge)
- [`EmptyState`](../../core/global_components.md#emptystate)
- [`LoadingState`](../../core/global_components.md#loadingstate)
- [`ErrorState`](../../core/global_components.md#errorstate)

---

## MCP Optimization Rules

- `CommitActionBar`는 독립 Frame으로 분리 (상단 고정 액션 영역)
- `FileTree`는 독립 Frame으로 분리 (스크롤 영역)
- `FileTreeNode`는 재사용 Component로 등록 (default/hover Variant)
- `DirectoryNode`는 재사용 Component로 등록 (expanded/collapsed Variant)
- `FileStatusBadge`는 전역 Component로 등록 (A/M/D/R Variant)
- Auto Layout: `FileTree`는 Vertical, `FileTreeNode` 내부는 Horizontal
- `SavedBadge`와 `FileActionButtons`는 전역 Component 참조

---

## Figma Naming Rules

```
S02_HistoryViewScreen
├─ TopHeader
├─ CommitActionBar
│   ├─ PrimaryButton [커밋 AI 정리]
│   ├─ PrimaryButton [전체 파일 AI 정리]
│   └─ PrimaryButton [캔버스 보기]
└─ FileTree
    ├─ DirectoryNode [expanded]
    ├─ DirectoryNode [collapsed]
    ├─ FileTreeNode [default]
    └─ FileTreeNode [hover]
        ├─ FileStatusBadge [A]
        ├─ FileStatusBadge [M]
        ├─ FileStatusBadge [D]
        ├─ FileStatusBadge [R]
        ├─ SavedBadge
        └─ FileActionButtons
```
