# Component: CommitFilterPanel

S01_CommitListScreen의 필터 영역. 기간(날짜 범위)·작성자·키워드 세 가지 조건을 제공하며, 조건은 AND로 고정 조합된다.

---

## Props

```typescript
interface CommitFilterPanelProps {
  dateStart: string | null;
  dateEnd: string | null;
  author: string | null;
  keyword: string;
  authorList: string[];
  onDateStartChange: (date: string | null) => void;
  onDateEndChange: (date: string | null) => void;
  onAuthorChange: (author: string | null) => void;
  onKeywordChange: (keyword: string) => void;
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
└── KeywordSearchInput
    └── <input type="text" /> (커밋 메시지 키워드, 300ms 디바운싱)
```

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 날짜 필터 | `<input type="date">` × 2 (시작일 / 종료일). `--after` / `--before` git 옵션으로 변환 |
| 작성자 필터 | 드롭다운 자동완성. `authorList` prop에서 선택지 렌더링 |
| 키워드 필터 | `--grep` git 옵션. 입력 후 300ms 디바운싱 후 콜백 호출 |
| 조합 방식 | AND 고정 (세 조건 동시 적용) |
| 초기화 | 각 필드 독립적으로 초기화 가능 |

---

## States

| 상태 | 조건 | 동작 |
|------|------|------|
| `idle` | 필터 미적용 | 기본 입력창 표시 |
| `active` | 하나 이상 필터 적용 | 해당 필드 강조 표시 |
| `collapsed` | 좁은 패널 너비 (< 320px) | 토글 버튼으로 접힘/펼침 |

---

## Accessibility

- 날짜 입력창에 `aria-label="시작일"` / `aria-label="종료일"` 명시.
- 작성자 드롭다운에 `aria-label="작성자 필터"` 명시.
- 키워드 입력창에 `aria-label="커밋 메시지 키워드"` 명시.
- Tab 키로 세 필드 간 이동 가능.

---

## References

- [F01_CommitLog spec.md](../features/F01_commit_log/spec.md)
- [S01_CommitListScreen blueprint.md](../screens/S01_commit_list/blueprint.md)
- [useDebounce.ts](../project/directory_structure.md)
