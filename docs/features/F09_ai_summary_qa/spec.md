# Feature: F09_AISummaryQA

## Related Original Sections

- [F05_AISummaryFile](../F05_ai_summary_file/spec.md)
- [F05b_AISummaryCommit](../F05b_ai_summary_commit/spec.md)
- [S04_AISummaryViewerScreen](../../screens/S05_ai_summary_viewer/blueprint.md)

---

## Purpose

AI 요약 결과를 본 사용자가 추가 질문을 입력하면, 기존 diff와 요약을 바탕으로 단일 턴 답변을 생성해 요약 하단에 이어붙인다.

---

## User Goal

생성된 AI 요약만 보는 데서 끝나지 않고, 변경 의도나 구현 배경을 한 번 더 질문해 바로 답을 확인한다.

---

## User Scenarios

1. 파일 또는 커밋 요약이 완료되면 하단에 질문 입력 영역이 나타난다.
2. 사용자가 질문을 입력하고 Enter 또는 [질문하기] 버튼을 누르면 답변 생성이 시작된다.
3. 응답이 스트리밍으로 표시되고, 완료되면 현재 요약 하단과 저장된 `.md` 파일에 질문/답변 블록이 append된다.
4. 사용자는 여러 번 질문할 수 있지만, 각 질문은 독립적인 단일 턴으로 처리된다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 적용 범위 | F05 파일 단위 요약, F05b 커밋 단위 요약 공통 |
| 질문 가능 조건 | `isGeneratingSummary = false` 이고 `content !== ''` |
| 모델 선택 | 활성 프로바이더의 `qaModel` 사용 |
| 프롬프트 입력 | 기존 요약 본문 + 원본 diff + 현재 질문 |
| 멀티턴 여부 | 미지원. 이전 Q&A는 다음 질문 프롬프트에 포함하지 않음 |
| 저장 방식 | 기존 저장본 `.md` 파일 끝에 `---` 구분선 뒤 `### Q. ...` 질문/답변 블록 append |

---

## Error Handling

| 상황 | 처리 |
|------|------|
| 저장된 요약 파일 없음 | `qaError` 표시, append 중단 |
| diff 재조회 실패 | `qaError` 표시 |
| CLI 실행 실패 | `qaError` 표시 |
| 저장 실패 | `qaError` 표시 |

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `currentSummaryContent` | `string` | 현재 화면에 표시된 요약 본문 |
| `summarySavedPath` | `string \| null` | 저장된 요약 파일 경로 |
| `qaModel` | `string \| null` | 활성 프로바이더의 Q&A용 모델 |
| Git diff | `string` | Host가 파일/커밋 기준으로 재조회한 diff |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `isGeneratingQA` | `boolean` | Q&A 생성 진행 상태 |
| `qaError` | `string \| null` | 질문 응답 실패 상태 |
| `currentSummaryContent` | `string` | Q&A append 후 갱신된 요약 본문 |
| 저장된 `.md` 파일 | Markdown | Q&A 블록 append |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `START_AI_QA` 메시지 전송 | 질문 제출 | Host에 Q&A 생성 요청 |
| `AI_QA_CHUNK` 수신 | 스트리밍 중 | 임시 응답 상태 표시 |
| `AI_QA_COMPLETE` 수신 | 완료 | 현재 요약과 저장 파일에 Q&A 반영 |

---

## Message Protocol

| 메시지 | 방향 | 페이로드 |
|--------|------|---------|
| `START_AI_QA` | Webview → Host | `{ question, summaryContent, commitHash, commitMessage, filePath?, summaryMode, provider, qaModel, savePath }` |
| `AI_QA_CHUNK` | Host → Webview | `{ chunk: string }` |
| `AI_QA_COMPLETE` | Host → Webview | `{ appendedContent: string }` |
| `AI_QA_ERROR` | Host → Webview | `{ message: string }` |

---

## Current Implementation Notes

- Webview 질문 흐름은 `src/webview/features/F05/useAISummary.ts`에서 관리한다.
- Host Q&A 실행과 파일 append는 `src/extension/messageHandler.ts`와 `src/extension/summaryFileService.ts`에서 처리한다.
- Q&A 저장 포맷은 첫 질문 시 `---` 뒤에 `### Q. ...` 블록을 만들고, 이후 질문은 동일한 형식의 블록만 추가한다.
- 과거 저장본에 이미 `## Q&A` 헤더가 있더라도 이후 질문 append와 프롬프트 분리는 계속 호환된다.
