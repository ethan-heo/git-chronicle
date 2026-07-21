# Feature Blueprint: F01_CommitLog

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

커밋 이력 목록을 표시하고, 기간·작성자·메시지/해시 포함 키워드·메시지 제외 키워드와 정렬 필터를 제공하며, 무한 스크롤로 추가 로드를 지원한다.

---

## Inputs

- 현재 워크스페이스의 Git 저장소 경로
- 필터 값: `filterDateStart`, `filterDateEnd`, `filterAuthor`, `filterKeyword`, `filterExcludeKeyword`, `sortOrder`
- 페이지 오프셋: `commitPage`

---

## Outputs

- `commitList`: 로드된 커밋 목록 (전역 상태 업데이트)
- `authorList`: 드롭다운용 작성자 목록 (전역 상태 업데이트)
- `selectedCommit`: 클릭 시 선택된 커밋 (전역 상태 업데이트 → S-02 컨텍스트 갱신)
- `commitListScrollTop`: Webview 재생성 시 복원할 마지막 스크롤 위치

---

## Components

- `CommitFilterPanel`
- `FilterToggleButton`
- `DateRangeFilter`
- `AuthorDropdown`
- `KeywordSearchInput`
- `CommitList`
- `CommitActionButtons`
- `CommitListItem`
- `InfiniteScrollTrigger`

---

## Component Definitions

### Component: CommitFilterPanel

#### Purpose
날짜 범위, 작성자, 포함/제외 키워드와 정렬 순서를 하나의 패널로 묶어 표시한다.

#### Data
- `filterDateStart: string | null`
- `filterDateEnd: string | null`
- `filterAuthor: string | null`
- `filterKeyword: string`
- `filterExcludeKeyword: string`
- `sortOrder: 'desc' | 'asc'`

#### Props
```typescript
interface CommitFilterPanelProps {
  filterDateStart: string | null;
  filterDateEnd: string | null;
  filterAuthor: string | null;
  filterKeyword: string;
  filterExcludeKeyword: string;
  sortOrder: 'desc' | 'asc';
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
F01_CommitLog 전용. `standalone` variant는 독립 필터 영역에서, `embedded` variant는 S02 사이드바의 필터 팝오버 콘텐츠에서 사용한다.

---

### Component: FilterToggleButton

#### Purpose
사이드바 커밋 목록 헤더에서 필터 팝오버를 열고 닫는 아이콘 버튼이다. 활성 필터 개수를 배지로 함께 보여준다.

#### Data
- `isOpen: boolean`
- `activeFilterCount: number`

#### Props
```typescript
interface FilterToggleButtonProps {
  isOpen: boolean;
  activeFilterCount: number;
  onClick: () => void;
}
```

#### Interaction
- 클릭 시 필터 팝오버를 연다/닫는다.
- 날짜, 작성자, 포함/제외 키워드 중 적용된 조건 수를 즉시 배지에 반영한다.

#### States
- `default`
- `active` (필터 적용 중이거나 팝오버가 열려 있음)

#### Accessibility
- `aria-label`로 필터 열기/닫기 상태를 제공한다.
- `aria-expanded`로 팝오버 열림 상태를 노출한다.

#### Reusability
F01_CommitLog 전용. S02_WorkspaceScreen 사이드바 커밋 목록 섹션 헤더에서만 사용한다.

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
커밋 메시지 또는 커밋 해시 키워드를 입력받아 필터링한다.

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
- 입력 후 300ms 디바운싱 후 `filterKeyword` 또는 `filterExcludeKeyword` 업데이트
- 포함 키워드는 커밋 메시지와 커밋 해시(short/full hash)를 함께 검색한다.
- 입력창 우측에 초기화(×) 버튼 표시 (입력값 있을 때)

#### States
- `empty`, `typing`, `filled`

#### Accessibility
- `aria-label="커밋 메시지 또는 해시 키워드 검색"`, `type="search"`

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
  selectedCommitHash: string | null;
  isLoadingCommits: boolean;
  hasMoreCommits: boolean;
  isGitRepoDetected: boolean;
  onCommitClick: (commit: Commit) => void;
  onLoadMore: () => void;
  savedScrollTop: number;
  onScrollTopChange: (top: number) => void;
  onOpenAISummary: () => void;
  onOpenFileCanvas: () => void;
  isAIViewActive: boolean;
  isFileCanvasActive: boolean;
  isSelectModeActive?: boolean;
  selectedCommitHashesForGroup?: Set<string>;
  onToggleCheckForGroup?: (hash: string) => void;
}
```

#### Interaction
- 스크롤 하단 도달 시 `InfiniteScrollTrigger` 발동 → 다음 200개 로드
- 워크스페이스 안에서는 커밋 목록 섹션이 유지되므로 현재 스크롤 위치를 그대로 보존한다.
- 필터 변경 시에는 목록을 첫 페이지부터 다시 로드하고 스크롤 위치를 0으로 초기화한다.
- 각 행에는 `CommitActionButtons`와 `CopyMarkdownButton`을 함께 렌더링할 수 있도록 액션 콜백과 활성 상태를 전달한다.
- `isSelectModeActive`가 `true`이면 각 `CommitListItem`에 체크박스 상태(`isCheckedForGroup`)와 토글 콜백을 전달한다. 이 prop들은 [F13_CommitGroups](../F13_commit_groups/blueprint.md)가 조립 화면을 통해서만 채운다 — `CommitList`/`CommitListItem` 파일 자체는 F13을 import하지 않는다.

#### States
- `loading` (초기 로드 중): `LoadingState` 표시
- `empty`: `EmptyState` 표시
- `populated`: `CommitListItem` 목록 표시
- `loadingMore`: 하단에 추가 로딩 스피너 표시

#### Accessibility
- `role="list"`

#### Reusability
F01_CommitLog 전용. S02_WorkspaceScreen 사이드바 커밋 목록 섹션에서 사용한다.

---

### Component: CommitActionButtons

#### Purpose
커밋 목록 항목 우상단에서 AI 전체 요약과 파일 캔버스로 바로 진입하는 호버 액션 버튼 그룹이다.

#### Data
- `isAIViewActive: boolean`
- `isFileCanvasActive: boolean`

#### Props
```typescript
interface CommitActionButtonsProps {
  isAIViewActive: boolean;
  isFileCanvasActive: boolean;
  onOpenAISummary: () => void;
  onOpenFileCanvas: () => void;
}
```

#### Interaction
- 호버 시 노출되며, 클릭은 `event.stopPropagation()`으로 행 선택과 분리한다.
- 현재 선택된 커밋 항목에서만 렌더링된다.
- 해당 패널이 현재 포커스 pane의 활성 탭이면 active 배경색과 텍스트 색으로 강조한다.

#### States
- `hidden`: 기본 상태. 행 호버/포커스 전에는 보이지 않는다.
- `enabled`: 선택된 커밋 항목에서 클릭 가능하다.
- `active`: 선택된 커밋 항목이며 해당 패널 탭이 현재 활성화되어 있다.

#### Accessibility
- 각 버튼은 기존 `action_bar.commit_ai_aria`, `action_bar.canvas_aria` 라벨을 재사용한다.

#### Reusability
F01_CommitLog 전용. `CommitListItem` 내부에서만 사용한다.

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
  isSelected: boolean;
  onClick: (commit: Commit) => void;
  onOpenAISummary: () => void;
  onOpenFileCanvas: () => void;
  isAIViewActive: boolean;
  isFileCanvasActive: boolean;
  isSelectModeActive?: boolean;
  isCheckedForGroup?: boolean;
  onToggleCheckForGroup?: (hash: string) => void;
}
```

#### Interaction
- 호버: 배경색 변경 + 우상단 `CopyMarkdownButton` 노출, 선택된 항목이면 `CommitActionButtons`도 함께 노출
- 클릭: `selectedCommit` 업데이트 → S-02 안에서 변경 파일/본문 컨텍스트 갱신
- [AI 요약]/[파일 캔버스] 클릭: 현재 항목이 선택된 경우에만 각각 F05b `aiSummary`, F04 `fileCanvas` 탭을 연다
- 선택됨: 현재 `selectedCommit`과 같은 항목은 강조 배경과 좌측 accent bar를 유지한다
- `isSelectModeActive`가 `true`이면 좌측에 체크박스가 나타난다. 체크박스 클릭은 `event.stopPropagation()`으로 행 클릭(단일 선택)과 분리되어 독립적으로 동작한다([F13_CommitGroups](../F13_commit_groups/blueprint.md) 참고)

#### States
- `default`, `hover`, `selected`, `actionActive`, `checked`(선택 모드에서 체크박스 선택됨)

#### Accessibility
- `role="listitem"`, `aria-label="{커밋메시지} by {작성자} on {날짜}"`, `tabIndex={0}`

#### Reusability
F01_CommitLog 전용. CommitList 내에서만 사용.

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

## Variants

### CommitListItem
- `default`: 기본 행 표시
- `hover`: 배경색 `color.surface.hover` 적용
- `selected`: 강조 배경 + 좌측 accent bar + 메타데이터 대비 강화
- `actionActive`: 선택된 항목이면서 해당 패널 탭이 현재 활성일 때 버튼 강조

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

- `CommitFilterPanel`은 상단에 고정. 스크롤해도 항상 표시.
- `CommitList`는 `CommitFilterPanel` 하단부터 화면 끝까지 전체 스크롤 영역을 차지.
- 뒤로가기 또는 설정 화면 복귀처럼 S-01을 다시 열 때는 저장된 스크롤 위치를 기준으로 리스트가 복원된다.

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 필터 변경 | 날짜 입력, 드롭다운 선택, 키워드 입력 | 커밋 목록 재로드 |
| 키워드 입력 | 텍스트 입력 | 300ms 디바운스 후 필터 실행 |
| 커밋 클릭 | `CommitListItem` 클릭 | `selectedCommit` 갱신 + 해당 항목 하이라이트 유지 |
| 커밋 항목 액션 클릭 | 선택된 `CommitListItem`의 `CommitActionButtons` | `aiSummary` 또는 `fileCanvas` 탭 활성화 |
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
