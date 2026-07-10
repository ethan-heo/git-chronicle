# Feature Blueprint: F03_CodeViewer

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

선택된 파일의 Git diff를 unified diff 형식 + Shiki 신텍스 하이라이팅으로 렌더링한다.

---

## Inputs

- `selectedFile: ChangedFile` — 전역 상태에서 참조
- `selectedCommit: Commit` — 헤더 컨텍스트 표시용

---

## Outputs

없음 (읽기 전용 뷰어)

---

## Components

- `DiffViewer`
- `DiffLine`
- `DiffFoldRow`
- `BinaryFileNotice`
- `DeletedFileNotice`

---

## Component Definitions

### Component: DiffViewer

#### Purpose
unified diff 형식의 전체 코드 변경 내역을 스크롤 가능한 영역으로 표시한다.

#### Data
- `diffContent: DiffLine[]`
- `language: string` — Shiki 언어 식별자 (파일 확장자에서 추론)

#### Props
```typescript
interface DiffViewerProps {
  diffLines: DiffLineData[];
  filePath: string;
  isLoading: boolean;
  error: string | null;
  isBinaryFile: boolean;
  isDeletedFile: boolean;
  highlightRange?: { start: number; end: number } | null;
  scrollToRange?: { start: number; end: number } | null;
  scrollRequestId?: number;
  onRetry: () => void;
}
```

#### Interaction
- 수직 스크롤만 지원
- 코드 수정 불가 (읽기 전용)
- diff 라인 마우스 드래그로 범위 선택
- 드래그 종료 지점 근처에 [복사] 아이콘 오버레이 표시, 클릭 시 선택 범위를 마크다운으로 복사
- 변경 없는 긴 컨텍스트 구간은 기본 접힘 상태로 시작하고, 접힘 행 클릭으로 개별 구간을 펼칠 수 있음
- 활성 화면에서는 메시지 리스너 등록 후 diff 요청을 전송해야 한다
- 심볼 캔버스 노드 호버 시 해당 `newLineNumber` 범위를 배경 하이라이트한다
- 심볼 캔버스 노드 클릭 시 대상 라인이 접혀 있으면 해당 fold를 먼저 펼친 뒤 중앙으로 스크롤한다

#### States
- `loading`: diff 로드 중
- `populated`: diff 표시
- `binary`: 이진 파일
- `deleted`: 삭제된 파일
- `folded`: 변경 없는 긴 컨텍스트 구간 일부가 접힌 상태
- `expanded`: 사용자가 접힘 행을 클릭해 특정 폴드 구간이 펼쳐진 상태

#### Accessibility
- `role="region"`, `aria-label="코드 변경 내역"`, `tabIndex={0}` (포커스 가능)

#### Reusability
F03_CodeViewer 전용. S02_WorkspaceScreen 본문 `code` 패널에서만 사용.

---

### Component: DiffLine

#### Purpose
개별 diff 라인을 `+`(추가), `-`(삭제), ` `(컨텍스트) 유형으로 구분하여 표시한다.

#### Data
- `type: "added" | "removed" | "context"`
- `lineNumber: { before: number | null, after: number | null }`
- `content: string`

#### Props
```typescript
interface DiffLineProps {
  type: "added" | "removed" | "context";
  lineNumber: { before: number | null; after: number | null };
  content: string;
}
```

#### Interaction
없음 (표시 전용)

#### States
- `added`: 추가 배경색 + `+` 접두사로 구분
- `removed`: 삭제 배경색 + `-` 접두사로 구분
- `context`: 기본 배경

#### Accessibility
- `aria-label` 불필요 (코드 영역은 스크린리더 전체 읽기 대상에서 제외 권장)

#### Reusability
F03_CodeViewer 전용. DiffViewer 내에서만 사용.

---

### Component: DiffFoldRow

#### Purpose
변경 없는 긴 컨텍스트 구간이 접혀 있거나 펼쳐져 있음을 표시하고, 해당 구간의 토글 진입점을 제공한다.

#### Data
- `hiddenCount: number`
- `startLineLabel: string`
- `endLineLabel: string`
- `isExpanded: boolean`

#### Props
```typescript
interface DiffFoldRowProps {
  hiddenCount: number;
  startLineLabel: string;
  endLineLabel: string;
  isExpanded: boolean;
  onToggle: () => void;
}
```

#### Interaction
- 라인 정보가 표시된 접힘 행 전체를 클릭하면 숨겨진 컨텍스트 라인 표시

#### States
- `collapsed`: "⋯ N줄 숨김 (라인 A-B)" 표시

#### Accessibility
- 접힘 행 전체는 button semantics 사용

#### Reusability
F03_CodeViewer 전용. DiffViewer 내에서만 사용.

---

### Component: BinaryFileNotice

#### Purpose
이진 파일로 diff를 표시할 수 없음을 안내한다.

#### Data
없음

#### Interaction
없음

---

### Component: DeletedFileNotice

#### Purpose
삭제된 파일임을 알리는 배너. `DiffViewer` 상단에 표시.

#### Data
없음

#### Interaction
없음

---

## Variants

### DiffLine
- `added`: 추가 라인 (`+` 접두사, 추가 배경색)
- `removed`: 삭제 라인 (`-` 접두사, 삭제 배경색)
- `context`: 컨텍스트 라인 (변경 없는 주변 코드)

### DiffViewer
- `loading`: diff 로드 중
- `populated`: 정상 diff 표시
- `binary`: 이진 파일 안내
- `deleted`: 삭제된 파일 안내 + 삭제 전 코드

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 스크롤 | 스크롤 | diff 내용 탐색 |
| 폴드 펼치기 | `DiffFoldRow` 행 클릭 | 해당 변경 없는 컨텍스트 구간을 펼쳐 실제 라인을 표시 |
| 심볼 하이라이트 | F10 노드 호버 | 해당 라인 범위 배경 강조, 스크롤 없음 |
| 심볼 이동 | F10 노드 클릭 | 해당 라인 범위 강조 + 필요 시 fold 자동 펼침 + 중앙 스크롤 |

---

## State Model

| 상태 | 조건 | UI |
|------|------|-----|
| `loading` | diff 로드 중 | `LoadingState` |
| `binary` | 이진 파일 | `BinaryFileNotice` |
| `deleted` | 삭제된 파일 | `DeletedFileNotice` + 삭제 전 코드 표시 |
| `populated` | 일반 diff | `DiffViewer` |
| `folded` | 긴 컨텍스트 구간이 있고 기본 표시 상태 | `DiffFoldRow[collapsed]` + 주변 `DiffLine` |
| `expanded` | 사용자가 특정 폴드 구간을 펼침 | 펼쳐진 `DiffLine` |
| `error` | 로드 실패 | `ErrorState` |

개발 환경처럼 응답이 빠른 경우에도 `loading` 상태가 영구 유지되지 않도록, 메시지 수신 경로와 후처리 실패 경로를 모두 종료 상태로 연결한다.

---

## Empty States

- `BinaryFileNotice`: "Binary file — diff를 표시할 수 없습니다"

---

## Error States

- `ErrorState` (message: "diff를 불러오지 못했습니다", onRetry: diff 재로드)

---

## Loading States

| 상태 | 컴포넌트 | 위치 |
|------|---------|------|
| diff 로드 중 | `LoadingState [lg]` | DiffViewer 전체 영역 중앙 |

---

## Responsive Rules

- `DiffViewer`는 가로 스크롤도 지원 (긴 라인 잘림 방지)
- 라인 번호 컬럼은 좁은 너비에서 숨길 수 있음

---

## Reusable Components

- [`LoadingState`](../../core/global_components.md#loadingstate)
- [`ErrorState`](../../core/global_components.md#errorstate)
- [`TopHeader`](../../core/global_components.md#topheader)
- [`BackButton`](../../core/global_components.md#backbutton)
