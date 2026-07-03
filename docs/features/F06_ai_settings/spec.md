# Feature: F06_AISettings

## Related Original Sections

- [화면 구성 > S-06](../../product/product_overview.md#s-06)
- [사용자 시나리오 > 3.1 설정](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.2 AI 설정](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

Claude / Gemini / Codex CLI를 VSCode Extension에 등록하고, 활성화/비활성화를 관리하며, 활성 프로바이더별 요약용/Q&A용 모델을 선택할 수 있게 한다.

---

## User Goal

내가 사용하는 AI CLI를 등록하고 활성화한 뒤, 작업 성격에 맞는 요약용/Q&A용 모델을 선택하여 AI 정리 기능을 사용할 수 있는 상태로 만든다.

---

## User Scenarios

1. 설정 화면의 **AI 등록** 영역에는 Claude / Gemini / Codex 각각의 버튼이 존재한다.
   - 비활성화 상태의 버튼을 클릭하면 CLI 연동 과정이 수행되고, 성공 시 버튼이 활성화 상태로 전환된다.
   - 활성화 상태의 버튼을 클릭하면 비활성화된다.
2. 하나의 AI가 활성화되면 나머지는 자동으로 비활성화된다.
3. AI가 활성화되면 해당 버튼 아래에 모델 선택 UI가 펼쳐지고, 요약용 모델과 Q&A용 모델을 각각 따로 선택할 수 있다.
4. 프로바이더를 전환했다가 다시 돌아와도 이전에 선택한 모델이 유지된다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 지원 AI | Claude CLI, Gemini CLI, Codex CLI |
| 연동 방식 | CLI 인터페이스 기반 (`child_process.execFile`) |
| 연동 확인 | 등록 시 `{cli} --version` 실행 → exit code 0이면 성공, 비정상 종료면 실패 |
| CLI 미설치 | 등록 시도 후 실패 시 "CLI가 감지되지 않습니다. 설치 페이지를 확인하세요" 안내 + 설치 링크 표시 |
| CLI 사후 제거 | AI 정리 호출 시점에 실행 실패로 감지 → "연결된 CLI를 찾을 수 없습니다. 설정을 확인하세요" 안내 |
| 비대화형 실행 규칙 | Claude는 `-p` print mode + stdin prompt, Gemini는 `--skip-trust --prompt`, Codex는 `exec --skip-git-repo-check` + stdin prompt를 사용 |
| 상태 관리 | 활성화 / 비활성화 토글 |
| 다중 등록 | 복수 등록 가능. 단 하나만 활성화 가능. 하나가 활성화되면 나머지는 자동으로 비활성화 |
| 모델 선택 | 활성 프로바이더에 한해 `summaryModel`, `qaModel` 드롭다운 노출 |
| 기본 모델 | Claude: `claude-haiku-4-5`, Gemini: `gemini-2.5-flash`, Codex: `gpt-5.4-mini` |
| 선택 가능 모델 | Claude: `claude-haiku-4-5`, `claude-sonnet-4-6`, `claude-opus-4-8` / Gemini: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-3.1-flash`, `gemini-3.1-pro` / Codex: `gpt-5.4-mini`, `gpt-5.4`, `gpt-5.5` |
| 모델 영속화 | 프로바이더별 마지막 선택값을 현재 워크스페이스 기준 `ExtensionContext.workspaceState`에 저장 |
| 프로젝트별 분리 | `activeAIProvider`, `summaryModel`, `qaModel`은 프로젝트마다 독립 유지 |
| 전역 유지 항목 | CLI 등록 정보(`registeredProviders`)만 `ExtensionContext.globalState`에 저장 |

---

## Error Handling

| 상황 | 발생 조건 |
|------|------|
| CLI 미설치 | 등록 시도 시 `{cli} --version`이 비정상 종료 |
| 연동 중 오류 | 등록 실행 중 예외 |
| 사후 CLI 제거 감지 | AI 정리 호출 시점에 CLI 실행 실패 (UI는 F05/F05b 담당) |
| 로그인/인증 미완료 | provider CLI가 미인증 상태로 종료 |

> 정확한 안내 메시지·컴포넌트는 [blueprint.md](./blueprint.md)의 Error States가 유일한 출처다.

---

## Dependencies

- [F05_AISummaryFile](../F05_ai_summary_file/spec.md) — `activeAIProvider` 소비
- [F05b_AISummaryCommit](../F05b_ai_summary_commit/spec.md) — `activeAIProvider` 소비
- [F08_BatchAISummary](../F08_batch_ai_summary/spec.md) — `activeAIProvider` 소비
- [F09_AISummaryQA](../F09_ai_summary_qa/spec.md) — `qaModel` 소비

---

## Related Screens

- [S06_SettingsScreen](../../screens/S06_settings/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `registeredProviders` | `AIProviderName[]` | 전역 상태. 등록된 CLI 이름 목록 |
| `activeAIProvider` | `AIProviderName \| null` | 워크스페이스별 상태. 현재 활성 CLI |
| `summaryModel` | `string \| null` | 워크스페이스별 상태. 활성 프로바이더의 요약용 모델 |
| `qaModel` | `string \| null` | 워크스페이스별 상태. 활성 프로바이더의 Q&A용 모델 |
| VSCode ExtensionContext | `Memento` | `globalState`는 CLI 등록 정보, `workspaceState`는 프로젝트별 AI 설정 복원에 사용 |
| `child_process.execFile` | exit code | `{cli} --version` 실행 결과로 CLI 설치 여부 확인 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `registeredProviders` | `AIProviderName[]` | 전역 상태 업데이트 |
| `activeAIProvider` | `AIProviderName \| null` | 워크스페이스별 상태 업데이트 |
| `summaryModel` | `string \| null` | 워크스페이스별 상태 업데이트 |
| `qaModel` | `string \| null` | 워크스페이스별 상태 업데이트 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `registeredProviders` 전역 상태 업데이트 | CLI 등록 / 비활성화 | 등록 목록 변경 |
| `activeAIProvider` 워크스페이스별 상태 업데이트 | 활성화 토글 | 단 하나만 활성화 — 나머지 자동 `inactive` |
| `summaryModel` / `qaModel` 워크스페이스별 상태 업데이트 | 모델 변경 | 활성 프로바이더에 대한 선택 모델 변경 |
| VSCode ExtensionContext 영속 저장 | 설정 변경 시 | `registeredProviders`는 `context.globalState.update`, 나머지 AI 설정은 `context.workspaceState.update` |

---

## Current Implementation Notes

- 실제 구현 파일은 `src/webview/features/F06/S06_SettingsScreen.tsx`와 `src/webview/features/F06/*`에 위치한다.
- Extension Host는 `src/extension/aiProviderService.ts`에서 CLI 확인, 등록 상태 저장, 저장 경로 저장, provider별 모델 저장을 함께 관리한다.
- 실제 AI 실행 커맨드 조합과 인증/신뢰 관련 에러 해석은 `src/extension/aiService.ts`에서 provider별로 분기한다.
- 현재 구현에서 `registeredProviders`는 머신 전역으로 공유되지만, `activeAIProvider`, `summaryModelPerProvider`, `qaModelPerProvider`는 워크스페이스별로 분리된다.
- Webview ↔ Extension 메시지는 `{ type, payload }` 구조를 사용한다.
  - 등록 요청: `REGISTER_AI_PROVIDER` `{ name }`
  - 활성/비활성 토글: `ACTIVATE_AI_PROVIDER` `{ name }`
  - 모델 변경: `SET_AI_MODEL` `{ provider, usage: 'summary' | 'qa', model }`
  - 설정 로드: `FETCH_AI_SUMMARY_SETTINGS`
  - 응답: `AI_SUMMARY_SETTINGS_LOADED`, `AI_PROVIDER_REGISTERED`, `AI_PROVIDER_REGISTRATION_FAILED`, `AI_PROVIDER_STATE_UPDATED`, `AI_MODEL_UPDATED`
  - 설정 응답에는 `savePath`, `registeredProviders`, `activeAIProvider`, `summaryModel`, `qaModel`이 함께 포함된다.
