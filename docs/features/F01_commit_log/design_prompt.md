# Design Prompt: F01_CommitLog

> Claude Design 또는 Figma AI에 직접 입력하여 디자인을 생성하는 프롬프트

---

## Product Context

Git Author Explorer는 VSCode Extension의 Webview 패널 기반 SPA다. VSCode 테마 CSS 변수를 사용하므로 라이트/다크 테마를 별도로 구현하지 않는다. 패널 너비는 280px~600px 사이로 가변적이다.

---

## Design Goal

커밋 이력 목록을 기간·작성자·키워드 기준으로 필터링하고, 원하는 커밋을 클릭하여 상세 이력으로 진입하는 화면(S01_CommitListScreen)을 디자인한다. VSCode의 파일 탐색기와 유사한 밀도감(IDE-like density)을 가져야 하며, 필터 패널이 목록을 방해하지 않아야 한다.

---

## Information Architecture

```
S01_CommitListScreen
├─ TopHeader (설정 아이콘 포함)
├─ CommitFilterPanel (상단 고정)
│   ├─ DateRangeFilter (날짜 범위)
│   ├─ AuthorDropdown (작성자 선택)
│   └─ KeywordSearchInput (키워드 입력)
└─ CommitList (스크롤 영역)
    ├─ CommitListItem × N
    └─ EmptyState / LoadingState / ErrorState
```

---

## Component Tree

- `TopHeader`: 화면 제목 "Git Author Explorer" + 우측 상단 ⚙ 아이콘
- `CommitFilterPanel`: 세 개의 필터를 세로로 배치한 패널
  - `DateRangeFilter`: 시작일/종료일 두 개의 날짜 입력
  - `AuthorDropdown`: 작성자 선택 드롭다운
  - `KeywordSearchInput`: 커밋 메시지 키워드 검색 입력창 (×) 버튼 포함
- `CommitListItem`: 커밋 해시(짧게) / 메시지 / 작성자 / 날짜 표시
- `EmptyState`: 조건에 따라 다른 메시지 + 선택적 CTA 버튼
- `LoadingState`: 스피너

---

## Interactions

| 트리거 | 동작 |
|--------|------|
| `CommitListItem` 호버 | 배경색 변경 (`color.surface.hover`) |
| `CommitListItem` 클릭 | S02로 화면 전환 |
| `KeywordSearchInput` 입력 | 300ms 디바운스 후 목록 필터링 |
| 스크롤 하단 도달 | 다음 200개 커밋 추가 로드 |
| ⚙ 아이콘 클릭 | S06 설정 화면으로 전환 |

---

## States

### CommitListItem
- `default`: 기본 행 표시
- `hover`: `color.surface.hover` 배경

### CommitList
- `loading`: `LoadingState` (화면 중앙)
- `empty.noRepo`: `EmptyState` "Git 저장소가 감지되지 않았습니다" + "레포 열기" CTA
- `empty.noCommits`: `EmptyState` "커밋 이력이 없습니다"
- `empty.noResults`: `EmptyState` "조건에 맞는 커밋이 없습니다"
- `populated`: 커밋 목록 표시
- `loadingMore`: 목록 하단 추가 스피너

### CommitFilterPanel
- `default`: 필터 값 없음 (회색 placholder)
- `active`: 필터 적용 중 (시각적 강조)

---

## Visual Guidance

- 전체 배경: `var(--vscode-sideBar-background)`
- 텍스트: `var(--vscode-editor-foreground)` (메인), `var(--vscode-descriptionForeground)` (날짜·작성자)
- 호버: `var(--vscode-list-hoverBackground)`
- 필터 패널은 목록과 구분을 위해 하단 border-bottom 1px
- `CommitListItem`은 좌우 padding 8px, 상하 padding 4px (밀도감)
- 커밋 메시지는 한 줄로 truncate, 해시는 7자리로 표시
- 날짜/작성자는 `font.size.sm` (`var(--vscode-descriptionForeground)`)
- `DateRangeFilter`의 두 날짜 입력은 나란히 배치 (or 위아래)
- 키워드 검색 입력창은 전체 너비 사용

---

## Responsive Rules

- 너비 < 320px: `CommitFilterPanel`을 토글 방식으로 접기 가능
- `CommitListItem`의 날짜·작성자는 좁은 너비에서 두 번째 줄로 줄 바꿈 허용

---

## Naming Rules (Figma)

```
S01_CommitListScreen
├─ TopHeader
├─ CommitFilterPanel [default]
├─ CommitFilterPanel [active]
├─ CommitList
│   ├─ CommitListItem [default]
│   ├─ CommitListItem [hover]
│   ├─ LoadingState [lg]
│   ├─ EmptyState [noRepo]
│   ├─ EmptyState [noCommits]
│   └─ EmptyState [noResults]
```

---

## MCP Rules

- `S01_CommitListScreen`은 최상위 Frame
- `TopHeader`는 독립 Component (모든 화면에서 재사용)
- `CommitFilterPanel`은 독립 Frame (상단 고정)
- `CommitList`는 독립 Frame (스크롤 영역)
- `CommitListItem`은 재사용 Component (default/hover Variant)
- Auto Layout 사용. 수동 배치 금지.

---

## References

- [F01 spec.md](./spec.md)
- [F01 blueprint.md](./blueprint.md)
- [design_tokens.md](../../core/design_tokens.md)
- [global_components.md](../../core/global_components.md)
