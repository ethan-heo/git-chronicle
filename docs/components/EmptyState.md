# Component: EmptyState

콘텐츠가 없거나 조건에 맞는 항목이 없을 때 표시하는 안내 컴포넌트. 선택적 CTA 버튼 포함.

---

## Props

```typescript
interface EmptyStateProps {
  message: string;
  ctaLabel?: string | null;
  onCtaClick?: (() => void) | null;
}
```

---

## Usage Examples

| 상황 | message | ctaLabel |
|------|---------|----------|
| Git 저장소 없음 | "Git 저장소가 감지되지 않았습니다" | "레포 열기" |
| 커밋 이력 없음 | "커밋 이력이 없습니다" | null |
| 필터 결과 없음 | "조건에 맞는 커밋이 없습니다" | null |
| 변경 파일 없음 | "변경된 파일이 없습니다" | null |
| AI 미설정 | "AI가 설정되지 않았습니다" | "설정으로 이동" |
| 저장 경로 미설정 | "저장 경로를 먼저 설정해주세요" | "설정으로 이동" |

---

## Implementation

```tsx
export const EmptyState: React.FC<EmptyStateProps> = ({
  message, ctaLabel, onCtaClick
}) => (
  <div className="empty-state" role="status" aria-label={message}>
    <p className="empty-state-message">{message}</p>
    {ctaLabel && onCtaClick && (
      <PrimaryButton onClick={onCtaClick}>{ctaLabel}</PrimaryButton>
    )}
  </div>
);
```

---

## CSS

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 120px;
  padding: 24px;
  gap: 12px;
}
.empty-state-message {
  color: var(--vscode-descriptionForeground);
  font-size: 13px;
  text-align: center;
  margin: 0;
}
```

---

## References

- [global_components.md](../core/global_components.md#emptystate)
