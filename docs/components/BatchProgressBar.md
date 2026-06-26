# Component: BatchProgressBar

F08_BatchAISummary 일괄 처리 진행 상황을 표시하는 상단 고정 프로그레스 바. `isBatchRunning = true`일 때만 렌더링되며, 화면을 이동해도 항상 상단에 유지된다.

---

## Props

```typescript
interface BatchProgressBarProps {
  isVisible: boolean;          // isBatchRunning 상태와 동기화
  current: number;             // 현재까지 처리 완료된 파일 수
  total: number;               // 전체 처리 대상 파일 수
  onCancel: () => void;        // [취소] 버튼 클릭 콜백
}
```

---

## 렌더링 구조

```
BatchProgressBar (isVisible = true 시만 렌더링)
├── ProgressBar (막대 그래프: current / total 비율)
├── 진행 텍스트 ("n / 전체" 형식)
└── [취소] 버튼
```

---

## 진행 텍스트 형식

```
"{current} / {total}"
예: "3 / 12"
```

---

## States

| 상태 | 조건 | 동작 |
|------|------|------|
| `hidden` | `isVisible = false` | 렌더링 안 함 (`return null`) |
| `running` | `isVisible = true` | 프로그레스 바 + 취소 버튼 표시 |

---

## Business Rules

- `isVisible = false`이면 DOM에 존재하지 않는다 (`return null`).
- [취소] 클릭 시 `onCancel()` 호출. Extension Host에 `CANCEL_BATCH_AI_SUMMARY` 메시지 전송.
- 취소 후 이미 완료된 파일의 저장본은 유지한다 (삭제하지 않음).
- `current / total` 비율로 `<progress>` 또는 커스텀 바 너비를 계산한다.
- 화면 이동 시에도 사라지지 않도록 `position: fixed; top: 40px; z-index: 100;` 적용 (TopHeader 아래).

---

## CSS

```css
.batch-progress-bar {
  position: fixed;
  top: 40px;                   /* TopHeader 높이만큼 아래 */
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--vscode-editor-background);
  border-bottom: 1px solid var(--vscode-panel-border);
  padding: 6px 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.batch-progress-track {
  flex: 1;
  height: 4px;
  background: var(--vscode-progressBar-background);
  border-radius: 2px;
  overflow: hidden;
}
.batch-progress-fill {
  height: 100%;
  background: var(--vscode-progressBar-foreground, var(--vscode-focusBorder));
  transition: width 200ms ease;
}
.batch-progress-text {
  font-size: 11px;
  color: var(--vscode-descriptionForeground);
  white-space: nowrap;
}
.batch-cancel-btn {
  font-size: 11px;
  padding: 2px 8px;
  background: none;
  border: 1px solid var(--vscode-button-border, var(--vscode-panel-border));
  color: var(--vscode-foreground);
  border-radius: 3px;
  cursor: pointer;
}
```

---

## Implementation

```tsx
export const BatchProgressBar: React.FC<BatchProgressBarProps> = ({
  isVisible, current, total, onCancel,
}) => {
  if (!isVisible) return null;

  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="batch-progress-bar" role="status" aria-live="polite">
      <div className="batch-progress-track">
        <div
          className="batch-progress-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`AI 정리 일괄 생성 진행 중 ${current} / ${total}`}
        />
      </div>
      <span className="batch-progress-text">{current} / {total}</span>
      <button
        className="batch-cancel-btn"
        onClick={onCancel}
        aria-label="AI 정리 일괄 생성 취소"
      >
        취소
      </button>
    </div>
  );
};
```

---

## Accessibility

- `role="status"`, `aria-live="polite"` — 진행 상황 변경 시 스크린 리더에 알림.
- `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` 명시.
- [취소] 버튼: `aria-label="AI 정리 일괄 생성 취소"`.

---

## References

- [F08_BatchAISummary spec.md](../features/F08_batch_ai_summary/spec.md)
- [S02_HistoryViewScreen blueprint.md](../screens/S02_history_view/blueprint.md)
- [../core/state_model.md](../core/state_model.md) (batchProgress 상태)
