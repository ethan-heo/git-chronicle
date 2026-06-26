# Component: LoadingState

데이터 로딩 또는 AI 생성 중 표시하는 로딩 인디케이터.

---

## Props

```typescript
interface LoadingStateProps {
  label?: string | null;          // 로딩 설명 텍스트 (없으면 미표시)
  size?: 'sm' | 'md' | 'lg';    // 기본값: 'md'
}
```

---

## Size Guide

| size | 용도 | 스피너 크기 |
|------|------|-----------|
| `sm` | 무한 스크롤 추가 로드, 인라인 로딩 | 16px |
| `md` | 기본 (기능별 로딩) | 24px |
| `lg` | 초기 전체 화면 로딩 | 32px |

---

## Implementation

```tsx
const SPINNER_SIZES = { sm: 16, md: 24, lg: 32 };

export const LoadingState: React.FC<LoadingStateProps> = ({
  label, size = 'md'
}) => (
  <div
    className={`loading-state loading-state--${size}`}
    role="status"
    aria-label={label ?? '로딩 중'}
    aria-live="polite"
  >
    <div
      className="loading-spinner"
      style={{ width: SPINNER_SIZES[size], height: SPINNER_SIZES[size] }}
      aria-hidden="true"
    />
    {label && <p className="loading-label">{label}</p>}
  </div>
);
```

---

## CSS

```css
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
}
.loading-state--lg { min-height: 200px; }
.loading-spinner {
  border: 2px solid var(--vscode-panel-border);
  border-top-color: var(--vscode-focusBorder);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-label {
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
  margin: 0;
}
```

---

## References

- [global_components.md](../core/global_components.md#loadingstate)
