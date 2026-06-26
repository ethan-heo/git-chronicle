# Component: PrimaryButton

주요 액션 실행 버튼. AI 정리 생성, 커밋 AI 정리, 캔버스 보기 등 주요 CTA에 사용.

---

## Props

```typescript
interface PrimaryButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
}
```

---

## States

| 상태 | 조건 | 시각 표현 |
|------|------|---------|
| `default` | 기본 | 강조 배경색 |
| `hover` | 마우스 오버 | 밝게 강조 |
| `disabled` | `disabled === true` | 회색, 클릭 불가 |
| `loading` | `isLoading === true` | 인라인 스피너, 클릭 불가 |

---

## Implementation

```tsx
export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  onClick, disabled, isLoading, children
}) => (
  <button
    className="primary-button"
    onClick={onClick}
    disabled={disabled || isLoading}
    aria-disabled={disabled || isLoading}
    aria-busy={isLoading}
  >
    {isLoading && <span className="primary-button-spinner" aria-hidden="true" />}
    <span>{children}</span>
  </button>
);
```

---

## CSS

```css
.primary-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--vscode-button-background);
  color: var(--vscode-button-foreground);
  border: none;
  border-radius: 3px;
  font-size: 12px;
  cursor: pointer;
}
.primary-button:hover:not(:disabled) {
  background: var(--vscode-button-hoverBackground);
}
.primary-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.primary-button-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--vscode-button-foreground);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

---

## References

- [global_components.md](../core/global_components.md#primarybutton)
