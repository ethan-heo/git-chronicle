# Feature: F06_AISettings

## Related Original Sections

- [화면 구성 > S-06](../../product/product_overview.md#s-06)
- [사용자 시나리오 > 3.1 설정](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.2 AI 설정](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

Claude / Gemini / Codex CLI를 VSCode Extension에 등록하고, 활성화/비활성화를 관리하여 AI 정리 기능이 올바른 CLI를 사용할 수 있도록 한다.

---

## User Goal

내가 사용하는 AI CLI를 등록하고 활성화하여 AI 정리 기능을 사용할 수 있는 상태로 만든다.

---

## User Scenarios

1. 설정 화면의 **AI 등록** 영역에는 Claude / Gemini / Codex 각각의 버튼이 존재한다.
   - 비활성화 상태의 버튼을 클릭하면 CLI 연동 과정이 수행되고, 성공 시 버튼이 활성화 상태로 전환된다.
   - 활성화 상태의 버튼을 클릭하면 비활성화된다.
2. 하나의 AI가 활성화되면 나머지는 자동으로 비활성화된다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 지원 AI | Claude CLI, Gemini CLI, Codex CLI |
| 연동 방식 | CLI 인터페이스 기반 (`child_process.execFile`) |
| 연동 확인 | 등록 시 `{cli} --version` 실행 → exit code 0이면 성공, 비정상 종료면 실패 |
| CLI 미설치 | 등록 시도 후 실패 시 "CLI가 감지되지 않습니다. 설치 페이지를 확인하세요" 안내 + 설치 링크 표시 |
| CLI 사후 제거 | AI 정리 호출 시점에 실행 실패로 감지 → "연결된 CLI를 찾을 수 없습니다. 설정을 확인하세요" 안내 |
| 상태 관리 | 활성화 / 비활성화 토글 |
| 다중 등록 | 복수 등록 가능. 단 하나만 활성화 가능. 하나가 활성화되면 나머지는 자동으로 비활성화 |

---

## Error Handling

| 상황 | 처리 |
|------|------|
| CLI 미설치 | 버튼 아래 인라인 에러: "CLI가 감지되지 않습니다. 설치 페이지를 확인하세요" + 설치 링크 |
| 연동 중 오류 | 버튼 아래 인라인 에러: "연동에 실패했습니다" |
| 사후 CLI 제거 감지 | AI 정리 뷰어(S-04)에서 `ErrorState` 표시 (F05/F05b 담당) |

---

## Dependencies

- [F05_AISummaryFile](../F05_ai_summary_file/spec.md) — `activeAIProvider` 소비
- [F05b_AISummaryCommit](../F05b_ai_summary_commit/spec.md) — `activeAIProvider` 소비
- [F08_BatchAISummary](../F08_batch_ai_summary/spec.md) — `activeAIProvider` 소비

---

## Related Screens

- [S06_SettingsScreen](../../screens/S06_settings/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `registeredProviders` | `AIProviderName[]` | 전역 상태. 등록된 CLI 이름 목록 |
| `activeAIProvider` | `AIProviderName \| null` | 전역 상태. 현재 활성 CLI |
| VSCode ExtensionContext | `Memento` | 확장 프로그램 재시작 시 설정 복원을 위한 영속 저장소 |
| `child_process.execFile` | exit code | `{cli} --version` 실행 결과로 CLI 설치 여부 확인 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `registeredProviders` | `AIProviderName[]` | 전역 상태 업데이트 |
| `activeAIProvider` | `AIProviderName \| null` | 전역 상태 업데이트 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `registeredProviders` 전역 상태 업데이트 | CLI 등록 / 비활성화 | 등록 목록 변경 |
| `activeAIProvider` 전역 상태 업데이트 | 활성화 토글 | 단 하나만 활성화 — 나머지 자동 `inactive` |
| VSCode ExtensionContext 영속 저장 | 설정 변경 시 | 확장 재시작 후에도 설정 유지 (`context.globalState.update`) |

---

## Current Implementation Notes

- 실제 구현 파일은 `src/webview/features/F06/S06_SettingsScreen.tsx`와 `src/webview/features/F06/*`에 위치한다.
- Extension Host는 `src/extension/aiProviderService.ts`에서 CLI 확인, 등록 상태 저장, 저장 경로 저장을 함께 관리한다.
- Webview ↔ Extension 메시지는 `{ type, payload }` 구조를 사용한다.
  - 등록 요청: `REGISTER_AI_PROVIDER` `{ name }`
  - 활성/비활성 토글: `ACTIVATE_AI_PROVIDER` `{ name }`
  - 설정 로드: `FETCH_AI_SUMMARY_SETTINGS`
  - 응답: `AI_SUMMARY_SETTINGS_LOADED`, `AI_PROVIDER_REGISTERED`, `AI_PROVIDER_REGISTRATION_FAILED`, `AI_PROVIDER_STATE_UPDATED`
  - 설정 응답에는 `savePath`, `registeredProviders`, `activeAIProvider`가 함께 포함된다.
