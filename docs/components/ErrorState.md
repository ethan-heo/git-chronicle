# Component: ErrorState

오류 발생 시 표시하는 에러 메시지 + 선택적 [재시도] 버튼.

---

## Props

```typescript
interface ErrorStateProps {
  message: string;
  onRetry?: (() => void) | null;  // null이면 [재시도] 버튼 미표시
}
```

---

## Usage Examples

| 상황 | message | onRetry |
|------|---------|---------|
| 커밋 목록 로드 실패 | "커밋 목록을 불러오지 못했습니다" | 커밋 재로드 함수 |
| 변경 파일 로드 실패 | "변경 파일 목록을 불러오지 못했습니다" | 변경 파일 재로드 함수 |
| AI 정리 생성 실패 | "생성에 실패했습니다" | AI 재호출 함수 |
| CLI 제거 감지 | "연결된 CLI를 찾을 수 없습니다. 설정을 확인하세요" | null |

---

## Implementation

```tsx
export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => (
  <div className="error-state" role="alert" aria-live="assertive">
    <p className="error-state-message">{message}</p>
    {onRetry && (
      <button className="error-retry-btn" onClick={onRetry}>
        재시도
      </button>
    )}
  </div>
);
```

---

## CSS

```css
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  min-height: 120px;
}
.error-state-message {
  color: var(--vscode-inputValidation-errorForeground);
  font-size: 13px;
  text-align: center;
  margin: 0;
}
.error-retry-btn {
  color: var(--vscode-textLink-foreground);
  background: none;
  border: 1px solid var(--vscode-textLink-foreground);
  border-radius: 3px;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 12px;
}
```

---

## References

- [global_components.md](../core/global_components.md#errorstate)
