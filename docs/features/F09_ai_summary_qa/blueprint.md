# Feature Blueprint: F09_AISummaryQA

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

요약 완료 후 하단에 질문 입력 UI를 제공하고, 생성된 답변을 요약 뷰어 내부에 자연스럽게 이어서 보여준다.

---

## Inputs

- `content: string`
- `isGenerating: boolean`
- `isGeneratingQA: boolean`
- `qaError: string | null`
- `qaStreamingResponse: string`

---

## Outputs

- 질문 제출 이벤트
- Q&A 스트리밍 상태 렌더링
- 완료된 Q&A 마크다운 표시

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
  qaError: string | null;
  qaStreamingResponse: string;
  onAskQuestion: (question: string) => void;
}
```

#### Interaction
- Enter: 질문 제출
- Shift+Enter: 줄바꿈
- 버튼 클릭: 질문 제출

#### States
- `idle`: 입력 가능
- `streaming`: 버튼 비활성화, 임시 응답 박스 표시
- `error`: 에러 메시지 표시

---

## Component Tree

```
AISummaryViewer
├─ action bar
├─ markdown / streaming content
└─ QAInputArea (요약 완료 시)
   ├─ textarea
   ├─ streaming preview (조건부)
   ├─ error text (조건부)
   └─ submit button
```

---

## Layout Rules

- Q&A 영역은 `AISummaryViewer` 하단에 border-top으로 구분한다.
- 질문 버튼은 우측 정렬의 소형 primary button을 사용한다.
- 스트리밍 응답은 입력창 아래 별도 박스로 표시한다.

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| 질문 영역 노출 | 요약 완료 | textarea + 버튼 표시 |
| 질문 제출 | Enter / 버튼 클릭 | `START_AI_QA` 전송 |
| 응답 스트리밍 | `AI_QA_CHUNK` 수신 | 임시 응답 박스 갱신 |
| 완료 | `AI_QA_COMPLETE` 수신 | 최종 마크다운 본문에 append |

---

## Responsive Rules

- 좁은 패널에서도 textarea와 버튼이 세로 흐름을 유지한다.
- 스트리밍 박스는 `white-space: pre-wrap`으로 긴 답변을 줄바꿈 표시한다.
