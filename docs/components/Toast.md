# Component: Toast

일시적인 알림 메시지. 자동으로 사라짐. 화면 하단 우측 고정, 최대 3개 스택.

---

## Props

```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'warning' | 'error';
  duration?: number;  // ms. 기본값: 3000
}

interface ToastItem extends ToastProps {
  id: string;        // 유니크 ID (자동 생성)
}
```

---

## Usage Examples

| 상황 | type | message |
|------|------|---------|
| 일괄 생성 완료 | `success` | "N개 파일 AI 정리 완료" |
| 일괄 생성 완료 (실패 포함) | `warning` | "완료되었습니다. 실패 N개" |
| 저장 경로 미설정 | `error` | "저장 경로를 먼저 설정해주세요" |
| AI 미설정 | `error` | "AI가 설정되지 않았습니다" |

---

## Implementation

```tsx
// src/webview/components/Toast.tsx
const TYPE_COLORS = {
  success: 'var(--vscode-testing-iconPassed)',
  warning: 'var(--vscode-editorWarning-foreground)',
  error: 'var(--vscode-inputValidation-errorForeground)',
};

export const Toast: React.FC<ToastProps & { onDismiss: () => void }> = ({
  message, type, duration = 3000, onDismiss
}) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`toast toast--${type}`}
      role="alert"
      aria-live="assertive"
      style={{ borderLeftColor: TYPE_COLORS[type] }}
    >
      {message}
    </div>
  );
};

// Toast 컨테이너 (App.tsx에 삽입)
export const ToastContainer: React.FC = () => {
  const toasts = useAppStore(s => s.toasts);
  const removeToast = useAppStore(s => s.removeToast);

  return (
    <div className="toast-container" aria-label="알림">
      {toasts.slice(0, 3).map(t => (
        <Toast key={t.id} {...t} onDismiss={() => removeToast(t.id)} />
      ))}
    </div>
  );
};
```

### Zustand 토스트 관리

```typescript
// appStore.ts에 추가
toasts: [] as ToastItem[],
showToast: (message: string, type: ToastItem['type'], duration = 3000) =>
  set(state => ({
    toasts: [...state.toasts, { id: crypto.randomUUID(), message, type, duration }],
  })),
removeToast: (id: string) =>
  set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
```

---

## CSS

```css
.toast-container {
  position: fixed;
  bottom: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 1000;
}
.toast {
  padding: 8px 12px;
  background: var(--vscode-editorWidget-background);
  border: 1px solid var(--vscode-panel-border);
  border-left: 4px solid;
  border-radius: 3px;
  font-size: 12px;
  color: var(--vscode-editor-foreground);
  min-width: 200px;
  max-width: 320px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  animation: toast-in 0.2s ease;
}
@keyframes toast-in { from { opacity: 0; transform: translateY(8px); } }
```

---

## References

- [global_components.md](../core/global_components.md#toast)
