# Feature: F08_BatchAISummary

## Related Original Sections

- [화면 구성 > S-02](../../product/product_overview.md#s-02)
- [사용자 시나리오 > 3.3 이력 조회](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.1 AI 정리 > AI 정리 일괄 생성](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

커밋 내 모든 변경 파일에 대해 파일 단위 AI 정리(F05)를 자동으로 순차 생성하여, 사용자가 개별적으로 파일마다 AI 정리를 요청하는 반복 작업을 없앤다.

---

## User Goal

커밋의 모든 파일에 대한 AI 정리를 한 번에 자동으로 생성하고, 진행 상황을 확인하며, 필요 시 중단할 수 있다.

---

## User Scenarios

1. S-02(이력 조회)의 [전체 파일 AI 정리] 버튼을 클릭하면 일괄 생성이 시작된다.
2. 변경 파일 트리의 모든 파일에 대해 파일 단위 AI 정리를 순차적으로 생성.
3. 이미 저장본이 존재하는 파일은 건너뜀(스킵).
4. 화면을 이동해도 백그라운드에서 계속 진행된다. 상단 고정 프로그레스 바로 진행 상태 확인 가능.
5. 진행 중 [취소] 버튼 클릭 시 중단 가능. 완료된 파일의 저장본은 유지.
6. 완료 시 각 파일에 "AI 요약됨" 뱃지 표시 + 완료 Toast 알림.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 진입 | S-02(이력 조회)의 [전체 파일 AI 정리] 버튼 |
| 동작 | 변경 파일 트리의 모든 파일에 대해 파일 단위 AI 정리를 순차적으로 생성 |
| 중복 처리 | 이미 저장본이 존재하는 파일은 건너뜀 (스킵) |
| 저장 | F05와 동일하게 `{savePath}/{shortHash}_{sanitizedCommitMessage}/{normalizedFilePath}.md`로 저장. 저장 경로 계산을 위해 선택 커밋의 `commitMessage`를 Extension Host로 함께 전달 |
| 에러 처리 | 개별 파일 실패 시 해당 파일을 건너뛰고 계속 진행. 완료 후 "실패 N개" 요약 Toast 표시 |
| 취소 | 상단 고정 프로그레스 바의 [취소] 버튼으로 중단 가능. 취소 시 완료된 파일의 저장본은 유지 |
| 진행 표시 | "n / 전체" 형태의 진행 상태 표시. 화면 이동 시에도 상단 고정 프로그레스 바로 계속 표시 |
| 완료 | 각 파일에 "AI 요약됨" 뱃지 표시 + 완료 Toast 알림 |

---

## Error Handling

| 상황 | 처리 |
|------|------|
| 개별 파일 생성 실패 | 해당 파일 건너뛰고 계속 진행 |
| 개별 파일 CLI 로그인/인증 필요 | 해당 파일 실패로 집계하고 다음 파일 계속 진행. 완료 후 실패 건수에 포함 |
| 전체 완료 후 (실패 있음) | `Toast` (warning): "완료되었습니다. 실패 N개" |
| 전체 완료 후 (실패 없음) | `Toast` (success): "파일 AI 정리가 완료되었습니다" |
| AI 미설정 상태에서 시작 | `Toast` (error): "AI가 설정되지 않았습니다" + 시작 불가 |
| 저장 경로 미설정 상태에서 시작 | `Toast` (error): "저장 경로를 먼저 설정해주세요" + 시작 불가 |
| 사용자 취소 | `Toast` (success): "{완료N}개 파일이 저장되었습니다" (완료된 파일 수 표시) |

---

## Dependencies

- [F05_AISummaryFile](../F05_ai_summary_file/spec.md) — 파일 단위 AI 정리 로직 재사용
- [F06_AISettings](../F06_ai_settings/spec.md) — `activeAIProvider` 필요
- [F07_SavePathSettings](../F07_save_path_settings/spec.md) — `savePath` 필요
- [F02_ChangedFileTree](../F02_changed_file_tree/spec.md) — `changedFiles` 소비, [전체 파일 AI 정리] 버튼 진입점

---

## Related Screens

- [S02_HistoryViewScreen](../../screens/S02_history_view/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `selectedCommit` | `Commit` | 전역 상태. `hash`와 `message`를 일괄 저장 경로 계산에 사용 |
| `changedFiles` | `ChangedFile[]` | 전역 상태. 일괄 처리 대상 파일 목록 |
| `activeAIProvider` | `AIProviderName \| null` | 전역 상태. 사전 검증 후 AI 호출 |
| `savePath` | `string \| null` | 전역 상태. 사전 검증 후 저장 경로 |
| `changedFiles[].hasSavedSummary` | `boolean` | 각 파일의 저장본 존재 여부 (스킵 판단) |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `isBatchRunning` | `boolean` | 전역 상태. 일괄 생성 진행 여부 |
| `isBatchCancelling` | `boolean` | 전역 상태. 취소 요청 후 현재 파일 완료 대기 여부 |
| `batchCompleted` | `number` | 전역 상태. 완료 파일 수 |
| `batchFailedCount` | `number` | 전역 상태. 실패 파일 수 |
| `changedFiles[].hasSavedSummary` | `boolean` | 전역 상태. 파일별 완료 시 `true`로 업데이트 |
| Toast 알림 | — | 완료 / 취소 시 사용자 알림 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `isBatchRunning = true` | [전체 파일 AI 정리] 클릭 | BatchProgressBar 표시 트리거 |
| `isBatchCancelling = true` | [취소] 클릭 | BatchProgressBar에서 취소 중 상태 표시 |
| `isBatchRunning = false` | 전체 완료 / 취소 완료 | BatchProgressBar 숨김 + 취소 중 상태 초기화 |
| `batchCompleted` / `batchFailedCount` 업데이트 | 파일 단위 완료/실패 시 | 실시간 프로그레스 바 업데이트 |
| F05_AISummaryFile 로직 순차 실행 | 파일마다 | 로컬 `.md` 파일 다수 생성 (파일시스템 쓰기) |
| `changedFiles[].hasSavedSummary` 업데이트 | 파일 저장 완료 시 | 트리 노드 "AI 요약됨" 뱃지 실시간 반영 |
| Toast 표시 | 완료 / 취소 | 전역 Toast 컴포넌트 호출 |
