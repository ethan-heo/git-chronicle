# Design Prompt: F02_ChangedFileTree

> Claude Design 또는 Figma AI에 직접 입력하여 디자인을 생성하는 프롬프트

---

## Product Context

GitRewind VSCode Extension의 Webview 패널. 사용자가 커밋을 선택하면 변경된 파일을 디렉토리 트리 형태로 확인하는 화면(S02_HistoryViewScreen)의 메인 기능.

---

## Design Goal

선택된 커밋의 변경 파일을 디렉토리 계층 트리로 표시하고, 각 파일에 호버 시 [코드 보기]/[AI 정리 보기] 액션 버튼을 노출하는 UI를 디자인한다. VSCode의 탐색기 패널과 유사한 트리 UI 패턴을 따르되, 파일 상태 뱃지(A/M/D/R)와 저장됨 뱃지가 추가된다.

---

## Information Architecture

```
S02_HistoryViewScreen
├─ TopHeader (커밋 메시지 + BackButton + ⚙)
├─ CommitActionBar (커밋 단위 액션 버튼 3개)
└─ FileTree (스크롤 영역)
    ├─ DirectoryNode (접기/펼치기)
    │   └─ FileTreeNode (호버 시 액션 노출)
    │       ├─ FileStatusBadge
    │       ├─ SavedBadge (조건부)
    │       └─ FileActionButtons (호버 시)
    └─ EmptyState / LoadingState / ErrorState
```

---

## Component Tree

- `TopHeader`: `{커밋 메시지}` + 좌측 BackButton + 우측 ⚙ 아이콘
- `CommitActionBar`: 상단에 [커밋 AI 정리] [전체 파일 AI 정리] [캔버스 보기] 버튼 3개
- `DirectoryNode`: 화살표(▶/▼) + 폴더명. 클릭 시 펼침/접힘
- `FileTreeNode`: `FileStatusBadge` + 파일명 + `SavedBadge`(조건부) + `FileActionButtons`(호버 시)
- `FileStatusBadge`: `A`(추가) / `M`(수정) / `D`(삭제) / `R`(이름변경) 레터 + 색상
- `SavedBadge`: "AI 요약됨" 텍스트 뱃지 (AI 정리 저장본 있을 때)
- `FileActionButtons`: [코드 보기] [AI 정리 보기] 두 개 버튼 (호버 시만 표시)

---

## Interactions

| 트리거 | 동작 |
|--------|------|
| `FileTreeNode` 호버 | `FileActionButtons` 노출 + 배경색 변경 |
| `FileTreeNode` 호버 해제 | `FileActionButtons` 숨김 |
| [코드 보기] 클릭 | S03 코드 뷰어로 전환 |
| [AI 정리 보기] 클릭 | S04 AI 정리 뷰어로 전환 |
| `DirectoryNode` 클릭 | 펼침/접힘 토글 |
| [커밋 AI 정리] 클릭 | S04 커밋 전체 요약 |
| [전체 파일 AI 정리] 클릭 | F08 일괄 생성 시작 |
| [캔버스 보기] 클릭 | S05 캔버스로 전환 |
| BackButton 클릭 | S01로 복귀 |

---

## States

### FileTreeNode
- `default`: 기본 행 (FileStatusBadge + 파일명 + 조건부 SavedBadge)
- `hover`: `FileActionButtons` 노출 + `color.surface.hover` 배경

### DirectoryNode
- `expanded`: 하위 항목 표시 (▼ 아이콘)
- `collapsed`: 하위 항목 숨김 (▶ 아이콘)

### CommitActionBar
- `default`: 버튼 3개 모두 활성
- `batchRunning`: [전체 파일 AI 정리] 버튼 비활성화 (배치 진행 중)

### FileTree
- `loading`: `LoadingState`
- `empty`: `EmptyState` "변경된 파일이 없습니다"
- `populated`: 트리 표시
- `error`: `ErrorState`

---

## Visual Guidance

- 트리 들여쓰기: `spacing.md` (12px) per depth
- `FileStatusBadge`: 작은 정사각형 뱃지, 상태별 색상 (추가=초록, 수정=파랑, 삭제=빨강, 이름변경=주황)
- `SavedBadge`: 작은 텍스트 "AI 요약됨" — `color.semantic.info` 색상, `font.size.xs`
- `FileActionButtons`: 호버 시 파일명 오른쪽에 나타나는 소형 버튼 두 개 (회색 배경)
- `CommitActionBar`는 `FileTree`와 구분을 위해 하단 border-bottom 1px
- 폰트: 기본 파일명 `font.size.base`, 경로 구분자 `color.text.secondary`

---

## Responsive Rules

- `CommitActionBar`의 버튼 레이블: 너비 < 340px에서 아이콘만 표시 + tooltip
- `FileTreeNode`의 긴 파일명은 truncate + hover 시 전체 경로 tooltip

---

## Naming Rules (Figma)

```
S02_HistoryViewScreen
├─ TopHeader
├─ CommitActionBar [default]
├─ CommitActionBar [batchRunning]
└─ FileTree
    ├─ DirectoryNode [expanded]
    ├─ DirectoryNode [collapsed]
    ├─ FileTreeNode [default]
    └─ FileTreeNode [hover]
        ├─ FileStatusBadge [A]
        ├─ FileStatusBadge [M]
        ├─ FileStatusBadge [D]
        ├─ FileStatusBadge [R]
        ├─ SavedBadge
        └─ FileActionButtons
```

---

## MCP Rules

- `CommitActionBar`는 독립 Frame (상단 고정)
- `FileTree`는 독립 Frame (스크롤 영역)
- `FileTreeNode`는 재사용 Component (default/hover Variant)
- `DirectoryNode`는 재사용 Component (expanded/collapsed Variant)
- `FileStatusBadge`는 전역 Component (A/M/D/R Variant)
- Auto Layout 필수 — 모든 트리 노드에 Vertical Auto Layout

---

## References

- [F02 spec.md](./spec.md)
- [F02 blueprint.md](./blueprint.md)
- [global_components.md](../../core/global_components.md)
- [design_tokens.md](../../core/design_tokens.md)
