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
  diffContent: DiffLine[];
  language: string;
  isBinary: boolean;
  isDeleted: boolean;
}
```

#### Interaction
- 수직 스크롤만 지원
- 코드 수정 불가 (읽기 전용)

#### States
- `loading`: diff 로드 중
- `populated`: diff 표시
- `binary`: 이진 파일
- `deleted`: 삭제된 파일

#### Accessibility
- `role="region"`, `aria-label="코드 변경 내역"`, `tabIndex={0}` (포커스 가능)

#### Reusability
F03_CodeViewer 전용. S03_CodeViewerScreen에서만 사용. → 상세 문서: [components/DiffViewer.md](../../components/DiffViewer.md)

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
- `added`: `color.diff.added` 배경
- `removed`: `color.diff.removed` 배경
- `context`: 기본 배경

#### Accessibility
- `aria-label` 불필요 (코드 영역은 스크린리더 전체 읽기 대상에서 제외 권장)

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

## Component Tree

```
F03_CodeViewer
└─ DiffViewer
    ├─ DeletedFileNotice (조건부)
    ├─ DiffLine × N
    │   ├─ DiffLine [added]
    │   ├─ DiffLine [removed]
    │   └─ DiffLine [context]
    └─ BinaryFileNotice (조건부)
```

---

## Variants

### DiffLine
- `added`: 추가 라인 (`+` 접두사, `color.diff.added` 배경)
- `removed`: 삭제 라인 (`-` 접두사, `color.diff.removed` 배경)
- `context`: 컨텍스트 라인 (변경 없는 주변 코드)

### DiffViewer
- `loading`: diff 로드 중
- `populated`: 정상 diff 표시
- `binary`: 이진 파일 안내
- `deleted`: 삭제된 파일 안내 + 삭제 전 코드

---

## Layout Rules

```
S03_CodeViewerScreen
├─ TopHeader ({커밋 메시지} > {파일 경로})
└─ DiffViewer (스크롤 영역)
    ├─ DeletedFileNotice (조건부, 최상단)
    └─ DiffLine × N
       OR BinaryFileNotice
```

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 뒤로가기 | `BackButton` 클릭 | S-02 복귀 |
| 스크롤 | 스크롤 | diff 내용 탐색 |

---

## State Model

| 상태 | 조건 | UI |
|------|------|-----|
| `loading` | diff 로드 중 | `LoadingState` |
| `binary` | 이진 파일 | `BinaryFileNotice` |
| `deleted` | 삭제된 파일 | `DeletedFileNotice` + 삭제 전 코드 표시 |
| `populated` | 일반 diff | `DiffViewer` |
| `error` | 로드 실패 | `ErrorState` |

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

---

## MCP Optimization Rules

- `DiffViewer`는 독립 Frame으로 분리 (스크롤 영역)
- `DiffLine`은 재사용 Component로 등록 (added/removed/context Variant)
- `BinaryFileNotice`와 `DeletedFileNotice`는 각각 독립 Component
- Auto Layout: `DiffViewer`는 Vertical, `DiffLine`은 Horizontal (라인 번호 + 코드)
- 라인 번호 컬럼 폭은 고정 (Hug 대신 Fixed로 설정)

---

## Figma Naming Rules

```
S03_CodeViewerScreen
├─ TopHeader
└─ DiffViewer
    ├─ DeletedFileNotice
    ├─ DiffLine [added]
    ├─ DiffLine [removed]
    ├─ DiffLine [context]
    └─ BinaryFileNotice
```
