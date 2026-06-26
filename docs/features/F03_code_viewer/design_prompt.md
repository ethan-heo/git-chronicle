# Design Prompt: F03_CodeViewer

> Claude Design 또는 Figma AI에 직접 입력하여 디자인을 생성하는 프롬프트

---

## Product Context

Git Author Explorer VSCode Extension. 파일 트리(S02) 또는 캔버스(S05)에서 [코드 보기]를 클릭하면 진입하는 S03_CodeViewerScreen. 읽기 전용 diff 뷰어.

---

## Design Goal

Git unified diff를 Shiki 신텍스 하이라이팅과 함께 표시하는 코드 뷰어 화면을 디자인한다. VSCode의 내장 diff 에디터에서 영감을 받되, 단일 컬럼 unified diff (split 아님)로 표시한다. 라인 번호 + 변경 타입(+/-) + 코드 내용이 한 행을 이룬다.

---

## Information Architecture

```
S03_CodeViewerScreen
├─ TopHeader ({커밋 메시지} > {파일 경로} + BackButton + ⚙)
└─ DiffViewer (가로/세로 스크롤 영역)
    ├─ DeletedFileNotice (조건부, 삭제된 파일)
    └─ DiffLine × N
       OR BinaryFileNotice
```

---

## Component Tree

- `TopHeader`: `{커밋 메시지} > {파일 경로}` breadcrumb + BackButton + ⚙
- `DiffViewer`: 전체 스크롤 가능 코드 영역
  - `DeletedFileNotice`: 상단 배너 "삭제된 파일입니다"
  - `DiffLine [added]`: `+` 접두사, 초록 배경
  - `DiffLine [removed]`: `-` 접두사, 빨간 배경
  - `DiffLine [context]`: ` ` 접두사, 기본 배경
  - `BinaryFileNotice`: "Binary file — diff를 표시할 수 없습니다"

---

## Interactions

| 트리거 | 동작 |
|--------|------|
| 세로 스크롤 | diff 내용 탐색 |
| 가로 스크롤 | 긴 라인 탐색 |
| BackButton 클릭 | 이전 화면으로 복귀 |
| ⚙ 클릭 | S06 설정 화면 |

---

## States

### DiffViewer
- `loading`: `LoadingState` (diff 로드 중)
- `populated`: `DiffLine` 목록 표시
- `binary`: `BinaryFileNotice`
- `deleted`: `DeletedFileNotice` + 삭제 전 코드 표시
- `error`: `ErrorState`

### DiffLine
- `added`: 연초록 배경 (`var(--vscode-diffEditor-insertedLineBackground)`) + `+` 접두사
- `removed`: 연빨강 배경 (`var(--vscode-diffEditor-removedLineBackground)`) + `-` 접두사
- `context`: 기본 배경 + ` ` 접두사

---

## Visual Guidance

- 폰트: `var(--vscode-editor-font-family)` 모노스페이스, `var(--vscode-editor-font-size)`
- 라인 번호 컬럼: 고정 너비 (before/after 각각), `color.text.secondary` 색상
- `+`/`-` 접두사: 라인 번호 오른쪽, 1문자 고정 너비
- 코드 내용: Shiki 신텍스 하이라이팅 적용 (언어별 토큰 색상)
- 변경 라인의 배경 색상은 라인 전체 폭으로 적용 (padding 없이)
- `DeletedFileNotice`는 주황색/경고 스타일 배너
- `BinaryFileNotice`는 회색 정보 배너
- 전체 배경: `var(--vscode-editor-background)`

---

## Responsive Rules

- 가로 스크롤: 긴 코드 라인이 잘리지 않도록 horizontal scroll 허용
- 너비 < 320px: 라인 번호 컬럼 숨기기 가능

---

## Naming Rules (Figma)

```
S03_CodeViewerScreen
├─ TopHeader
└─ DiffViewer [populated]
│   ├─ DeletedFileNotice
│   ├─ DiffLine [added]
│   ├─ DiffLine [removed]
│   └─ DiffLine [context]
├─ DiffViewer [binary]
│   └─ BinaryFileNotice
├─ LoadingState [lg]
└─ ErrorState
```

---

## MCP Rules

- `DiffViewer`는 독립 Frame (스크롤 영역)
- `DiffLine`은 재사용 Component (added/removed/context Variant)
- `DeletedFileNotice`는 독립 Component
- `BinaryFileNotice`는 독립 Component
- `DiffLine`은 Horizontal Auto Layout (라인 번호 + 접두사 + 코드)
- 라인 번호 컬럼은 Fixed 너비 (Hug 금지)

---

## References

- [F03 spec.md](./spec.md)
- [F03 blueprint.md](./blueprint.md)
- [design_tokens.md](../../core/design_tokens.md)
