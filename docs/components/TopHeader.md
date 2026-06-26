# Component: TopHeader

모든 화면의 상단 헤더. 화면 제목 또는 컨텍스트 경로(breadcrumb), 뒤로가기 버튼, 설정 아이콘을 포함한다.

---

## Props

```typescript
interface TopHeaderProps {
  title: string;                    // 화면 제목 또는 breadcrumb 경로
  showBackButton?: boolean;         // 기본값: false
  showSettingsIcon?: boolean;       // 기본값: true
  onBackClick?: () => void;         // showBackButton === true 시 필수
  onSettingsClick?: () => void;     // S06 진입 콜백
}
```

---

## Usage Per Screen

| 화면 | title 예시 | showBackButton | showSettingsIcon |
|------|-----------|---------------|-----------------|
| S01 | `"Git Author Explorer"` | false | true |
| S02 | `"{커밋 메시지}"` | true | true |
| S03 | `"{커밋 메시지} > {파일 경로}"` | true | true |
| S04 | `"{커밋 메시지} > {파일 경로}"` 또는 `"{커밋 메시지} > 커밋 전체 요약"` | true | true |
| S05 | `"{커밋 메시지}"` | true | true |
| S06 | `"설정"` | true | false |

---

## Implementation

```tsx
export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  showBackButton = false,
  showSettingsIcon = true,
  onBackClick,
  onSettingsClick,
}) => (
  <header className="top-header" role="banner">
    {showBackButton && (
      <BackButton onClick={onBackClick!} />
    )}
    <h1 className="top-header-title" title={title}>
      {title}
    </h1>
    {showSettingsIcon && (
      <button
        className="top-header-settings-btn"
        onClick={onSettingsClick}
        aria-label="설정 열기"
      >
        ⚙
      </button>
    )}
  </header>
);
```

---

## CSS

```css
.top-header {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 8px;
  border-bottom: 1px solid var(--vscode-panel-border);
  background: var(--vscode-editor-background);
  position: sticky;
  top: 0;
  z-index: 10;
}
.top-header-title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--vscode-editor-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}
.top-header-settings-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--vscode-descriptionForeground);
  font-size: 16px;
  padding: 4px;
}
```

---

## Variants

- `TopHeader [S01]`: 뒤로가기 없음, 설정 아이콘 있음
- `TopHeader [subscreen]`: 뒤로가기 있음, 설정 아이콘 있음
- `TopHeader [settings]`: 뒤로가기 있음, 설정 아이콘 없음

---

## Accessibility

- `role="banner"`, `<h1>` 사용
- 설정 버튼: `aria-label="설정 열기"`
- title overflow 시 tooltip(`title` attribute)으로 전체 경로 확인 가능

---

## References

- [global_components.md](../core/global_components.md#topheader)
- [BackButton.md](./BackButton.md)
