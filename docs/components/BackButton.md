# Component: BackButton

이전 화면으로 복귀하는 뒤로가기 버튼. 모든 하위 화면(S02~S06)에 TopHeader 내 표시.

---

## Props

```typescript
interface BackButtonProps {
  onClick: () => void;  // previousScreen으로 네비게이션
}
```

---

## Navigation Logic

`onClick`은 항상 Zustand 스토어의 `goBack()` 액션 연결:

```typescript
// appStore.ts
goBack: () => set(state => ({
  currentScreen: state.previousScreen ?? 'S01',
  previousScreen: null,
})),
```

---

## Implementation

```tsx
export const BackButton: React.FC<BackButtonProps> = ({ onClick }) => (
  <button
    className="back-button"
    onClick={onClick}
    aria-label="이전 화면으로 이동"
  >
    ←
  </button>
);
```

---

## CSS

```css
.back-button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--vscode-editor-foreground);
  font-size: 16px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
}
.back-button:hover {
  color: var(--vscode-focusBorder);
}
```

---

## References

- [global_components.md](../core/global_components.md#backbutton)
- [TopHeader.md](./TopHeader.md)
