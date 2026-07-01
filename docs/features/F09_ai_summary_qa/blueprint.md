# Feature Blueprint: F09_AISummaryQA

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

요약 완료 후 하단에 질문 입력 UI를 제공하고, 생성된 답변을 별도 채팅 스레드가 아닌 기존 요약 문서 하단에 자연스럽게 이어서 보여준다.

---

## Inputs

- `content: string`
- `isGenerating: boolean`
- `isGeneratingQA: boolean`
- `qaError: string | null`
- `qaCompletionCount: number`

---

## Outputs

- 질문 제출 이벤트
- 본문 끝 답변 스트리밍 상태 렌더링
- 완료된 질문/답변 마크다운 append 및 자동 스크롤

---

## Components

- `AISummaryViewer`
- `QAInputArea`

---

## Component Definitions

### Component: QAInputArea

#### Purpose
사용자가 현재 요약에 대해 질문을 입력하고 제출하는 입력 영역.

#### Props
```typescript
interface QAInputAreaProps {
  isGeneratingQA: boolean;
  onAskQuestion: (question: string) => void;
}
```

#### Interaction
- Enter: 질문 제출
- Shift+Enter: 줄바꿈
- 버튼 클릭: 질문 제출

#### States
- `idle`: 입력 가능
- `streaming`: 버튼 비활성화

---

## Component Tree

```
AISummaryViewer
├─ action bar
├─ markdown / streaming content
│  └─ completed Q&A blocks appended in same document flow
└─ QAInputArea (요약 완료 시)
   ├─ textarea
   └─ submit button
```

---

## Layout Rules

- 질문/답변 영역은 `AISummaryViewer` 하단에 border-top으로 구분한다.
- 질문 입력창과 버튼은 가로 배치한다.
- 질문 입력 영역 컨테이너 패딩은 `px-3 py-3` 기준으로 맞춰, 가로 패딩을 세로 패딩 수준으로 유지한다.
- 질문/답변 결과는 별도 박스나 스레드가 아니라 기존 요약 문서의 하단 흐름으로만 표시한다.
- 마크다운 heading은 화면상 `h2 → h3 → h4 → h5` 위계로 보이도록 축약 렌더링한다.

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 질문 영역 노출 | 요약 완료 | textarea + 버튼 표시 |
| 질문 제출 | Enter / 버튼 클릭 | `START_AI_QA` 전송 |
| 응답 스트리밍 | `AI_QA_CHUNK` 수신 | 본문 끝 "생각중" 상태 유지 |
| 완료 | `AI_QA_COMPLETE` 수신 | 최종 마크다운 본문에 `### Q. ...` 블록 append 후 최신 위치로 스크롤 |

---

## Responsive Rules

- 좁은 패널에서도 textarea와 버튼은 한 줄 레이아웃을 우선 유지한다.
- 본문에 append된 질문/답변과 표(table)는 기존 요약 문서와 동일한 폭/줄바꿈 규칙을 따른다.
