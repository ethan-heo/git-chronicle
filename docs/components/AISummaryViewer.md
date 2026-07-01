# Component: AISummaryViewer

AI 정리 결과(마크다운)를 표시하는 뷰어 컴포넌트. 스트리밍 중에는 타이핑 효과와 "생각중" 상태를 보여주고, 완료 후에는 `react-markdown` + `remark-gfm`으로 렌더링한다. F05_AISummaryFile, F05b_AISummaryCommit 모두에서 사용한다.

---

## Props

```typescript
interface AISummaryViewerProps {
  content: string;                 // 현재까지 누적된 마크다운 텍스트
  error: string | null;            // 에러 메시지. null이면 정상
  isLoading: boolean;              // 설정/저장본 확인 중 로딩 상태
  isGenerating: boolean;           // true: AI stdout 스트리밍 중
  isGeneratingQA: boolean;         // true: Q&A 응답 스트리밍 중
  hasSavedSummary: boolean;        // 저장본 또는 저장 완료본 여부
  hasAIProvider: boolean;          // activeAIProvider 존재 여부
  hasSavePath: boolean;            // savePath 존재 여부
  savedPath: string | null;        // 현재 저장 파일 경로
  providerLabel: string | null;    // 표시할 provider 이름
  qaCompletionCount: number;       // Q&A 완료 후 최신 append 위치 스크롤 트리거
  summaryMode: "file" | "commit";
  onAskQuestion: (question: string) => void;
  onGoToSettings: () => void;
  onRegenerate: () => void;        // [재생성] 버튼 클릭 콜백
  onRetry: () => void;
}
```

---

## 렌더링 상태 분기

```
AISummaryViewer
├── [hasAIProvider = false] → EmptyState ("AI가 설정되지 않았습니다" + "설정으로 이동")
├── [hasSavePath = false]   → EmptyState ("저장 경로를 먼저 설정해주세요" + "설정으로 이동")
├── [isLoading = true]      → AI 전용 로딩 프리뷰 ("AI가 변경 흐름을 정리하고 있습니다")
├── [error !== null]        → ErrorState (에러 메시지 + [재시도] 버튼)
├── [content === '' && !isGenerating] → EmptyState (AI 정리가 없음)
└── [content 있음]          → 마크다운 렌더링 영역
    ├── [isGenerating = true]  → StreamingTextRenderer (타이핑 커서 표시)
    ├── [isGenerating = false] → ReactMarkdown + remark-gfm 렌더링 (완성본)
    └── [isGenerating = false && content !== ''] → QAInputArea
```

상단 action bar에는 provider/source tag를 표시한다. [재생성] 버튼은 `hasSavedSummary && content !== "" && !isGenerating`일 때만 노출한다. 요약 완료 후에는 하단에 질문 입력 영역이 추가되며, Q&A 응답 완료 시 동일 마크다운 본문에 append된 결과만 다시 렌더링된다. 별도 Q&A 스레드 UI는 유지하지 않는다.

---

## 스트리밍 타이핑 효과

`StreamingTextRenderer`는 `content`를 `<pre>` 태그로 표시하고 끝에 깜빡이는 커서(`|`)를 추가한다. 아직 텍스트 chunk가 오지 않은 스트리밍 시작 구간에서는 "생각중" + 점 애니메이션을 보여준다.

```tsx
const StreamingTextRenderer: React.FC<{ content: string; isStreaming: boolean }> = ({ content, isStreaming }) => (
  <div className="streaming-text-renderer">
    <pre className="streaming-content">{content}</pre>
    {isStreaming ? <span className="streaming-cursor" aria-hidden="true" /> : null}
  </div>
);
```

---

## States

| 상태 | 조건 | 표시 |
|------|------|------|
| `loading` | `isLoading = true` | 상단 안내 문구 + 스켈레톤 프리뷰 카드 |
| `streaming` | `isGenerating = true`, `content` 증가 중 | 타이핑 커서 표시 |
| `complete` | `isGenerating = false`, `content` 완성 | react-markdown 렌더링 |
| `qa.streaming` | `isGeneratingQA = true` | 질문 버튼 비활성화 + 본문 끝 "생각중" 표시 |
| `error` | `error !== null` | ErrorState + [재시도] |
| `empty` | `content === ''`, `!isGenerating`, `!isLoading`, `!error` | EmptyState |
| `noAI` | `hasAIProvider = false` | EmptyState + 설정 CTA |
| `noPath` | `hasSavePath = false` | EmptyState + 설정 CTA |

Q&A 에러는 별도 스레드 박스가 아니라 입력 흐름에서 처리하고, 성공 시에는 append된 본문 위치로 자동 스크롤된다.

---

## Markdown Rendering

- `remark-gfm`을 사용해 table 문법을 렌더링한다.
- heading은 문서 가독성을 위해 표시 레벨을 축약해 `h2 → h3 → h4 → h5` 체계로 렌더링한다.
- `Q. ...` 형식의 질문 heading은 일반 소제목보다 낮은 메타 톤으로 렌더링해 본문 위계를 침범하지 않도록 한다.

---

## Accessibility

- 스트리밍 중 커서는 `aria-hidden="true"` (스크린 리더 제외).
- 완료 후 react-markdown이 생성하는 heading에 자동 포커스는 하지 않는다.
- [재생성] 버튼: `aria-label="AI 정리 재생성"`.
- 질문 textarea는 Enter 제출, Shift+Enter 줄바꿈을 지원한다.
- Q&A 진행 상태와 본문 갱신은 `aria-live="polite"`로 전달한다.
- 질문 답변 결과를 본문에 append할 때 `## Q&A` 제목은 렌더링하지 않고, `### Q. ...` 블록부터 바로 이어붙인다.

---

## References

- [F05_AISummaryFile spec.md](../features/F05_ai_summary_file/spec.md)
- [F05b_AISummaryCommit spec.md](../features/F05b_ai_summary_commit/spec.md)
- [F09_AISummaryQA spec.md](../features/F09_ai_summary_qa/spec.md)
- [S04_AISummaryViewerScreen blueprint.md](../screens/S04_ai_summary_viewer/blueprint.md)
- [EmptyState.md](./EmptyState.md)
- [LoadingState.md](./LoadingState.md)
- [ErrorState.md](./ErrorState.md)
