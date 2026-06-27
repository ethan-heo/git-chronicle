# Feature: F05_AISummaryFile

## Related Original Sections

- [화면 구성 > S-04](../../product/product_overview.md#s-04)
- [사용자 시나리오 > 3.5 AI 정리 뷰어](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.1 AI 정리 > 파일 단위](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

선택된 파일의 diff를 AI CLI에 전달하고, 마크다운 형식의 작업 내용 요약을 스트리밍으로 생성·표시·저장한다. 기존 저장본이 있으면 AI 재호출 없이 즉시 표시한다.

---

## User Goal

파일에서 어떤 변경이 이루어졌는지를 AI가 정리한 마크다운 요약으로 빠르게 파악하고, 로컬에 저장하여 나중에 재활용한다.

---

## User Scenarios

1. [AI 정리 보기] 버튼 클릭 시 AI 정리 화면(S-04) 활성화. 헤더에 `{커밋 메시지} > {파일 경로}` 표시.
2. **기존 저장본이 있는 경우**: 저장된 마크다운 파일을 즉시 불러와 표시. [재생성] 버튼 제공.
3. **저장본이 없는 경우**: 클릭 즉시 파일 diff를 컨텍스트로 AI가 마크다운 형식으로 정리.
   - 정리된 내용은 설정 경로에 자동 저장.
   - 저장 경로가 설정되어 있지 않으면 "저장 경로를 먼저 설정해주세요" 안내 + 설정 이동 CTA.
4. AI가 설정되어 있지 않으면 "AI가 설정되지 않았습니다" 안내 + 설정(⚙) 이동 CTA.
5. [재생성] 버튼: 덮어쓰기 확인 다이얼로그 → 확인 시 동일 입력으로 재처리.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 입력 | 파일 diff (변경 전/후 코드) |
| 처리 | 설정된 AI CLI에 기본 프롬프트 + diff 전달 (`child_process.spawn` 스트리밍) |
| 출력 | 마크다운 형식의 작업 내용 요약 (스트리밍 타이핑 효과로 실시간 표시) |
| 저장 | `{설정경로}/{shortHash}_{sanitizedCommitMessage}/{normalizedFilePath}.md` 로컬 저장. 상세 디렉토리 생성 규칙은 [F07 저장 파일 Naming](../F07_save_path_settings/spec.md#저장-파일-naming)을 따른다. `normalizedFilePath`는 파일 경로의 `/` 또는 `\`를 `__`로 치환 |
| 기존 저장본 | 신규 경로를 먼저 확인하고, 없으면 기존 `{설정경로}/{commitHash}/{normalizedFilePath}.md` 경로를 폴백으로 읽어 AI 호출 없이 표시 |
| 재생성 | [재생성] 버튼 클릭 → 덮어쓰기 확인 다이얼로그 → 확인 시 동일 입력으로 재처리 |
| 토큰 한계 초과 | "diff가 큽니다. AI가 일부를 생략할 수 있습니다" 안내 표시 후 그대로 호출 |
| 실패 / 타임아웃 | 타임아웃 120초. 실패 시 "생성에 실패했습니다" 오류 메시지 + [재시도] 버튼 표시 |

---

## 기본 프롬프트 (파일 단위)

```
아래는 Git 커밋에서 변경된 파일의 diff입니다.
이 내용을 바탕으로 개발자가 나중에 자신의 작업을 회고할 수 있도록 마크다운 형식으로 정리해주세요.

## 조건
- 출력 언어: 한국어
- 코드를 단순 번역하지 말고, 변경의 의도와 맥락을 중심으로 작성할 것
- 추측이 필요한 경우 "~로 보임", "~한 것으로 추정됨" 형태로 표현할 것
- 출력 형식은 아래 구조를 따를 것

## 출력 형식
### 한 줄 요약
(변경 내용을 한 문장으로)

### 변경 목적
(버그 수정 / 기능 추가 / 리팩터링 / 성능 개선 중 해당하는 것과 구체적인 이유)

### 주요 변경 포인트
-
-

### 기술적 판단 근거 (해당하는 경우)
(특이한 구현 방식이나 패턴이 있다면 그 이유 추론)

## diff
{diff}
```

---

## Error Handling

| 상황 | 처리 |
|------|------|
| AI 미설정 | `EmptyState`: "AI가 설정되지 않았습니다" + "설정으로 이동" CTA |
| 저장 경로 미설정 | `EmptyState`: "저장 경로를 먼저 설정해주세요" + "설정으로 이동" CTA |
| 타임아웃 (120초) | `ErrorState`: "생성에 실패했습니다" + [재시도] 버튼 |
| CLI 실행 실패 | `ErrorState`: "연결된 CLI를 찾을 수 없습니다. 설정을 확인하세요" |
| 토큰 초과 | 경고 배너: "diff가 큽니다. AI가 일부를 생략할 수 있습니다" + AI 호출 계속 진행 |

---

## Dependencies

- [F06_AISettings](../F06_ai_settings/spec.md) — `activeAIProvider` 필요
- [F07_SavePathSettings](../F07_save_path_settings/spec.md) — `savePath` 필요
- [F02_ChangedFileTree](../F02_changed_file_tree/spec.md) — `selectedFile` 제공
- [F04_DependencyCanvas](../F04_dependency_canvas/spec.md) — 캔버스 노드에서도 진입 가능

---

## Related Screens

- [S04_AISummaryViewerScreen](../../screens/S04_ai_summary_viewer/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `selectedFile` | `ChangedFile` | 전역 상태. diff를 추출할 파일 경로 및 상태 |
| `selectedCommit` | `Commit` | 전역 상태. 헤더 표시 및 diff 기준 커밋 |
| `activeAIProvider` | `AIProviderName \| null` | 전역 상태. 사용할 AI CLI 결정 |
| `savePath` | `string \| null` | 전역 상태. 저장본 파일 위치 결정 |
| simple-git diff | `string` | Extension Host에서 해당 파일의 변경 전/후 코드 추출 |
| 로컬 저장본 | `string` | `{savePath}/{shortHash}_{sanitizedCommitMessage}/{normalizedFilePath}.md` 파일 존재 시 즉시 읽어 표시. 구 형식 `{savePath}/{commitHash}/{normalizedFilePath}.md`도 폴백으로 읽음 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `currentSummaryContent` | `string` | 전역 상태. AI 스트리밍 텍스트 누적 |
| 저장 파일 | `.md` | `{savePath}/{shortHash}_{sanitizedCommitMessage}/{normalizedFilePath}.md` 로컬 파일 생성 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `isLoadingSummary = true` | 저장본 확인 시작 | 저장본/설정 확인 로딩 상태 전환 |
| `isGeneratingSummary = true` | AI 호출 시작 | 로딩 상태 전환 |
| `isGeneratingSummary = false` | AI 완료 / 실패 / 타임아웃 | 로딩 상태 해제 |
| `currentSummaryContent` 스트리밍 업데이트 | `child_process.spawn` stdout | 청크 단위로 전역 상태 누적 업데이트 |
| `changedFiles[].hasSavedSummary = true` | 저장 완료 | 파일 트리의 "저장됨" 뱃지 트리거 |
| 로컬 파일 쓰기 | AI 생성 완료 | `fs.writeFileSync`로 `.md` 저장 (경로 없으면 `fs.mkdirSync` 선행) |
| `summaryError` 업데이트 | 타임아웃 / CLI 실패 | 오류 메시지 전역 상태 설정 |
