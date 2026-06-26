# Implementation Prompt: F05_AISummaryFile

> Claude Code 또는 Cursor에 직접 입력하여 구현을 생성하는 프롬프트

---

## Technical Context

- **AI 호출**: Extension Host에서 `child_process.spawn`으로 AI CLI 실행 (stdout 스트리밍)
- **스트리밍 전달**: Extension Host → `panel.webview.postMessage` chunk 단위 전달
- **파일 저장**: Extension Host에서 `fs.writeFileSync`
- **마크다운 렌더링**: Webview에서 `react-markdown` 라이브러리

---

## Files to Create / Modify

| 파일 | 역할 |
|------|------|
| `src/extension/aiService.ts` | AI CLI 스트리밍 호출 함수 |
| `src/extension/summaryFileService.ts` | 저장/로드 파일 서비스 |
| `src/webview/features/F05/AISummaryViewer.tsx` | 마크다운 결과 표시 영역 |
| `src/webview/features/F05/StreamingTextRenderer.tsx` | 실시간 타이핑 효과 |
| `src/webview/features/F05/RegenerateButton.tsx` | 재생성 버튼 |
| `src/webview/features/F05/TokenLimitWarning.tsx` | diff 크기 경고 배너 |
| `src/webview/features/F05/OverwriteConfirmDialog.tsx` | 덮어쓰기 확인 모달 |
| `src/webview/screens/S04_AISummaryViewerScreen.tsx` | S04 화면 조합 컴포넌트 |

---

## TypeScript Interfaces

```typescript
type SummaryMode = 'file' | 'commit';

interface AISummaryViewerProps {
  summaryContent: string;     // 현재 표시 중인 마크다운 내용
  isGenerating: boolean;
  hasSavedSummary: boolean;
  hasAIProvider: boolean;
  hasSavePath: boolean;
  onRegenerate: () => void;
}

interface StreamingTextRendererProps {
  content: string;
  isStreaming: boolean;
}

interface RegenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
}
```

---

## Extension Host Implementation

### `src/extension/aiService.ts`

```typescript
import { spawn } from 'child_process';

interface StreamAISummaryOptions {
  provider: AIProviderName;    // 'claude' | 'gemini' | 'codex'
  prompt: string;
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

export function streamAISummary(opts: StreamAISummaryOptions): () => void {
  const { provider, prompt, onChunk, onComplete, onError } = opts;

  const [cmd, ...args] = getProviderCommand(provider, prompt);
  const proc = spawn(cmd, args, { shell: false });

  proc.stdout.on('data', (data: Buffer) => {
    onChunk(data.toString());
  });

  proc.stderr.on('data', (data: Buffer) => {
    onError(data.toString());
  });

  proc.on('close', code => {
    if (code === 0) onComplete();
    else onError(`프로세스 종료 코드: ${code}`);
  });

  // 취소 함수 반환
  return () => proc.kill('SIGTERM');
}

function getProviderCommand(provider: AIProviderName, prompt: string): string[] {
  switch (provider) {
    case 'claude': return ['claude', '-p', prompt];
    case 'gemini': return ['gemini', '-p', prompt];
    case 'codex':  return ['openai', 'api', 'completions.create', '-m', 'gpt-4o', '-p', prompt];
    default: throw new Error(`알 수 없는 AI 제공자: ${provider}`);
  }
}
```

### `src/extension/summaryFileService.ts`

```typescript
export function saveSummary(
  savePath: string,
  commitHash: string,
  filePath: string,
  content: string
): void {
  const dir = path.join(savePath, commitHash);
  fs.mkdirSync(dir, { recursive: true });
  const fileName = filePath.replace(/\//g, '_') + '.md';
  fs.writeFileSync(path.join(dir, fileName), content, 'utf-8');
}

export function loadSummary(
  savePath: string,
  commitHash: string,
  filePath: string
): string | null {
  const fileName = filePath.replace(/\//g, '_') + '.md';
  const mdPath = path.join(savePath, commitHash, fileName);
  if (!fs.existsSync(mdPath)) return null;
  return fs.readFileSync(mdPath, 'utf-8');
}
```

### 메시지 핸들러

```typescript
case 'generateFileSummary': {
  const { commitHash, filePath, provider, savePath } = message;

  // diff 추출
  const diff = await fetchFileDiff(repoPath, commitHash, filePath);
  const TOKEN_LIMIT_CHARS = 12000;
  const isOverLimit = diff.rawDiff.length > TOKEN_LIMIT_CHARS;

  panel.webview.postMessage({ command: 'summaryTokenWarning', isOverLimit });

  const prompt = buildFileSummaryPrompt(filePath, diff.rawDiff);

  let fullContent = '';
  const cancel = streamAISummary({
    provider,
    prompt,
    onChunk: chunk => {
      fullContent += chunk;
      panel.webview.postMessage({ command: 'summaryChunk', chunk });
    },
    onComplete: () => {
      saveSummary(savePath, commitHash, filePath, fullContent);
      panel.webview.postMessage({ command: 'summaryComplete' });
    },
    onError: err => {
      panel.webview.postMessage({ command: 'summaryError', error: err });
    },
  });

  // 취소 요청 처리
  const cancelHandler = (msg: any) => {
    if (msg.command === 'cancelSummary') cancel();
  };
  panel.webview.onDidReceiveMessage(cancelHandler);
  break;
}
```

---

## AI 프롬프트 템플릿

```typescript
// src/extension/prompts.ts
export function buildFileSummaryPrompt(filePath: string, diff: string): string {
  return `다음은 Git 커밋에서 변경된 파일의 diff입니다.

파일 경로: ${filePath}

\`\`\`diff
${diff}
\`\`\`

위 변경 사항을 한국어로 간결하게 요약해 주세요:
1. 변경의 목적
2. 주요 변경 내용 (함수/클래스/로직 기준)
3. 주의할 점 또는 부수 효과

마크다운 형식으로 작성해 주세요.`;
}
```

---

## Webview Implementation

### `StreamingTextRenderer.tsx`

```tsx
export const StreamingTextRenderer: React.FC<StreamingTextRendererProps> = ({
  content, isStreaming
}) => (
  <div className="streaming-text-renderer">
    <pre className="streaming-content">{content}</pre>
    {isStreaming && <span className="streaming-cursor" aria-hidden="true">|</span>}
  </div>
);
```

```css
.streaming-cursor {
  animation: blink 1s step-end infinite;
  color: var(--vscode-editor-foreground);
}
@keyframes blink { 50% { opacity: 0; } }
```

### `AISummaryViewer.tsx`

```tsx
export const AISummaryViewer: React.FC<AISummaryViewerProps> = ({
  summaryContent, isGenerating, hasSavedSummary, hasAIProvider, hasSavePath, onRegenerate
}) => {
  if (!hasAIProvider) return (
    <EmptyState message="AI가 설정되지 않았습니다" ctaLabel="설정으로 이동" onCTA={goToSettings} />
  );
  if (!hasSavePath) return (
    <EmptyState message="저장 경로를 먼저 설정해주세요" ctaLabel="설정으로 이동" onCTA={goToSettings} />
  );

  return (
    <div className="ai-summary-viewer">
      {hasSavedSummary && !isGenerating && (
        <RegenerateButton onClick={onRegenerate} disabled={isGenerating} />
      )}
      {isGenerating
        ? <StreamingTextRenderer content={summaryContent} isStreaming={true} />
        : <ReactMarkdown>{summaryContent}</ReactMarkdown>
      }
    </div>
  );
};
```

### `OverwriteConfirmDialog.tsx`

```tsx
export const OverwriteConfirmDialog: React.FC<{
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="dialog-overlay" role="dialog" aria-modal="true">
      <div className="dialog-box">
        <p>기존 저장본을 덮어쓰시겠습니까?</p>
        <div className="dialog-actions">
          <PrimaryButton onClick={onConfirm}>확인</PrimaryButton>
          <button onClick={onCancel}>취소</button>
        </div>
      </div>
    </div>
  );
};
```

---

## State Flow

```
화면 진입 (저장본 없음) → postMessage('generateFileSummary') → 스트리밍 시작
화면 진입 (저장본 있음) → postMessage('loadSummary') → 저장본 즉시 표시

[재생성] 클릭 → OverwriteConfirmDialog 표시
[확인] → postMessage('generateFileSummary') → 스트리밍 재시작, 덮어쓰기
[취소] → 저장본 유지
```

---

## Business Rules

1. diff 크기 > 12,000자: `TokenLimitWarning` 배너 표시 (생성은 계속 진행)
2. `currentSummaryContent`는 청크 누적으로 스트리밍 표시
3. 완료 후 `fs.writeFileSync`로 `.md` 저장 → `hasSavedSummary = true`
4. 저장 시 디렉토리는 `fs.mkdirSync({ recursive: true })`로 자동 생성
5. 에러 발생 시 `ErrorState` + [재시도] 표시

---

## References

- [F05 spec.md](./spec.md)
- [F05 blueprint.md](./blueprint.md)
- [F05b implementation_prompt.md](../F05b_ai_summary_commit/implementation_prompt.md)
- [project/architecture.md](../../project/architecture.md)
- [core/state_model.md](../../core/state_model.md)
- [core/global_components.md](../../core/global_components.md)
