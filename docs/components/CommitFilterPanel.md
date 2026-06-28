# Component: CommitFilterPanel

S01_CommitListScreen의 필터 영역. 기간(날짜 범위)·작성자·포함/제외 키워드·정렬 순서를 제공하며, 조건은 AND로 고정 조합된다.

---

## Props

```typescript
interface CommitFilterPanelProps {
  dateStart: string | null;
  dateEnd: string | null;
  author: string | null;
  keyword: string;
  excludeKeyword: string;
  sortOrder: 'desc' | 'asc';
  authorList: string[];
  onDateStartChange: (date: string | null) => void;
  onDateEndChange: (date: string | null) => void;
  onAuthorChange: (author: string | null) => void;
  onKeywordChange: (keyword: string) => void;
  onExcludeKeywordChange: (keyword: string) => void;
  onSortOrderChange: (sortOrder: 'desc' | 'asc') => void;
}
```

---

## 하위 컴포넌트

```
CommitFilterPanel
├── DateRangeFilter
│   ├── <input type="date" /> (시작일)
│   └── <input type="date" /> (종료일)
├── AuthorDropdown
│   └── <select> / <datalist> (작성자 선택)
├── KeywordSearchInput
│   └── <input type="text" /> (커밋 메시지 포함 키워드, 300ms 디바운싱)
├── SortOrderToggle
│   └── 최신순/오래된순 전환 버튼
└── KeywordSearchInput
    └── <input type="text" /> (커밋 메시지 제외 키워드, 300ms 디바운싱)
```

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 날짜 필터 | `<input type="date">` × 2 (시작일 / 종료일). `--after` / `--before` git 옵션으로 변환 |
| 작성자 필터 | 드롭다운 자동완성. `authorList` prop에서 선택지 렌더링 |
| 포함 키워드 | `--grep` git 옵션. 입력 후 300ms 디바운싱 후 콜백 호출 |
| 제외 키워드 | 쉼표 구분 문자열을 Extension Host에서 후처리 필터로 적용 |
| 정렬 순서 | `desc` 기본값, `asc`일 때 `--reverse` git 옵션 사용 |
| 조합 방식 | AND 고정 (세 조건 동시 적용) |
| 초기화 | 각 필드 독립적으로 초기화 가능 |
| 상태 복원 | 필터 변경/초기화 시 Zustand 액션이 VSCode Webview State에 필터 값만 동기화 |

---

## States

| 상태 | 조건 | 동작 |
|------|------|------|
| `idle` | 필터 미적용 | 기본 입력창 표시 |
| `active` | 하나 이상 필터 적용 | 해당 필드 강조 표시 |
| `collapsed` | 좁은 패널 너비 (< 320px) | 토글 버튼으로 접힘/펼침 |

---

## Persistence

`CommitFilterPanel` 자체는 저장소 API를 직접 호출하지 않는다. S01에서 전달받은 `onFilterChange` / `onClearFilters` 콜백이 `useAppStore`의 `setFilter` / `clearFilters`로 연결되고, 스토어 액션이 다음 작업을 함께 수행한다.

- Zustand 필터 상태 업데이트
- VSCode Webview State에 `{ filter }` 저장
- 커밋 목록 첫 페이지부터 재로드
- 커밋 목록 스크롤 위치를 0으로 초기화

따라서 패널 숨김으로 Webview 런타임이 재생성되어도 S01 마운트 시 복원된 필터 값이 입력 UI에 다시 표시된다.

---

## Accessibility

- 날짜 입력창에 `aria-label="시작일"` / `aria-label="종료일"` 명시.
- 작성자 드롭다운에 `aria-label="작성자 필터"` 명시.
- 키워드 입력창에 `aria-label="커밋 메시지 포함 키워드"` / `aria-label="커밋 메시지 제외 키워드"` 명시.
- Tab 키로 세 필드 간 이동 가능.

---

## References

- [F01_CommitLog spec.md](../features/F01_commit_log/spec.md)
- [S01_CommitListScreen blueprint.md](../screens/S01_commit_list/blueprint.md)
- [useDebounce.ts](../project/directory_structure.md)
