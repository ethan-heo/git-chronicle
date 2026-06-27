# Component: BatchProgressBar

F08_BatchAISummary 일괄 처리 진행 상황을 표시하는 상단 고정 프로그레스 바. `isBatchRunning = true`일 때만 렌더링되며, 화면을 이동해도 항상 상단에 유지된다.

---

## Props

```typescript
interface BatchProgressBarProps {
  batchTotal: number;          // 전체 처리 대상 파일 수
  batchCompleted: number;      // 현재까지 처리 완료된 파일 수
  isBatchRunning: boolean;     // 렌더링 여부
  isCancelling: boolean;       // 취소 요청 후 현재 파일 완료 대기 여부
  onCancel: () => void;        // [취소] 버튼 클릭 콜백
}
```

---

## 렌더링 구조

```
BatchProgressBar (isBatchRunning = true 시만 렌더링)
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
| `hidden` | `isBatchRunning = false` | 렌더링 안 함 (`return null`) |
| `running` | `isBatchRunning = true` | 프로그레스 바 + 취소 버튼 표시 |
| `cancelling` | `isCancelling = true` | "취소하는 중" 문구 표시 + 취소 버튼 비활성화 |

---

## Business Rules

- `isBatchRunning = false`이면 DOM에 존재하지 않는다 (`return null`).
- [취소] 클릭 시 `onCancel()` 호출. Extension Host에 `CANCEL_BATCH_AI_SUMMARY` 메시지 전송.
- 취소 요청 후에는 `isCancelling = true`로 전환하고 현재 파일 완료 후 중단된다는 문구를 표시한다.
- 취소 후 이미 완료된 파일의 저장본은 유지한다 (삭제하지 않음).
- `batchCompleted / batchTotal` 비율로 커스텀 바 너비를 계산한다.
- 화면 이동 시에도 사라지지 않도록 App 전역에 마운트하고 `position: fixed; top: 0; z-index: 40;`를 적용한다.

---

## CSS

```css
.batch-progress-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: var(--gae-color-surface-elevated);
  border-bottom: 1px solid var(--gae-border-color-default);
}
.batch-progress-track {
  flex: 1;
  height: 3px;
  background: var(--gae-color-surface-tertiary);
  border-radius: var(--gae-border-radius-sm);
  overflow: hidden;
}
.batch-progress-fill {
  height: 100%;
  background: var(--gae-border-color-focus);
  transition: width 200ms ease;
}
.batch-progress-count {
  font-size: 11px;
  color: var(--gae-color-text-secondary);
  white-space: nowrap;
}
.batch-cancel-button {
  font-size: 11px;
  padding: 2px 8px;
  background: none;
  border: 1px solid var(--gae-border-color-default);
  color: var(--gae-color-text-secondary);
  border-radius: 3px;
  cursor: pointer;
}
```

---

## Implementation

```tsx
export const BatchProgressBar: React.FC<BatchProgressBarProps> = ({
  batchTotal, batchCompleted, isBatchRunning, isCancelling, onCancel,
}) => {
  if (!isBatchRunning) return null;

  const percentage = batchTotal > 0 ? (batchCompleted / batchTotal) * 100 : 0;

  return (
    <section
      className="batch-progress-bar"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={batchTotal}
      aria-valuenow={batchCompleted}
      aria-label={isCancelling ? 'AI 정리 일괄 생성 취소 중' : 'AI 정리 일괄 생성 진행 중'}
    >
      <div className="batch-progress-track">
        <div
          className="batch-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="batch-progress-count">{batchCompleted} / {batchTotal}</span>
      <button
        className="batch-cancel-button"
        disabled={isCancelling}
        onClick={onCancel}
        aria-label="AI 정리 일괄 생성 취소"
      >
        {isCancelling ? '취소 중' : '취소'}
      </button>
    </section>
  );
};
```

---

## Accessibility

- `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` 명시.
- [취소] 버튼: `aria-label="AI 정리 일괄 생성 취소"`.

---

## References

- [F08_BatchAISummary spec.md](../features/F08_batch_ai_summary/spec.md)
- [S02_HistoryViewScreen blueprint.md](../screens/S02_history_view/blueprint.md)
- [../core/state_model.md](../core/state_model.md) (batchProgress 상태)
