# Feature: F09_AISummaryQA

## Related Original Sections

- [F05b_AISummaryCommit](../F05b_ai_summary_commit/spec.md)
- [S02_WorkspaceScreen](../../screens/S02_history_view/blueprint.md) — 본문 `aiSummary` 패널로 통합

---

## Purpose

AI 요약 결과를 본 사용자가 추가 질문을 입력하면, 기존 diff와 요약을 바탕으로 단일 턴 답변을 생성해 요약 하단에 이어붙인다.

---

## Domain Glossary

Feature 간 공유되는 용어는 [core/glossary.md](../../core/glossary.md)를 참고한다. 아래는 F09 전용 용어다.

| 용어 | 정의 | 관련 코드 식별자 |
|---|---|---|
| 단일 턴(single-turn) Q&A | 이전 질문/답변을 다음 질문 프롬프트에 포함하지 않고 매 질문을 독립적으로 처리하는 방식 | `qaMessages`, `START_AI_QA` |

---

## User Goal

커밋 요약이나 파일 요약만 보는 데서 끝나지 않고, 변경 의도나 구현 배경을 직접 질문해 바로 답을 확인한다. 파일 AI 요약에서 질문하면 해당 파일 diff를 기준으로, 커밋 AI 요약에서 질문하면 커밋 전체 diff를 기준으로 답변한다.

---

## User Scenarios

1. 커밋 요약이 완료되면 하단에 질문 입력 영역이 나타난다.
2. 사용자가 질문을 입력하고 Enter 또는 [질문하기] 버튼을 누르면 답변 생성이 시작된다.
3. 응답이 생성되는 동안 뷰어 본문 끝에 "생각중" 상태가 표시된다.
4. 응답이 완료되면 현재 요약 하단과 저장된 `.md` 파일에 질문/답변 블록이 append된다.
5. 완료 직후 뷰어는 append된 최신 위치로 자동 스크롤된다.
6. 사용자는 여러 번 질문할 수 있지만, 각 질문은 독립적인 단일 턴으로 처리된다.
7. 특정 파일의 변경 내용이 궁금하면 파일명을 언급하며 질문한다 — 프롬프트에 포함되는 커밋 전체 diff를 근거로 해당 파일에 대한 답변을 받는다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 적용 범위 | F05b 커밋 단위 요약과 파일 트리의 파일 단위 AI 요약. 현재 표시 중인 요약 범위에 맞는 diff를 근거로 답변한다 |
| 질문 가능 조건 | `isGeneratingSummary = false` 이고 `content !== ''` |
| 모델 선택 | 활성 프로바이더의 `qaModel` 사용 |
| 프롬프트 입력 | 기존 요약 본문 + 원본 diff + 현재 질문 |
| 멀티턴 여부 | 미지원. 이전 Q&A는 다음 질문 프롬프트에 포함하지 않음 |
| 저장 방식 | 기존 저장본 `.md` 파일 끝에 `---` 구분선 뒤 `### Q. ...` 질문/답변 블록 append |
| 화면 표시 방식 | 질문/답변은 별도 채팅 스레드로 유지하지 않고, append된 마크다운 본문만 표시 |
| 마크다운 렌더링 | GFM 테이블 문법을 포함한 Markdown 렌더링 지원 |
| 헤딩 표시 규칙 | 렌더링 시 heading은 `h2`부터 시작하며 `h2 → h3 → h4 → h5` 계층으로 축약 표시 |

---

## Error Handling

| 상황 | 처리 |
|------|------|
| 저장된 요약 파일 없음 | `qaError` 표시, append 중단 |
| diff 재조회 실패 | `qaError` 표시 |
| CLI 실행 실패 | `qaError` 표시 |
| CLI 로그인/인증 필요 | `qaError`에 provider별 로그인 안내 메시지 표시 (`claude login`, `gemini` 로그인 플로우, `codex login`) |
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
| `qaCompletionCount` | `number` | 완료 후 최신 append 위치로 이동시키기 위한 로컬 카운터 |
| 저장된 `.md` 파일 | Markdown | Q&A 블록 append |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `START_AI_QA` 메시지 전송 | 질문 제출 | Host에 Q&A 생성 요청 |
| `AI_QA_CHUNK` 수신 | 스트리밍 중 | 로컬 진행 상태 갱신 및 본문 끝 "생각중" 표시 유지 |
| `AI_QA_COMPLETE` 수신 | 완료 | 현재 요약과 저장 파일에 Q&A 반영 후 최신 위치로 스크롤 |

---

## Message Protocol

| 메시지 | 방향 | 페이로드 |
|--------|------|---------|
| `START_AI_QA` | Webview → Host | `{ question, summaryContent, commitHash, commitMessage, filePath?, provider, qaModel, savePath }` |
| `AI_QA_CHUNK` | Host → Webview | `{ chunk: string }` |
| `AI_QA_COMPLETE` | Host → Webview | `{ appendedContent: string }` |
| `AI_QA_ERROR` | Host → Webview | `{ message: string }` |

