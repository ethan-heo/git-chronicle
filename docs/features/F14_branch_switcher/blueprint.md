# Feature Blueprint: F14_BranchSwitcher

## Purpose

S02 사이드바 최상단에서 로컬/원격 브랜치 목록을 보여주고, 선택 브랜치에 따라 F01 커밋 목록의 조회 범위를 전환한다.

---

## Layout

```text
BranchesSection
├─ SectionHeader
│  ├─ title: Branches
│  ├─ badge: branch count
│  └─ action: FetchBranchesButton
└─ BranchList
   └─ BranchListItem[]
```

---

## Component Definitions

### `BranchesSection`

- `SidebarSection` 래퍼를 사용한다.
- S02의 `SidebarSectionGroup` 최상단에 배치된다.
- 기본 펼침 상태는 `true`, 기본 높이는 `140px`.
- 헤더 우측 액션으로 `FetchBranchesButton`을 가진다.

### `BranchList`

- `branches.length === 0`이고 로딩 중이면 `LoadingState`.
- `branches.length === 0`이고 에러가 있으면 `ErrorState + Retry`.
- `branches.length === 0`이고 정상 응답이면 빈 상태 메시지 표시.
- 정상 상태에서는 세로 스크롤 가능한 리스트로 `BranchListItem[]`를 렌더링한다.

### `BranchListItem`

- 좌측 accent bar는 현재 커밋 로그 필터로 선택된 브랜치를 표시한다.
- 원격 브랜치는 `REMOTE` 뱃지를 표시한다.
- `isCurrent === true`이면 `HEAD` 뱃지를 추가로 표시한다.
- 로컬 브랜치에서만 `upstream`이 있고 `ahead > 0 || behind > 0`이면 `↑{ahead} ↓{behind}` 뱃지를 표시한다.
- 클릭 시 `setFilter({ filterBranch: branch.name })`.

### `FetchBranchesButton`

- 헤더 액션 버튼.
- 클릭 시 `FETCH_BRANCHES { refresh: true }`.
- 로딩 중에는 버튼 내부 스피너를 표시하고 중복 클릭을 막는다.

---

## State Model

| 상태 | 소유 위치 | 설명 |
|------|-----------|------|
| `branches` | `branchSlice.ts` | 현재 로컬/원격 브랜치 목록 |
| `isLoadingBranches` | `branchSlice.ts` | 최초 목록 로딩 |
| `isFetchingBranches` | `branchSlice.ts` | Fetch 버튼 refresh 진행 중 |
| `branchesError` | `branchSlice.ts` | 최초 로드 실패 메시지 |
| `filterBranch` | `commitListSlice.ts` | 현재 커밋 로그 범위 브랜치 |

---

## Interaction Model

1. 화면 활성화 후 아직 브랜치를 불러오지 않았다면 `loadBranches()`를 호출한다.
2. `BRANCHES_LOADED`를 받으면 목록을 갱신한다.
3. 저장된 `filterBranch`가 없거나 삭제되었다면 현재 HEAD 브랜치로 폴백하고, 그 값을 `filterBranch`에 저장한다.
4. 사용자가 브랜치를 클릭하면 `filterBranch`를 바꾸고 F01 커밋 목록을 reset reload한다.
5. 사용자가 Fetch 버튼을 클릭하면 기존 목록을 유지한 채 refresh fetch를 수행한다.

---

## Empty / Error / Loading States

| 상태 | 조건 | UI |
|------|------|----|
| Loading | 최초 로드 중, 아직 목록 없음 | `LoadingState` |
| Empty | 정상 응답이지만 표시 가능한 브랜치 없음 | "No local branches" |
| Error | 최초 로드 실패, 목록 없음 | `ErrorState` + Retry |
| Refresh Error | 기존 목록이 있는 상태에서 refresh 실패 | 목록 유지 + Toast |
