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

- [S02_WorkspaceScreen](../S02_history_view/blueprint.md) — 커밋 항목 클릭 시

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

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
| `TopHeader` | [global_components](../../core/global_components.md#topheader) | `src/webview/shared/components/TopHeader.tsx` |
| `CommitFilterPanel` | [F01 blueprint](../../features/F01_commit_log/blueprint.md#component-commitfilterpanel) | `src/webview/features/F01/CommitFilterPanel.tsx` |
| `DateRangeFilter` | [F01 blueprint](../../features/F01_commit_log/blueprint.md#component-daterangefilter) | `src/webview/features/F01/DateRangeFilter.tsx` |
| `AuthorDropdown` | [F01 blueprint](../../features/F01_commit_log/blueprint.md#component-authordropdown) | `src/webview/features/F01/AuthorDropdown.tsx` |
| `KeywordSearchInput` | [F01 blueprint](../../features/F01_commit_log/blueprint.md#component-keywordsearchinput) | `src/webview/features/F01/KeywordSearchInput.tsx` |
| `CommitList` | [F01 blueprint](../../features/F01_commit_log/blueprint.md#component-commitlist) | `src/webview/features/F01/CommitList.tsx` |
| `CommitListItem` | [F01 blueprint](../../features/F01_commit_log/blueprint.md#component-commitlistitem) | `src/webview/features/F01/CommitListItem.tsx` |
| `InfiniteScrollTrigger` | [F01 blueprint](../../features/F01_commit_log/blueprint.md#component-infinitescrolltrigger) | `src/webview/features/F01/InfiniteScrollTrigger.tsx` |
| `EmptyState` | [global_components](../../core/global_components.md#emptystate) | `src/webview/shared/components/EmptyState.tsx` |
| `LoadingState` | [global_components](../../core/global_components.md#loadingstate) | `src/webview/shared/components/LoadingState.tsx` |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) | `src/webview/shared/components/ErrorState.tsx` |

---

## Screen States

> 화면 상태 조건·UI 매핑과 인터랙션 흐름은 [F01_commit_log/blueprint.md](../../features/F01_commit_log/blueprint.md)의 State Model / Interaction Model이 유일한 출처다. S01은 F01 하나로만 구성된 화면이라 별도 문서를 두지 않는다.

---

## Responsive Rules

- 너비 < 320px: `CommitFilterPanel` 토글 방식으로 접기
- `CommitListItem`의 날짜·작성자는 좁은 너비에서 줄 바꿈 허용
