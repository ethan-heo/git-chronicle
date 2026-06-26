# Design Tokens

> VSCode Extension Webview는 VSCode 테마 CSS 변수를 직접 사용한다.
> 아래 토큰은 VSCode 변수를 의미적으로 매핑한 것이며, 커스텀 값을 하드코딩하지 않는다.

---

## Color Tokens

### Surface

| 토큰 이름 | VSCode 변수 | 설명 |
|----------|-------------|------|
| `color.surface.primary` | `var(--vscode-editor-background)` | 주요 콘텐츠 배경 |
| `color.surface.secondary` | `var(--vscode-sideBar-background)` | 사이드바·패널 배경 |
| `color.surface.elevated` | `var(--vscode-editorWidget-background)` | 드롭다운·다이얼로그 배경 |
| `color.surface.hover` | `var(--vscode-list-hoverBackground)` | 호버 시 배경 |
| `color.surface.selected` | `var(--vscode-list-activeSelectionBackground)` | 선택된 항목 배경 |

### Text

| 토큰 이름 | VSCode 변수 | 설명 |
|----------|-------------|------|
| `color.text.primary` | `var(--vscode-editor-foreground)` | 기본 텍스트 |
| `color.text.secondary` | `var(--vscode-descriptionForeground)` | 보조 텍스트, 날짜·작성자 등 |
| `color.text.disabled` | `var(--vscode-disabledForeground)` | 비활성 텍스트 |
| `color.text.link` | `var(--vscode-textLink-foreground)` | 링크·CTA 텍스트 |
| `color.text.onAccent` | `var(--vscode-button-foreground)` | 강조 버튼 위 텍스트 |

### Status (파일 상태 뱃지)

| 토큰 이름 | 값 | 설명 |
|----------|----|------|
| `color.status.added` | `var(--vscode-gitDecoration-addedResourceForeground)` | 추가(A) |
| `color.status.modified` | `var(--vscode-gitDecoration-modifiedResourceForeground)` | 수정(M) |
| `color.status.deleted` | `var(--vscode-gitDecoration-deletedResourceForeground)` | 삭제(D) |
| `color.status.renamed` | `var(--vscode-gitDecoration-renamedResourceForeground)` | 이름변경(R) |

### Diff (코드 뷰어)

| 토큰 이름 | VSCode 변수 | 설명 |
|----------|-------------|------|
| `color.diff.added` | `var(--vscode-diffEditor-insertedLineBackground)` | 추가 라인 배경 |
| `color.diff.removed` | `var(--vscode-diffEditor-removedLineBackground)` | 삭제 라인 배경 |

### Accent

| 토큰 이름 | VSCode 변수 | 설명 |
|----------|-------------|------|
| `color.accent.primary` | `var(--vscode-button-background)` | 주요 버튼 배경 |
| `color.accent.primaryHover` | `var(--vscode-button-hoverBackground)` | 주요 버튼 호버 배경 |

### Semantic

| 토큰 이름 | VSCode 변수 | 설명 |
|----------|-------------|------|
| `color.semantic.error` | `var(--vscode-errorForeground)` | 에러 메시지 |
| `color.semantic.warning` | `var(--vscode-editorWarning-foreground)` | 경고 메시지 |
| `color.semantic.info` | `var(--vscode-notificationsInfoIcon-foreground)` | 안내 메시지 |

---

## Typography Tokens

| 토큰 이름 | 값 | 설명 |
|----------|----|------|
| `font.family.base` | `var(--vscode-font-family)` | 기본 폰트 패밀리 |
| `font.family.mono` | `var(--vscode-editor-font-family)` | 코드·diff용 모노스페이스 |
| `font.size.xs` | `var(--vscode-font-size) * 0.75` ≈ `10px` | 뱃지·보조 레이블 |
| `font.size.sm` | `var(--vscode-font-size) * 0.875` ≈ `12px` | 보조 텍스트 |
| `font.size.base` | `var(--vscode-font-size)` ≈ `13px` | 기본 텍스트 |
| `font.size.md` | `var(--vscode-font-size) * 1.15` ≈ `15px` | 화면 제목 |
| `font.weight.regular` | `400` | 일반 텍스트 |
| `font.weight.medium` | `500` | 강조 텍스트 |
| `font.weight.bold` | `700` | 헤더·제목 |

---

## Spacing Tokens

| 토큰 이름 | 값 | 설명 |
|----------|----|------|
| `spacing.xs` | `4px` | 인라인 요소 간격 |
| `spacing.sm` | `8px` | 컴포넌트 내부 패딩 |
| `spacing.md` | `12px` | 컴포넌트 간 기본 간격 |
| `spacing.lg` | `16px` | 섹션 간 간격 |
| `spacing.xl` | `24px` | 주요 레이아웃 간격 |

---

## Border Tokens

| 토큰 이름 | VSCode 변수 | 설명 |
|----------|-------------|------|
| `border.color.default` | `var(--vscode-panel-border)` | 기본 테두리 |
| `border.radius.sm` | `3px` | 버튼·뱃지 |
| `border.radius.md` | `6px` | 카드·패널 |

---

## Motion Tokens

| 토큰 이름 | 값 | 설명 |
|----------|----|------|
| `motion.duration.fast` | `100ms` | 호버 전환 |
| `motion.duration.base` | `200ms` | 화면 내 상태 전환 |
| `motion.easing.default` | `ease-in-out` | 기본 이징 |
