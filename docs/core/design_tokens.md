# Design Tokens

> **요약:** 색상·타이포그래피·간격·테두리·모션 등 VSCode 테마 기반 디자인 토큰 전체 목록과 Tailwind/CSS 변수 매핑을 정의한다. 하드코딩 대신 참조할 토큰을 찾을 때 확인한다.

> VSCode Extension Webview는 VSCode 테마 CSS 변수를 직접 사용한다.
> 아래 토큰은 VSCode 변수를 의미적으로 매핑한 것이며, 커스텀 색상값을 기능 코드에 하드코딩하지 않는다.

---

## Implementation

디자인 토큰은 두 레이어로 관리한다.

| 레이어 | 파일 | 역할 |
|--------|------|------|
| Tailwind 테마 토큰 | `src/webview/global.css` | `@theme inline`으로 VSCode 테마 변수를 Tailwind 유틸리티 토큰(`bg-panel`, `text-muted`, `border-line`)에 매핑 |
| Legacy CSS alias | `src/webview/global.css` | 기존 인라인 스타일 및 일부 예외 CSS 호환을 위해 `--gae-*` 의미 토큰 alias 유지 |
| TypeScript 상수 | `src/webview/shared/design/tokens.ts` | 컴포넌트에서 인라인 스타일이 필요할 때 `--gae-*` alias를 타입 안전하게 참조 |

기능/컴포넌트 코드는 가능한 한 Tailwind 토큰 유틸리티를 사용하고, 동적 인라인 스타일이나 예외 CSS에서만 `--gae-*` alias 또는 `tokens.ts`를 사용한다.

```css
@theme inline {
  --color-surface: var(--vscode-editor-background, #1e1e1e);
  --color-text: var(--vscode-editor-foreground, #d4d4d4);
  --color-accent: var(--vscode-button-background, #0e639c);
}

:root {
  --gae-color-surface-primary: var(--color-surface);
  --gae-color-text-primary: var(--color-text);
  --gae-color-accent-primary: var(--color-accent);
}
```

예시:

- `bg-surface`, `bg-panel`, `text-text`, `text-muted`, `border-line`
- `font-mono`, `rounded-md`

---

## Color Tokens

### Surface

| 토큰 이름 | CSS 변수 | VSCode 변수 | 설명 |
|----------|----------|-------------|------|
| `color.surface.primary` | `--gae-color-surface-primary` | `var(--vscode-editor-background)` | 주요 콘텐츠 배경 |
| `color.surface.secondary` | `--gae-color-surface-secondary` | `var(--vscode-sideBar-background)` | 사이드바·패널 배경 |
| `color.surface.elevated` | `--gae-color-surface-elevated` | `var(--vscode-editorWidget-background)` | 드롭다운·다이얼로그 배경 |
| `color.surface.hover` | `--gae-color-surface-hover` | `var(--vscode-list-hoverBackground)` | 호버 시 배경 |
| `color.surface.selected` | `--gae-color-surface-selected` | `var(--vscode-list-activeSelectionBackground)` | 선택된 항목 배경 |

### Text

| 토큰 이름 | CSS 변수 | VSCode 변수 | 설명 |
|----------|----------|-------------|------|
| `color.text.primary` | `--gae-color-text-primary` | `var(--vscode-editor-foreground)` | 기본 텍스트 |
| `color.text.secondary` | `--gae-color-text-secondary` | `var(--vscode-descriptionForeground)` | 보조 텍스트, 날짜·작성자 등 |
| `color.text.disabled` | `--gae-color-text-disabled` | `var(--vscode-disabledForeground)` | 비활성 텍스트 |
| `color.text.link` | `--gae-color-text-link` | `var(--vscode-textLink-foreground)` | 링크·CTA 텍스트 |
| `color.text.onAccent` | `--gae-color-text-on-accent` | `var(--vscode-button-foreground)` | 강조 버튼 위 텍스트 |

### Status (파일 상태 뱃지)

| 토큰 이름 | CSS 변수 | VSCode 변수 | 설명 |
|----------|----------|-------------|------|
| `color.status.added` | `--gae-color-status-added` | `var(--vscode-gitDecoration-addedResourceForeground)` | 추가(A) |
| `color.status.modified` | `--gae-color-status-modified` | `var(--vscode-gitDecoration-modifiedResourceForeground)` | 수정(M) |
| `color.status.deleted` | `--gae-color-status-deleted` | `var(--vscode-gitDecoration-deletedResourceForeground)` | 삭제(D) |
| `color.status.renamed` | `--gae-color-status-renamed` | `var(--vscode-gitDecoration-renamedResourceForeground)` | 이름변경(R) |

### Diff (코드 뷰어)

| 토큰 이름 | CSS 변수 | VSCode 변수 | 설명 |
|----------|----------|-------------|------|
| `color.diff.added` | `--gae-color-diff-added` | `var(--vscode-diffEditor-insertedLineBackground)` | 추가 라인 배경 |
| `color.diff.removed` | `--gae-color-diff-removed` | `var(--vscode-diffEditor-removedLineBackground)` | 삭제 라인 배경 |

### Accent

| 토큰 이름 | CSS 변수 | VSCode 변수 | 설명 |
|----------|----------|-------------|------|
| `color.accent.primary` | `--gae-color-accent-primary` | `var(--vscode-button-background)` | 주요 버튼 배경 |
| `color.accent.primaryHover` | `--gae-color-accent-primary-hover` | `var(--vscode-button-hoverBackground)` | 주요 버튼 호버 배경 |
| `color.accent.secondary` | `--gae-color-accent-secondary` | `var(--vscode-button-secondaryBackground)` | 보조 버튼 배경 |
| `color.accent.secondaryHover` | `--gae-color-accent-secondary-hover` | `var(--vscode-button-secondaryHoverBackground)` | 보조 버튼 호버 배경 |

### Semantic

| 토큰 이름 | CSS 변수 | VSCode 변수 | 설명 |
|----------|----------|-------------|------|
| `color.semantic.error` | `--gae-color-semantic-error` | `var(--vscode-errorForeground)` | 에러 메시지 |
| `color.semantic.warning` | `--gae-color-semantic-warning` | `var(--vscode-editorWarning-foreground)` | 경고 메시지 |
| `color.semantic.info` | `--gae-color-semantic-info` | `var(--vscode-notificationsInfoIcon-foreground)` | 안내 메시지 |

### Symbol (F10 파일 내부 심볼 캔버스 전용)

VSCode 테마 변수 매핑 없이 고정 색상값을 사용한다. 실제 정의는 `src/webview/global.css`가 유일한 진실이다.

| 토큰 이름 | CSS 변수 | 값 | 설명 |
|----------|----------|-----|------|
| `color.symbol.highlight` | `--gae-color-symbol-highlight` | `#ffd166` | 호버 시 강조 엣지 |
| `color.symbol.default` | `--gae-color-symbol-default` | `#ffffff` | 기본 텍스트 |
| `color.symbol.dimmed` | `--gae-color-symbol-dimmed` | `#5f6b7a` | 비연결 엣지 감쇠 |
| `color.symbol.edge.calls` | `--gae-color-symbol-calls` | `#4ea8ff` | `calls` 엣지 |
| `color.symbol.edge.uses` | `--gae-color-symbol-uses` | `#9b8fff` | `uses` 엣지 |
| `color.symbol.edge.extends` | `--gae-color-symbol-extends` | `#4caf72` | `extends` 엣지 |
| `color.symbol.edge.implements` | `--gae-color-symbol-implements` | `#26b7b7` | `implements` 엣지 |
| `color.symbol.kind.function` | `--gae-color-symbol-function` | `#4b93ff` | `SymbolKindBadge` fn |
| `color.symbol.kind.class` | `--gae-color-symbol-class` | `#4caf72` | `SymbolKindBadge` cls |
| `color.symbol.kind.interface` | `--gae-color-symbol-interface` | `#26b7b7` | `SymbolKindBadge` ifc |
| `color.symbol.kind.type` | `--gae-color-symbol-type` | `#7d61d6` | `SymbolKindBadge` typ |
| `color.symbol.kind.variable` | `--gae-color-symbol-variable` | `#77808f` | `SymbolKindBadge` var |
| `color.symbol.kind.constant` | `--gae-color-symbol-constant` | `#f08a24` | `SymbolKindBadge` cst |
| `color.symbol.kind.enum` | `--gae-color-symbol-enum` | `#d85aa0` | `SymbolKindBadge` enm |
| `color.symbol.kind.import` | `--gae-color-symbol-imp` | `#7d8794` | `SymbolKindBadge` imp |

> F10 관련 문서(`features/F10_.../blueprint.md`)에 `--color-symbol-fn` 등으로 표기된 부분은 실제 CSS 변수명(`--gae-color-symbol-function` 등)과 다르다. 실제 변수명은 이 토큰 표와 `src/webview/global.css`를 기준으로 한다.

---

## Typography Tokens

| 토큰 이름 | CSS 변수 | 값 | 설명 |
|----------|----------|----|------|
| `font.family.base` | `--gae-font-family-base` | `var(--vscode-font-family)` | 기본 폰트 패밀리 |
| `font.family.mono` | `--gae-font-family-mono` | `var(--vscode-editor-font-family)` | 코드·diff용 모노스페이스 |
| `font.size.xs` | `--gae-font-size-xs` | `10px` | 뱃지·보조 레이블 |
| `font.size.sm` | `--gae-font-size-sm` | `12px` | 보조 텍스트 |
| `font.size.base` | `--gae-font-size-base` | `var(--vscode-font-size)` ≈ `13px` | 기본 텍스트 |
| `font.size.md` | `--gae-font-size-md` | `15px` | 화면 제목 |
| `font.weight.regular` | `--gae-font-weight-regular` | `400` | 일반 텍스트 |
| `font.weight.medium` | `--gae-font-weight-medium` | `500` | 강조 텍스트 |
| `font.weight.bold` | `--gae-font-weight-bold` | `700` | 헤더·제목 |

---

## Spacing Tokens

| 토큰 이름 | CSS 변수 | 값 | 설명 |
|----------|----------|----|------|
| `spacing.xs` | `--gae-spacing-xs` | `4px` | 인라인 요소 간격 |
| `spacing.sm` | `--gae-spacing-sm` | `8px` | 컴포넌트 내부 패딩 |
| `spacing.md` | `--gae-spacing-md` | `12px` | 컴포넌트 간 기본 간격 |
| `spacing.lg` | `--gae-spacing-lg` | `16px` | 섹션 간 간격 |
| `spacing.xl` | `--gae-spacing-xl` | `24px` | 주요 레이아웃 간격 |

---

## Border Tokens

| 토큰 이름 | CSS 변수 | 값 | 설명 |
|----------|----------|----|------|
| `border.color.default` | `--gae-border-color-default` | `var(--vscode-panel-border)` | 기본 테두리 |
| `border.color.focus` | `--gae-border-color-focus` | `var(--vscode-focusBorder)` | 키보드 포커스 테두리 |
| `border.radius.sm` | `--gae-border-radius-sm` | `3px` | 버튼·뱃지 |
| `border.radius.md` | `--gae-border-radius-md` | `6px` | 카드·패널 |
| `border.radius.round` | `--gae-border-radius-round` | `999px` | 원형·pill 형태 |

---

## Motion Tokens

| 토큰 이름 | CSS 변수 | 값 | 설명 |
|----------|----------|----|------|
| `motion.duration.fast` | `--gae-motion-duration-fast` | `100ms` | 호버 전환 |
| `motion.duration.base` | `--gae-motion-duration-base` | `200ms` | 화면 내 상태 전환 |
| `motion.easing.default` | `--gae-motion-easing-default` | `ease-in-out` | 기본 이징 |
