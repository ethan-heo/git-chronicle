# Feature Blueprint: F01_CommitLog

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

커밋 이력 목록을 표시하고, 기간·작성자·키워드 필터를 제공하며, 무한 스크롤로 추가 로드를 지원한다.

---

## Inputs

- 현재 워크스페이스의 Git 저장소 경로
- 필터 값: `filterDateStart`, `filterDateEnd`, `filterAuthor`, `filterKeyword`
- 페이지 오프셋: `commitPage`

---

## Outputs

- `commitList`: 로드된 커밋 목록 (전역 상태 업데이트)
- `authorList`: 드롭다운용 작성자 목록 (전역 상태 업데이트)
- `selectedCommit`: 클릭 시 선택된 커밋 (전역 상태 업데이트 → S-02 진입 트리거)
- `commitListScrollTop`: S-01 재진입 시 복원할 마지막 스크롤 위치

> 현재 구현은 `src/webview/features/F01/` 아래에 F01 전용 컴포넌트를 두고, `S01_CommitListScreen.tsx`를 같은 디렉토리에서 조합한다.

---

## Components

- `CommitFilterPanel`
- `DateRangeFilter`
- `AuthorDropdown`
- `KeywordSearchInput`
- `CommitList`
- `CommitListItem`
- `InfiniteScrollTrigger`

---

## Component Definitions

### Component: CommitFilterPanel

#### Purpose
날짜 범위, 작성자, 키워드 세 가지 필터를 하나의 패널로 묶어 표시한다.

#### Data
- `filterDateStart: string | null`
- `filterDateEnd: string | null`
- `filterAuthor: string | null`
- `filterKeyword: string`

#### Props
```typescript
interface CommitFilterPanelProps {
  filterDateStart: string | null;
  filterDateEnd: string | null;
  filterAuthor: string | null;
  filterKeyword: string;
  authorList: string[];
  onFilterChange: (filter: Partial<FilterState>) => void;
}
```

#### Interaction
- 각 필터 변경 시 전역 상태 업데이트 → 커밋 목록 재로드

#### States
- `default`: 필터 값 없음
- `active`: 하나 이상의 필터 적용 중 (시각적 강조)

#### Accessibility
- 필터 패널 전체에 `role="search"` 적용
- 각 입력 요소에 `aria-label` 명시

#### Reusability
F01_CommitLog 전용. S01_CommitListScreen에서만 사용. → 상세 문서: [components/CommitFilterPanel.md](../../components/CommitFilterPanel.md)

---

### Component: DateRangeFilter

#### Purpose
시작일과 종료일을 입력받아 기간 필터를 설정한다.

#### Data
- `startDate: string | null`
- `endDate: string | null`

#### Props
```typescript
interface DateRangeFilterProps {
  startDate: string | null;
  endDate: string | null;
  onStartDateChange: (date: string | null) => void;
  onEndDateChange: (date: string | null) => void;
}
```

#### Interaction
- `<input type="date">` 두 개 제공
- 시작일이 종료일보다 늦으면 자동으로 종료일을 시작일로 맞춤

#### States
- `default`, `filled`

#### Accessibility
- `aria-label="시작일"`, `aria-label="종료일"`

#### Reusability
F01_CommitLog 전용. CommitFilterPanel 내에서만 사용.

---

### Component: AuthorDropdown

#### Purpose
커밋 작성자 목록에서 하나를 선택하여 작성자 필터를 적용한다.

#### Data
- `authorList: string[]`
- `selectedAuthor: string | null`

#### Props
```typescript
interface AuthorDropdownProps {
  authorList: string[];
  selectedAuthor: string | null;
  onAuthorChange: (author: string | null) => void;
}
```

#### Interaction
- 드롭다운 열기 → 작성자 목록 표시 → 선택 시 필터 적용
- "전체" 선택 시 필터 해제

#### States
- `default` (전체), `selected`, `open`

#### Accessibility
- native `<select>` 구현 시 `aria-label="작성자 필터"`를 제공한다.
- 커스텀 combobox로 확장할 경우 `role="combobox"`, `aria-expanded`를 함께 제공한다.

#### Reusability
F01_CommitLog 전용. CommitFilterPanel 내에서만 사용.

---

### Component: KeywordSearchInput

#### Purpose
커밋 메시지 키워드를 입력받아 필터링한다.

#### Data
- `keyword: string`

#### Props
```typescript
interface KeywordSearchInputProps {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  debounceMs?: number; // 기본값: 300
}
```

#### Interaction
- 입력 후 300ms 디바운싱 후 `filterKeyword` 업데이트
- 입력창 우측에 초기화(×) 버튼 표시 (입력값 있을 때)

#### States
- `empty`, `typing`, `filled`

#### Accessibility
- `aria-label="커밋 메시지 키워드 검색"`, `type="search"`

#### Reusability
F01_CommitLog 전용. CommitFilterPanel 내에서만 사용.

---

### Component: CommitList

#### Purpose
필터링된 커밋 목록을 세로 스크롤 리스트로 표시하고 무한 스크롤을 처리한다.

#### Data
- `commitList: Commit[]`
- `isLoadingCommits: boolean`
- `hasMoreCommits: boolean`
- `savedScrollTop: number`

#### Props
```typescript
interface CommitListProps {
  commitList: Commit[];
  isLoadingCommits: boolean;
  hasMoreCommits: boolean;
  isGitRepoDetected: boolean;
  onCommitClick: (commit: Commit) => void;
  onLoadMore: () => void;
  savedScrollTop: number;
  onScrollTopChange: (top: number) => void;
}
```

#### Interaction
- 스크롤 하단 도달 시 `InfiniteScrollTrigger` 발동 → 다음 200개 로드
- S-01 재진입 시 이미 로드된 목록이 있으면 목록을 유지하고 마지막 스크롤 위치를 복원한다.
- 필터 변경 시에는 목록을 첫 페이지부터 다시 로드하고 스크롤 위치를 0으로 초기화한다.

#### States
- `loading` (초기 로드 중): `LoadingState` 표시
- `empty`: `EmptyState` 표시
- `populated`: `CommitListItem` 목록 표시
- `loadingMore`: 하단에 추가 로딩 스피너 표시

#### Accessibility
- `role="list"`

#### Reusability
F01_CommitLog 전용. S01_CommitListScreen에서만 사용.

---

### Component: CommitListItem

#### Purpose
개별 커밋 정보(해시·메시지·작성자·날짜)를 하나의 행으로 표시한다.

#### Data
- `commit: Commit`

#### Props
```typescript
interface CommitListItemProps {
  commit: Commit;
  onClick: (commit: Commit) => void;
}
```

#### Interaction
- 호버: 배경색 변경
- 클릭: `selectedCommit` 업데이트 → S-02 화면 전환

#### States
- `default`, `hover`

#### Accessibility
- `role="listitem"`, `aria-label="{커밋메시지} by {작성자} on {날짜}"`, `tabIndex={0}`

#### Reusability
F01_CommitLog 전용. CommitList 내에서만 사용. → 상세 문서: [components/CommitListItem.md](../../components/CommitListItem.md)

---

### Component: InfiniteScrollTrigger

#### Purpose
스크롤 하단 감지 시 추가 데이터 로드를 트리거하는 Intersection Observer 기반 컴포넌트.

#### Data
- `onTrigger: () => void`
- `isEnabled: boolean`

#### Props
```typescript
interface InfiniteScrollTriggerProps {
  onTrigger: () => void;
  isEnabled: boolean; // hasMoreCommits && !isLoadingCommits
}
```

#### Interaction
- 뷰포트에 진입 시 `onTrigger` 호출
- `hasMoreCommits`가 false이면 비활성화

#### Reusability
패턴적으로 재사용 가능하나, v1.0에서는 F01_CommitLog에서만 사용.

---

## Component Tree

```
F01_CommitLog
├─ CommitFilterPanel
│   ├─ DateRangeFilter
│   ├─ AuthorDropdown
│   └─ KeywordSearchInput
└─ CommitList
    ├─ CommitListItem × N
    ├─ LoadingState (초기 로드 중)
    ├─ EmptyState (빈 상태)
    └─ InfiniteScrollTrigger
```

---

## Variants

### CommitListItem
- `default`: 기본 행 표시
- `hover`: 배경색 `color.surface.hover` 적용

### CommitList
- `loading`: `LoadingState` 렌더링
- `empty.noRepo`: `EmptyState` (Git 저장소 없음)
- `empty.noCommits`: `EmptyState` (커밋 없음)
- `empty.noResults`: `EmptyState` (필터 결과 없음)
- `populated`: `CommitListItem` 목록
- `loadingMore`: 목록 하단 추가 스피너

### CommitFilterPanel
- `default`: 필터 값 없음
- `active`: 하나 이상 필터 적용 중

---

## Layout Rules

```
CommitFilterPanel (상단 고정)
├─ DateRangeFilter
├─ AuthorDropdown
└─ KeywordSearchInput

CommitList (스크롤 영역)
├─ CommitListItem × N
└─ InfiniteScrollTrigger (하단)
```

- `CommitFilterPanel`은 상단에 고정. 스크롤해도 항상 표시.
- `CommitList`는 `CommitFilterPanel` 하단부터 화면 끝까지 전체 스크롤 영역을 차지.
- 뒤로가기 또는 설정 화면 복귀처럼 S-01을 다시 열 때는 저장된 스크롤 위치를 기준으로 리스트가 복원된다.

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 필터 변경 | 날짜 입력, 드롭다운 선택, 키워드 입력 | 커밋 목록 재로드 |
| 키워드 입력 | 텍스트 입력 | 300ms 디바운스 후 필터 실행 |
| 커밋 클릭 | `CommitListItem` 클릭 | S-02 화면 전환 |
| 스크롤 하단 도달 | `InfiniteScrollTrigger` | 다음 200개 추가 로드 |
| S-01 재진입 | 이미 로드된 목록 존재 | 목록 재로드 없이 스크롤 위치 복원 |

---

## State Model

| 상태 | 조건 | UI |
|------|------|-----|
| `loading` | 초기 로드 중 | `LoadingState` (전체 화면 중앙) |
| `empty.noRepo` | `isGitRepoDetected === false` | `EmptyState`: "Git 저장소가 감지되지 않았습니다" |
| `empty.noCommits` | `commitList.length === 0 && 필터 없음` | `EmptyState`: "커밋 이력이 없습니다" |
| `empty.noResults` | `commitList.length === 0 && 필터 있음` | `EmptyState`: "조건에 맞는 커밋이 없습니다" |
| `populated` | `commitList.length > 0` | `CommitList` 표시 |
| `loadingMore` | `isLoadingCommits === true && commitList.length > 0` | 하단 스피너 추가 |

---

## Empty States

- **Git 저장소 없음:** `EmptyState` (message: "Git 저장소가 감지되지 않았습니다", ctaLabel: "레포 열기")
- **커밋 없음:** `EmptyState` (message: "커밋 이력이 없습니다")
- **필터 결과 없음:** `EmptyState` (message: "조건에 맞는 커밋이 없습니다")

---

## Error States

- **git 명령 실패:** `ErrorState` (message: "커밋 목록을 불러오지 못했습니다", onRetry: 커밋 재로드)
- **무한 스크롤 로드 실패:** 하단 인라인 에러 표시. 기존 목록은 유지.

---

## Loading States

| 상태 | 컴포넌트 | 위치 |
|------|---------|------|
| 초기 로드 중 | `LoadingState [lg]` | CommitList 전체 영역 중앙 |
| 추가 로드 중 | `LoadingState [sm]` | CommitList 하단 (기존 목록 하단) |

---

## Responsive Rules

- 너비 < 320px: `CommitFilterPanel`을 토글 버튼으로 접을 수 있게 전환
- `CommitListItem`은 좁은 너비에서 날짜·작성자 줄 바꿈 허용

---

## Reusable Components

- [`EmptyState`](../../core/global_components.md#emptystate)
- [`LoadingState`](../../core/global_components.md#loadingstate)
- [`ErrorState`](../../core/global_components.md#errorstate)
- [`TopHeader`](../../core/global_components.md#topheader)

---

## MCP Optimization Rules

- `CommitFilterPanel`은 독립 Frame으로 분리 (상단 고정 영역)
- `CommitList`는 독립 Frame으로 분리 (스크롤 영역)
- `CommitListItem`은 재사용 Component로 등록
- `EmptyState`, `LoadingState`, `ErrorState`는 전역 Component 참조
- Auto Layout: `CommitFilterPanel`은 Vertical, `CommitList`는 Vertical
- `CommitListItem`의 모든 상태(default/hover)를 단일 Component의 Variant로 관리

---

## Figma Naming Rules

```
S01_CommitListScreen
├─ TopHeader
├─ CommitFilterPanel
│   ├─ DateRangeFilter
│   ├─ AuthorDropdown
│   └─ KeywordSearchInput
└─ CommitList
    ├─ CommitListItem [default]
    ├─ CommitListItem [hover]
    ├─ LoadingState [lg]
    ├─ LoadingState [sm]
    └─ EmptyState
```
