# Feature: F02_ChangedFileTree

## Related Original Sections

- [화면 구성 > S-02](../../product/product_overview.md#s-02)
- [사용자 시나리오 > 3.3 이력 조회](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.7 변경 파일 트리](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

선택된 커밋에서 변경된 파일을 디렉토리 트리 구조로 표시하여, 사용자가 변경 범위를 파악하고 파일별 코드 뷰어 또는 AI 정리 뷰어로 진입할 수 있도록 한다.

---

## User Goal

특정 커밋에서 어떤 파일이 어떻게 변경되었는지 트리 형태로 확인하고, 관심 있는 파일의 diff 또는 AI 정리로 이동한다.

---

## User Scenarios

1. 선택된 커밋의 변경 파일이 **디렉토리 트리** 형태로 표시된다.
2. 파일 항목에 마우스를 호버링하면 두 개의 액션 버튼이 활성화된다.
   - **[코드 보기]** → `selectedFile` 설정 후 S-03으로 전환
   - **[AI 정리 보기]** → `selectedFile` 설정 후 S-04로 전환, `summaryMode = "file"` 설정
     - 해당 파일의 AI 정리 저장본이 이미 존재하면 파일명 옆에 **"AI 요약됨"** 뱃지가 표시된다.
     - 저장본 로드 또는 AI 생성은 F03/F05 구현 단계에서 연결한다.
3. 화면 상단에는 커밋 단위 액션 버튼이 위치한다.
   - **[커밋 AI 정리]** → S-04로 전환, `summaryMode = "commit"` 설정
   - **[전체 파일 AI 정리]** → `isBatchRunning = true`, `batchTotal = changedFiles.length` 설정 후 F-08 메시지 전송
   - **[캔버스 보기]** → S-05로 전환

> 현재 S-03은 코드 뷰어, S-04는 파일 단위 AI 요약 뷰어, S-05는 의존성 캔버스로 구현되어 실제 화면으로 전환된다. S-04의 커밋 단위 요약은 F05b 구현 범위에서 확장한다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 파일 상태 표시 | 파일명 앞 뱃지 레터로 구분: `A` 추가 / `M` 수정 / `D` 삭제 / `R` 이름 변경 |
| 저장됨 뱃지 조건 | 저장 경로가 설정되어 있고, `{savePath}/{shortHash}_{sanitizedCommitMessage}/{normalizedFilePath}.md` 저장본이 존재할 때만 `AI 요약됨` 뱃지를 표시한다. 구 형식 `{savePath}/{commitHash}/{normalizedFilePath}.md`도 폴백으로 인정한다. `normalizedFilePath`는 파일 경로의 `/` 또는 `\`를 `__`로 치환 |
| 대용량 커밋 처리 | 변경 파일 수 무관하게 전체 렌더링. 성능 문제 발생 시 추후 가상 리스트(react-window) 적용 검토 |
| 트리 구조 | 디렉토리 경로 기준으로 계층 분리. 디렉토리 노드는 토글 가능 |

---

## Error Handling

| 상황 | 발생 조건 |
|------|------|
| 변경 파일 로드 실패 | `diff-tree` 실행 자체가 실패 |
| 변경 파일 없음 | `changedFiles.length === 0` |

> 정확한 안내 메시지·CTA 문구·컴포넌트는 [blueprint.md](./blueprint.md)의 Empty States / Error States가 유일한 출처다.

---

## Dependencies

- [F05_AISummaryFile](../F05_ai_summary_file/spec.md) — 파일 클릭 시 AI 정리 생성
- [F08_BatchAISummary](../F08_batch_ai_summary/spec.md) — [전체 파일 AI 정리] 버튼
- [F03_CodeViewer](../F03_code_viewer/spec.md) — [코드 보기] 버튼

---

## Related Screens

- [S02_HistoryViewScreen](../../screens/S02_history_view/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `selectedCommit` | `Commit` | 전역 상태. 변경 파일 조회 기준 커밋 |
| `savePath` | `string \| null` | 전역 상태. 저장본 존재 여부 판단용 |
| simple-git `diff-tree --name-status --root` | `ChangedFile[]` | Extension Host에서 해당 커밋의 변경 파일 목록 추출 |
| 로컬 파일시스템 | `boolean` | 신규 저장 경로 또는 구 형식 저장 경로 존재 여부로 `hasSavedSummary` 설정 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `changedFiles` | `ChangedFile[]` | 전역 상태 업데이트. 변경 파일 목록 |
| `selectedFile` | `ChangedFile` | 전역 상태 업데이트. 파일 클릭 시 설정 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `changedFiles` 전역 상태 업데이트 | `selectedCommit` 설정 시 | 해당 커밋의 변경 파일 목록 로드 |
| S-03 화면 전환 | `selectedFile` 설정 + [코드 보기] | `currentScreen = "S03"` |
| S-04 화면 전환 | `selectedFile` 설정 + [AI 정리 보기] | `currentScreen = "S04"`, `summaryMode = "file"` |
| S-04 화면 전환 (커밋) | [커밋 AI 정리] 클릭 | `currentScreen = "S04"`, `summaryMode = "commit"` |
| S-05 화면 전환 | [캔버스 보기] 클릭 | `currentScreen = "S05"` |
| F08 시작 트리거 | [전체 파일 AI 정리] 클릭 | `isBatchRunning = true`, `batchTotal` 설정, VSCode 런타임에서는 `START_BATCH_AI_SUMMARY` 전송 |

---

## Current Implementation Notes

| 항목 | 현재 구현 |
|------|-----------|
| 화면 파일 | `src/webview/features/F02/S02_HistoryViewScreen.tsx` |
| 트리 구성 유틸 | `src/webview/features/F02/tree.ts` |
| 메시지 요청 | Webview → Extension: `FETCH_CHANGED_FILES` |
| 메시지 응답 | Extension → Webview: `CHANGED_FILES_LOADED`, `CHANGED_FILES_LOAD_FAILED` |
| 브라우저 개발 모드 | VSCode API가 없으면 `appStore.ts`의 `demoChangedFiles`를 사용 |
| 후속 화면 | S03은 실제 코드 뷰어로 이동. S04는 파일 단위 AI 요약 뷰어로 이동. S05는 실제 의존성 캔버스로 이동 |
