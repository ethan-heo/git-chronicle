# Component: TopHeader

모든 화면의 상단 헤더. 화면 제목 또는 컨텍스트 경로(breadcrumb), 뒤로가기 버튼, 우측 액션 슬롯, 설정 아이콘을 포함한다.

---

## Props

```typescript
interface TopHeaderProps {
  title: string;                    // 화면 제목 또는 breadcrumb 경로
  context?: string;                 // 제목 아래 보조 컨텍스트
  showBackButton?: boolean;         // 기본값: false
  endSlot?: React.ReactNode;        // 우측 액션 슬롯
  showSettingsIcon?: boolean;       // 기본값: false
  onBackClick?: () => void;         // showBackButton === true 시 필수
  onSettingsClick?: () => void;     // S06 진입 콜백
}
```

---

## Usage Per Screen

| 화면 | title 예시 | showBackButton | showSettingsIcon |
|------|-----------|---------------|-----------------|
| S01 | `"GitRewind"` | false | true |
| S02 | `"{커밋 메시지}"` | true | true |
| S03 | `"{커밋 메시지} > {파일 경로}"` | true | true |
| S04 | `"{커밋 메시지} > {파일 경로}"` 또는 `"{커밋 메시지} > 커밋 전체 요약"` | true | true |
| S07 | `"{shortHash} > {filePath} · 분할 보기"` | true | true |
| S05 | `"{커밋 메시지}"` | true | true |
| S06 | `"설정"` | true | false |

---

## Implementation

```tsx
export const TopHeader: React.FC<TopHeaderProps> = ({
  title,
  context,
  showBackButton = false,
  showSettingsIcon = false,
  onBackClick,
  onSettingsClick,
}) => (
  <header className="top-header">
    <div className="top-header-leading">
      {showBackButton && onBackClick && (
        <BackButton onClick={onBackClick} />
      )}
      <div className="top-header-title-group">
        <h1>{title}</h1>
        {context ? <p>{context}</p> : null}
      </div>
    </div>
    <div className="top-header-actions">
      {endSlot}
      {showSettingsIcon && (
        <button
          className="top-header-icon-button"
          onClick={onSettingsClick}
          aria-label="설정 열기"
        >
          ...
        </button>
      )}
    </div>
  </header>
);
```

---

## CSS

```css
.top-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gae-spacing-lg);
  padding: var(--gae-spacing-md) var(--gae-spacing-xl);
  border-bottom: 1px solid var(--gae-border-color-default);
  background: var(--gae-color-surface-secondary);
  position: sticky;
  top: 0;
  z-index: 10;
}
.top-header-title-group h1 {
  margin: 0;
  font-size: var(--gae-font-size-md);
  font-weight: var(--gae-font-weight-bold);
  color: var(--gae-color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.top-header-icon-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--gae-color-text-secondary);
  width: 28px;
  height: 28px;
}

.top-header-actions {
  display: flex;
  align-items: center;
  gap: var(--gae-spacing-xs);
  margin-left: auto;
}
```

---

## Variants

- `TopHeader [S01]`: 뒤로가기 없음, 설정 아이콘 있음
- `TopHeader [subscreen]`: 뒤로가기 있음, 설정 아이콘 있음
- `TopHeader [settings]`: 뒤로가기 있음, 설정 아이콘 없음

---

## Accessibility

- `<header>`, `<h1>` 사용
- 설정 버튼: `aria-label="설정 열기"`
- 긴 title/context는 ellipsis 처리하여 좁은 VSCode 패널에서 레이아웃을 보존

---

## References

- [global_components.md](../core/global_components.md#topheader)
- [BackButton.md](./BackButton.md)
