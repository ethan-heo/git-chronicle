# Implementation Prompt: F08_BatchAISummary

> Claude Code 또는 Cursor에 직접 입력하여 구현을 생성하는 프롬프트

---

## Technical Context

- **순차 실행**: Extension Host에서 `changedFiles`를 순차 처리 (async/await loop)
- **스킵 조건**: `hasSavedSummary === true`인 파일은 건너뜀
- **취소**: Extension Host의 현재 배치 실행 객체(`activeBatchRun.cancelled`)로 다음 반복 중단 (현재 파일은 완료까지 대기)
- **전역 UI**: `BatchProgressBar`는 모든 화면에서 항상 표시 (Zustand 전역 상태 구독)

---

## Files to Create / Modify

| 파일 | 역할 |
|------|------|
| `src/extension/batchService.ts` | 순차 일괄 생성 로직 |
| `src/webview/features/F08/BatchProgressBar.tsx` | 전역 고정 프로그레스 바 |
| `src/webview/features/F08/BatchCancelButton.tsx` | 취소 버튼 (BatchProgressBar 내부) |
| `src/webview/App.tsx` | `BatchProgressBar` 최상단 삽입 |

---

## TypeScript Interfaces

```typescript
interface BatchProgressBarProps {
  batchTotal: number;
  batchCompleted: number;
  isBatchRunning: boolean;
  isCancelling: boolean;
  onCancel: () => void;
}

interface BatchCancelButtonProps {
  disabled: boolean;
  onCancel: () => void;
}

// Zustand 전역 상태 추가
interface AppState {
  // ... 기존 상태
  isBatchRunning: boolean;
  isBatchCancelling: boolean;
  batchTotal: number;
  batchCompleted: number;
  batchFailedCount: number;
}
```

---

## Extension Host Implementation

### `src/extension/batchService.ts`

```typescript
export async function runBatchAISummary(options: {
  repoPath: string;
  files: ChangedFile[];
  provider: AIProviderName;
  savePath: string;
  commitHash: string;
  onProgress: (completed: number, failed: number, filePath: string) => void;
  onComplete: (completed: number, failed: number) => void;
  isCancelled: () => boolean;
}): Promise<void> {
  const { files, provider, savePath, commitHash, onProgress, onComplete, isCancelled } = options;

  let completed = 0;
  let failed = 0;

  for (const file of files) {
    if (isCancelled()) break;

    // 이미 저장본 있으면 스킵
    if (file.hasSavedSummary) {
      completed++;
      onProgress(completed, failed, file.path);
      continue;
    }

    try {
      const diff = await fetchFileDiff(options.repoPath, commitHash, file.path);
      const prompt = buildFileSummaryPrompt(file.path, diff.rawDiff);
      const content = await streamAISummarySync(provider, prompt);
      saveSummary(savePath, commitHash, file.path, content);
      completed++;
    } catch {
      failed++;
      completed++;
    }

    onProgress(completed, failed, file.path);
  }

  onComplete(completed, failed);
}

// 스트리밍을 동기적으로 수집하는 래퍼
async function streamAISummarySync(
  provider: AIProviderName,
  prompt: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let content = '';
    const cancel = streamAISummary({
      provider,
      prompt,
      onChunk: chunk => { content += chunk; },
      onComplete: () => resolve(content),
      onError: err => reject(new Error(err)),
    });
  });
}
```

### 메시지 핸들러

```typescript
let activeBatchRun: { id: number; cancelled: boolean } | null = null;
let nextBatchRunId = 1;

case 'START_BATCH_AI_SUMMARY': {
  const { files, provider, savePath, commitHash } = message;

  if (!provider) {
    panel.webview.postMessage({
      type: 'BATCH_AI_SUMMARY_ERROR',
      payload: { message: 'AI가 설정되지 않았습니다' },
    });
    break;
  }
  if (!savePath) {
    panel.webview.postMessage({
      type: 'BATCH_AI_SUMMARY_ERROR',
      payload: { message: '저장 경로를 먼저 설정해주세요' },
    });
    break;
  }

  if (activeBatchRun) break;

  const batchRun = { id: nextBatchRunId++, cancelled: false };
  activeBatchRun = batchRun;
  panel.webview.postMessage({
    type: 'BATCH_AI_SUMMARY_STARTED',
    payload: { batchTotal: files.length },
  });

  try {
    const result = await runBatchAISummary({
      repoPath,
      files,
      provider,
      savePath,
      commitHash,
      isCancelled: () => batchRun.cancelled,
      onProgress: (progress) => {
        panel.webview.postMessage({
          type: 'BATCH_AI_SUMMARY_PROGRESS',
          payload: {
            batchCompleted: progress.completed,
            batchFailedCount: progress.failed,
            completedFilePath: progress.filePath,
            hasSavedSummary: progress.saved,
          },
        });
      },
    });

    panel.webview.postMessage({
      type: result.cancelled ? 'BATCH_AI_SUMMARY_CANCELLED' : 'BATCH_AI_SUMMARY_DONE',
      payload: {
        batchCompleted: result.completed,
        batchFailedCount: result.failed,
      },
    });
  } finally {
    if (activeBatchRun?.id === batchRun.id) activeBatchRun = null;
  }
  break;
}

case 'CANCEL_BATCH_AI_SUMMARY': {
  if (activeBatchRun) {
    activeBatchRun.cancelled = true;
    panel.webview.postMessage({ type: 'BATCH_AI_SUMMARY_CANCELLING' });
  }
  break;
}
```

---

## Webview Implementation

### `BatchProgressBar.tsx`

```tsx
export const BatchProgressBar: React.FC<BatchProgressBarProps> = ({
  batchTotal, batchCompleted, isBatchRunning, isCancelling, onCancel
}) => {
  if (!isBatchRunning) return null;

  const progress = batchTotal > 0 ? (batchCompleted / batchTotal) * 100 : 0;

  return (
    <div
      className="batch-progress-bar"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={batchTotal}
      aria-valuenow={batchCompleted}
      aria-label={isCancelling ? 'AI 정리 일괄 생성 취소 중' : 'AI 정리 일괄 생성 진행 중'}
    >
      <div
        className="batch-progress-fill"
        style={{ width: `${progress}%` }}
      />
      <span className="batch-progress-text">
        {batchCompleted} / {batchTotal}
      </span>
      <BatchCancelButton disabled={isCancelling} onCancel={onCancel} />
    </div>
  );
};
```

### `BatchCancelButton.tsx`

```tsx
export const BatchCancelButton: React.FC<BatchCancelButtonProps> = ({ disabled, onCancel }) => (
  <button
    className="batch-cancel-button"
    disabled={disabled}
    onClick={onCancel}
    aria-label="AI 정리 일괄 생성 취소"
  >
    {disabled ? '취소 중' : '취소'}
  </button>
);
```

### `App.tsx` 최상단 삽입

```tsx
export const App: React.FC = () => {
  const { isBatchRunning, isBatchCancelling, batchTotal, batchCompleted } = useAppStore();

  const handleCancel = () => {
    window.vscode.postMessage({ type: 'CANCEL_BATCH_AI_SUMMARY' });
  };

  return (
    <div className="app">
      <BatchProgressBar
        isBatchRunning={isBatchRunning}
        isCancelling={isBatchCancelling}
        batchTotal={batchTotal}
        batchCompleted={batchCompleted}
        onCancel={handleCancel}
      />
      <ScreenRouter />
    </div>
  );
};
```

### Webview 메시지 처리

```typescript
case 'BATCH_AI_SUMMARY_STARTED':
  set({ isBatchRunning: true, isBatchCancelling: false, batchTotal: data.batchTotal, batchCompleted: 0, batchFailedCount: 0 });
  break;

case 'BATCH_AI_SUMMARY_PROGRESS':
  set({
    batchCompleted: data.batchCompleted,
    batchFailedCount: data.batchFailedCount,
  });
  // 완료된 파일의 hasSavedSummary 업데이트
  set(state => ({
    changedFiles: state.changedFiles.map(f =>
      f.path === data.completedFilePath ? { ...f, hasSavedSummary: true } : f
    ),
  }));
  break;

case 'BATCH_AI_SUMMARY_CANCELLING':
  set({ isBatchCancelling: true });
  break;

case 'BATCH_AI_SUMMARY_DONE':
case 'BATCH_AI_SUMMARY_CANCELLED':
  set({ isBatchRunning: false, isBatchCancelling: false });
  const { batchCompleted, batchFailedCount } = data;
  showToast(
    batchFailedCount > 0
      ? `완료되었습니다. 실패 ${batchFailedCount}개`
      : `${batchCompleted}개 파일 AI 정리 완료`,
    batchFailedCount > 0 ? 'warning' : 'success'
  );
  break;

case 'BATCH_AI_SUMMARY_ERROR':
  set({ isBatchRunning: false, isBatchCancelling: false });
  showToast(data.message, 'error');
  break;
```

---

## Business Rules

1. `hasSavedSummary === true`인 파일은 처리 없이 `batchCompleted++` (스킵)
2. 개별 파일 실패 시 `batchFailedCount++` 후 다음 파일로 계속 진행
3. 취소 시 현재 처리 중인 파일 완료 후 중단 (`activeBatchRun.cancelled` 플래그 기반)
4. AI 미설정 / 경로 미설정 시 시작 전 `Toast (error)` 표시, 배치 시작 안 함
5. `BatchProgressBar`는 `isBatchRunning === false`이면 DOM에서 완전히 제거 (`return null`)
6. 완료 Toast: 실패 없음 → `success`, 실패 있음 → `warning`

---

## CSS Variables to Use

```css
.batch-progress-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 8px;
  background: var(--vscode-editor-background);
  border-bottom: 1px solid var(--vscode-panel-border);
}
.batch-progress-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: var(--vscode-focusBorder);
  transition: width 0.3s ease;
}
.batch-progress-text {
  color: var(--vscode-descriptionForeground);
  font-size: 12px;
  flex: 1;
  text-align: center;
}
.batch-cancel-button {
  color: var(--vscode-descriptionForeground);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
}
```

---

## References

- [F08 spec.md](./spec.md)
- [F08 blueprint.md](./blueprint.md)
- [F05 implementation_prompt.md](../F05_ai_summary_file/implementation_prompt.md)
- [project/architecture.md](../../project/architecture.md)
- [core/state_model.md](../../core/state_model.md)
- [core/global_components.md](../../core/global_components.md#toast)
