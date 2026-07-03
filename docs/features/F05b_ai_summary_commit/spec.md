# Feature: F05b_AISummaryCommit

## Related Original Sections

- [화면 구성 > S-04](../../product/product_overview.md#s-04)
- [사용자 시나리오 > 3.5 AI 정리 뷰어](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.1 AI 정리 > 커밋 단위](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

커밋 전체 변경(모든 파일의 diff 합산)을 AI CLI에 전달하고, 커밋 단위 종합 요약을 마크다운으로 생성·표시·저장한다. 파일 단위(F05)와 달리 커밋 전체를 하나의 단위로 요약한다.

---

## User Goal

커밋 전체에서 무엇이 달성되었는지를 AI가 종합 요약한 마크다운으로 파악하고, 로컬에 저장하여 나중에 재활용한다.

---

## User Scenarios

1. [커밋 AI 정리] 버튼 클릭 시 AI 정리 화면(S-04) 활성화. 헤더에 `{커밋 메시지} > 커밋 전체 요약` 표시.
   - S-04 헤더 우측에는 [코드 함께 보기] 버튼이 함께 노출되지만, 커밋 전체 요약 모드에서는 비활성화된다.
2. **기존 저장본이 있는 경우**: 저장된 마크다운 파일을 즉시 불러와 표시. [재생성] 버튼 제공.
3. **저장본이 없는 경우**: 클릭 즉시 커밋 내 전체 파일 diff를 컨텍스트로 AI가 마크다운 형식으로 정리.
   - 정리된 내용은 설정 경로에 `전체_파일_정리.md` 파일명으로 자동 저장.
   - 저장 경로가 설정되어 있지 않으면 "저장 경로를 먼저 설정해주세요" 안내 + 설정 이동 CTA.
4. AI가 설정되어 있지 않으면 "AI가 설정되지 않았습니다" 안내 + 설정(⚙) 이동 CTA.
5. [재생성] 버튼: 덮어쓰기 확인 다이얼로그 → 확인 시 동일 입력으로 재처리.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 입력 | 커밋 내 전체 파일 diff 합산 |
| 처리 | 설정된 AI CLI에 커밋 단위 프롬프트 + 전체 diff 전달 (`child_process.spawn` 스트리밍) |
| CLI 실행 옵션 | Claude는 `-p`, Gemini는 `--skip-trust --prompt`, Codex는 `exec --skip-git-repo-check` 조합으로 비대화형 실행 |
| 출력 | 마크다운 형식의 커밋 종합 요약 (스트리밍 타이핑 효과로 실시간 표시) |
| 저장 | `{설정경로}/{shortHash}_{sanitizedCommitMessage}/전체_파일_정리.md` 로컬 저장. 상세 디렉토리 생성 규칙은 [F07 저장 파일 Naming](../F07_save_path_settings/spec.md#저장-파일-naming)을 따른다 |
| 기존 저장본 | 신규 경로를 먼저 확인하고, 없으면 신규 폴더의 `_commit_summary.md`, 기존 `{설정경로}/{커밋해시}/_commit_summary.md` 순서로 폴백하여 즉시 표시 |
| 재생성 | [재생성] 버튼 클릭 → 덮어쓰기 확인 다이얼로그 → 확인 시 동일 입력으로 재처리 |
| 토큰 한계 초과 | "diff가 큽니다. AI가 일부를 생략할 수 있습니다" 안내 표시 후 그대로 호출 |
| 실패 / 타임아웃 | 타임아웃 120초. 실패 시 "생성에 실패했습니다" 오류 메시지 + [재시도] 버튼 표시 |

---

## 기본 프롬프트 (커밋 단위)

```
아래는 Git 커밋에서 변경된 전체 파일의 diff입니다.
이 내용을 바탕으로 개발자가 나중에 자신의 작업을 회고할 수 있도록 커밋 전체를 종합하여 마크다운 형식으로 정리해주세요.

## 조건
- 출력 언어: 한국어
- 개별 파일의 변경을 나열하지 말고, 이 커밋이 전체적으로 무엇을 달성했는지 중심으로 작성할 것
- 코드를 단순 번역하지 말고, 변경의 의도와 맥락을 중심으로 작성할 것
- 추측이 필요한 경우 "~로 보임", "~한 것으로 추정됨" 형태로 표현할 것
- 출력 형식은 아래 구조를 따를 것

## 출력 형식
### 한 줄 요약
(이 커밋의 작업 내용을 한 문장으로)

### 변경 목적
(버그 수정 / 기능 추가 / 리팩터링 / 성능 개선 중 해당하는 것과 구체적인 이유)

### 주요 변경 파일 및 포인트
- `{파일명}`: (이 파일에서 달라진 핵심 내용 한 줄)
- ...

### 기술적 판단 근거 (해당하는 경우)
(특이한 구현 방식이나 패턴이 있다면 그 이유 추론)

## diff
{diff}
```

---

## Error Handling

[F05_AISummaryFile spec](../F05_ai_summary_file/spec.md#error-handling)과 동일한 오류 정책을 따른다. 정확한 안내 메시지·컴포넌트는 [blueprint.md](./blueprint.md) 또는 F05 blueprint.md의 Empty States / Error States가 유일한 출처다.

---

## Dependencies

- [F06_AISettings](../F06_ai_settings/spec.md) — `activeAIProvider` 필요
- [F07_SavePathSettings](../F07_save_path_settings/spec.md) — `savePath` 필요
- [F02_ChangedFileTree](../F02_changed_file_tree/spec.md) — [커밋 AI 정리] 버튼 진입점

---

## Related Screens

- [S04_AISummaryViewerScreen](../../screens/S05_ai_summary_viewer/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `selectedCommit` | `Commit` | 전역 상태. 전체 diff 추출 기준 커밋 및 헤더 표시 |
| `changedFiles` | `ChangedFile[]` | 전역 상태. 전체 파일 diff 합산용 파일 목록 |
| `activeAIProvider` | `AIProviderName \| null` | 전역 상태. 사용할 AI CLI 결정 |
| `savePath` | `string \| null` | 전역 상태. 저장본 파일 위치 결정 |
| simple-git diff (전체) | `string` | Extension Host에서 커밋 내 전체 파일 diff 합산 추출 |
| 로컬 저장본 | `string` | `{savePath}/{shortHash}_{sanitizedCommitMessage}/전체_파일_정리.md` 파일 존재 시 즉시 읽어 표시. 구 형식도 폴백으로 읽음 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `currentSummaryContent` | `string` | 전역 상태. AI 스트리밍 텍스트 누적 |
| 저장 파일 | `.md` | `{savePath}/{shortHash}_{sanitizedCommitMessage}/전체_파일_정리.md` 로컬 파일 생성 |

---

## Side Effects

F05_AISummaryFile과 동일한 Side Effect 정책을 따른다. 아래 항목만 다르다.

| 효과 | 트리거 | F05와의 차이 |
|------|--------|-------------|
| 로컬 파일 쓰기 | AI 생성 완료 | 파일명이 `전체_파일_정리.md` 고정 |
| `hasSavedSummary` 업데이트 | 해당 없음 | 커밋 단위 요약은 개별 파일 뱃지를 업데이트하지 않음 |
