# Screen: S01_CommitListScreen

## Related Features

- [F01_CommitLog](../../features/F01_commit_log/spec.md)

---

## Purpose

확장 프로그램의 진입 화면. 전체 커밋 이력을 필터링·탐색하고 원하는 커밋을 선택하는 화면.

---

## Entry Condition

VSCode Extension 활성화 시 자동 진입.

---

## Parent Screen

없음 (최상위 화면)

---

## Child Screens

- [S02_HistoryViewScreen](../S02_history_view/blueprint.md) — 커밋 항목 클릭 시

---

## Layout Structure

```
S01_CommitListScreen
├─ TopHeader
│   └─ SettingsIcon (⚙) → S06 진입
├─ CommitFilterPanel
│   ├─ DateRangeFilter
│   ├─ AuthorDropdown
│   ├─ SortOrderToggle
│   ├─ KeywordSearchInput (포함)
│   └─ KeywordSearchInput (제외)
└─ CommitList (스크롤 영역)
    ├─ CommitListItem × N
    └─ InfiniteScrollTrigger
```

현재 구현 파일은 `src/webview/features/F01/S01_CommitListScreen.tsx`이며, F01 전용 컴포넌트와 같은 디렉토리에서 조합한다.

S01은 재진입 시 이미 로드된 커밋 목록을 재사용하고 마지막 스크롤 위치를 복원한다. 따라서 S-02로 이동했다가 뒤로 돌아오거나 설정 화면을 거쳐 다시 돌아와도 목록 상단으로 강제 초기화되지 않는다.

---

## Components

| 컴포넌트 | 출처 |
|---------|------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) |
| `CommitFilterPanel` | [F01 blueprint](../../features/F01_commit_log/blueprint.md) |
| `DateRangeFilter` | [F01 blueprint](../../features/F01_commit_log/blueprint.md) |
| `AuthorDropdown` | [F01 blueprint](../../features/F01_commit_log/blueprint.md) |
| `KeywordSearchInput` | [F01 blueprint](../../features/F01_commit_log/blueprint.md) |
| `CommitList` | [F01 blueprint](../../features/F01_commit_log/blueprint.md) |
| `CommitListItem` | [F01 blueprint](../../features/F01_commit_log/blueprint.md) |
| `InfiniteScrollTrigger` | [F01 blueprint](../../features/F01_commit_log/blueprint.md) |
| `EmptyState` | [global_components](../../core/global_components.md#emptystate) |
| `LoadingState` | [global_components](../../core/global_components.md#loadingstate) |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) |

---

## Screen States

| 상태 | 조건 | UI |
|------|------|-----|
| `loading` | 초기 커밋 로드 중 | `LoadingState` (전체 화면) |
| `empty.noRepo` | Git 저장소 미감지 | `EmptyState`: "Git 저장소가 감지되지 않았습니다" + "레포 열기" |
| `empty.noCommits` | 커밋 이력 없음 | `EmptyState`: "커밋 이력이 없습니다" |
| `empty.noResults` | 필터 결과 없음 | `EmptyState`: "조건에 맞는 커밋이 없습니다" |
| `populated` | 커밋 있음 | `CommitList` 표시 |
| `loadingMore` | 무한 스크롤 로드 중 | 하단 스피너 추가 |
| `error` | git 명령 실패 | `ErrorState` |

---

## Interaction Flow

```
[Extension 활성화]
    → git repo 감지 확인
    → (없음) EmptyState [noRepo]
    → (있음) git log 로드 → CommitList 표시
        → 필터 변경 → CommitList 재로드 및 스크롤 위치 초기화
        → S01 재진입 → 목록 재로드 없이 마지막 스크롤 위치 복원
        → 스크롤 하단 → 추가 200개 로드
        → CommitListItem 클릭 → selectedCommit 설정 및 S02 진입
    → ⚙ 클릭 → S06 진입
```

---

## Responsive Rules

- 너비 < 320px: `CommitFilterPanel` 토글 방식으로 접기
- `CommitListItem`의 날짜·작성자는 좁은 너비에서 줄 바꿈 허용
