# Component: AISummaryViewer

AI 정리 결과(마크다운)를 표시하는 뷰어 컴포넌트. 스트리밍 중에는 타이핑 효과로 실시간 출력하고, 완료 후에는 `react-markdown`으로 렌더링한다. F05_AISummaryFile, F05b_AISummaryCommit 모두에서 사용한다.

---

## Props

```typescript
interface AISummaryViewerProps {
  content: string;              // 현재까지 누적된 마크다운 텍스트
  isStreaming: boolean;         // true: 스트리밍 중, false: 완료 또는 저장본 표시
  error: string | null;        // 에러 메시지. null이면 정상
  isLoading: boolean;           // 저장본 파일 읽기 중 로딩 상태
  onRegenerate: () => void;     // [재생성] 버튼 클릭 콜백
}
```

---

## 렌더링 상태 분기

```
AISummaryViewer
├── [isLoading = true]      → LoadingState ("AI 정리를 불러오는 중...")
├── [error !== null]        → ErrorState (에러 메시지 + [재시도] 버튼)
├── [content === '' && !isStreaming] → EmptyState (AI 정리가 없음)
└── [content 있음]          → 마크다운 렌더링 영역
    ├── [isStreaming = true]  → StreamingTextRenderer (타이핑 커서 표시)
    └── [isStreaming = false] → ReactMarkdown 렌더링 (완성본)
```

---

## 스트리밍 타이핑 효과

`StreamingTextRenderer`는 `content`를 `<pre>` 태그로 표시하고 끝에 깜빡이는 커서(`|`)를 추가한다.

```tsx
const StreamingTextRenderer: React.FC<{ content: string }> = ({ content }) => (
  <pre className="streaming-text">
    {content}
    <span className="streaming-cursor" aria-hidden="true">|</span>
  </pre>
);
```

---

## States

| 상태 | 조건 | 표시 |
|------|------|------|
| `loading` | `isLoading = true` | LoadingState |
| `streaming` | `isStreaming = true`, `content` 증가 중 | 타이핑 커서 표시 |
| `complete` | `isStreaming = false`, `content` 완성 | react-markdown 렌더링 |
| `error` | `error !== null` | ErrorState + [재시도] |
| `empty` | `content === ''`, `!isStreaming`, `!isLoading`, `!error` | EmptyState |

---

## CSS

```css
.ai-summary-viewer {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
}
.streaming-text {
  font-family: var(--vscode-editor-font-family, monospace);
  font-size: 13px;
  white-space: pre-wrap;
  color: var(--vscode-editor-foreground);
}
.streaming-cursor {
  animation: blink 1s step-start infinite;
}
@keyframes blink {
  50% { opacity: 0; }
}
```

---

## Accessibility

- 스트리밍 중 커서는 `aria-hidden="true"` (스크린 리더 제외).
- 완료 후 react-markdown이 생성하는 헤딩(`h2`, `h3`)에 자동 포커스는 하지 않는다.
- [재생성] 버튼: `aria-label="AI 정리 재생성"`.

---

## References

- [F05_AISummaryFile spec.md](../features/F05_ai_summary_file/spec.md)
- [F05b_AISummaryCommit spec.md](../features/F05b_ai_summary_commit/spec.md)
- [S04_AISummaryViewerScreen blueprint.md](../screens/S04_ai_summary_viewer/blueprint.md)
- [EmptyState.md](./EmptyState.md)
- [LoadingState.md](./LoadingState.md)
- [ErrorState.md](./ErrorState.md)
