# Feature: F07_SavePathSettings

## Related Original Sections

- [화면 구성 > S-06](../../product/product_overview.md#s-06)
- [사용자 시나리오 > 3.1 설정](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.4 저장 경로 설정](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

AI 정리 결과물이 저장될 로컬 디렉토리 경로를 사용자가 직접 지정하고 관리할 수 있도록 한다.

---

## User Goal

AI 정리 결과가 저장될 폴더를 지정하여 정리 파일을 원하는 위치에 관리한다.

---

## User Scenarios

1. **저장 경로** 영역의 UI를 클릭하면 디렉토리 선택 다이얼로그가 활성화된다.
   - 경로 선택 후 확인을 누르면 해당 경로가 화면에 표시되고, 삭제 버튼이 활성화된다.
   - 삭제 버튼을 클릭하면 경로가 제거되고 초기 상태로 복원된다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 설정 방법 | 디렉토리 선택 다이얼로그 |
| 저장 구조 | 파일 단위 `{루트경로}/{shortHash}_{sanitizedCommitMessage}/{파일명}.md`, 커밋 단위 `{루트경로}/{shortHash}_{sanitizedCommitMessage}/전체_파일_정리.md` |
| 커밋 디렉토리 규칙 | 선택된 커밋의 hash 앞 7자리와 파일시스템 안전 문자로 정리한 커밋 메시지를 조합 |
| 미설정 시 동작 | AI 정리 화면에서 `EmptyState`: "저장 경로를 먼저 설정해주세요" + "설정으로 이동" CTA |
| 경로 자동 생성 | 지정된 경로가 존재하지 않으면 `fs.mkdirSync({ recursive: true })`로 자동 생성 |
| 삭제 동작 | 삭제 버튼 클릭 시 경로 초기화. **기존 저장 파일은 삭제하지 않음** |

---

## 저장 파일 Naming

AI 정리 파일은 파일 탐색기에서 어떤 커밋의 결과물인지 바로 알 수 있도록 커밋 해시만으로 된 디렉토리를 사용하지 않는다.

### 디렉토리 이름

```
{shortHash}_{sanitizedCommitMessage}
```

- `shortHash`: 커밋 hash 앞 7자리.
- `sanitizedCommitMessage`: 커밋 메시지를 파일시스템 안전 문자로 정리한 값.
  - 영문, 숫자, 한글, 공백, 하이픈만 유지한다.
  - 공백은 `-`로 변환한다.
  - `/ \ : * ? " < > |` 같은 예약 문자와 기타 특수문자는 제거한다.
  - 연속된 `-`는 하나로 줄인다.
  - 앞뒤 `-`는 제거한다.
  - 메시지 부분은 최대 60자로 제한한다. 전체 디렉토리명은 `{shortHash}_` 8자를 포함해 최대 68자다.
  - 정리 후 메시지가 비어 있으면 `commit`을 사용한다.

| 커밋 메시지 | 생성 디렉토리 이름 예시 |
|------------|-------------------------|
| `feat: add batch AI summary` | `abc1234_feat-add-batch-AI-summary` |
| `fix/auth: login 버그 수정` | `abc1234_fixauth-login-버그-수정` |
| `chore: update deps & config` | `abc1234_chore-update-deps-config` |

### 저장 파일 경로

| 대상 | 저장 경로 |
|------|-----------|
| 파일 단위 AI 정리 | `{savePath}/{shortHash}_{sanitizedCommitMessage}/{normalizedFilePath}.md` |
| 커밋 단위 AI 정리 | `{savePath}/{shortHash}_{sanitizedCommitMessage}/전체_파일_정리.md` |

`normalizedFilePath`는 파일 경로의 `/` 또는 `\`를 `__`로 치환한 값이다.

예:

```
{savePath}/abc1234_feat-add-batch-AI-summary/전체_파일_정리.md
{savePath}/abc1234_feat-add-batch-AI-summary/src__App.tsx.md
```

### 하위 호환성

기존에 저장된 구 형식 파일은 자동으로 이름을 변경하지 않는다. 대신 읽기 시 신규 형식을 먼저 찾고, 없으면 구 형식을 폴백으로 탐색한다.

파일 단위 AI 정리:

1. `{savePath}/{shortHash}_{sanitizedCommitMessage}/{normalizedFilePath}.md`
2. `{savePath}/{fullCommitHash}/{normalizedFilePath}.md`

커밋 단위 AI 정리:

1. `{savePath}/{shortHash}_{sanitizedCommitMessage}/전체_파일_정리.md`
2. `{savePath}/{shortHash}_{sanitizedCommitMessage}/_commit_summary.md`
3. `{savePath}/{fullCommitHash}/_commit_summary.md`

재생성 또는 신규 생성 시에는 항상 신규 형식으로 저장한다. 기존 디렉토리와 파일을 새 이름으로 바꾸는 마이그레이션 명령은 현재 범위에 포함하지 않는다.

---

## Error Handling

| 상황 | 처리 |
|------|------|
| 저장 경로 미설정 | AI 정리 화면에서 `EmptyState`: "저장 경로를 먼저 설정해주세요" + "설정으로 이동" CTA (AI 정리 Feature에서 처리) |
| 경로 자동 생성 실패 | Extension Host가 `AI_SUMMARY_ERROR`를 보내고 AI 정리 화면의 `ErrorState`에 "저장 경로를 생성할 수 없습니다. 권한을 확인하세요" 표시 |

---

## Dependencies

- [F05_AISummaryFile](../F05_ai_summary_file/spec.md) — `savePath` 소비
- [F05b_AISummaryCommit](../F05b_ai_summary_commit/spec.md) — `savePath` 소비
- [F08_BatchAISummary](../F08_batch_ai_summary/spec.md) — `savePath` 소비

---

## Related Screens

- [S06_SettingsScreen](../../screens/S06_settings/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `savePath` | `string \| null` | 전역 상태. 현재 설정된 저장 경로 |
| VSCode ExtensionContext | `Memento` | 확장 재시작 시 경로 복원을 위한 영속 저장소 |
| `vscode.window.showOpenDialog()` | `Uri[] \| undefined` | 사용자가 선택한 디렉토리 경로 반환 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `savePath` | `string \| null` | 전역 상태 업데이트. 선택된 경로 또는 null (삭제 시) |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `savePath` 전역 상태 업데이트 | 경로 선택 / 삭제 | 모든 AI 정리 저장 로직이 이 값을 참조 |
| VSCode ExtensionContext 영속 저장 | `savePath` 변경 시 | `context.globalState.update`로 재시작 후 복원 |
| `fs.mkdirSync({ recursive: true })` | AI 정리 첫 저장 시 | 저장 경로가 존재하지 않을 경우 자동 생성 (이 Feature가 아닌 F05/F05b/F08에서 실행) |

---

## Current Implementation Notes

- 저장 경로 UI는 `src/webview/features/F06/SavePathSection.tsx`에 구현되어 S06 설정 화면에 포함된다.
- Extension Host의 경로 선택/삭제는 `src/extension/messageHandler.ts`에서 `SET_SAVE_PATH`, `CLEAR_SAVE_PATH` 메시지로 처리한다.
- 경로 영속 저장은 `src/extension/aiProviderService.ts`의 `setSavePath()`가 `gitRewind.savePath` 키로 `ExtensionContext.globalState`에 저장한다.
- 경로 선택 취소 시 기존 경로는 유지되며 Webview에는 별도 변경 이벤트를 보내지 않는다.
- 저장 파일 생성 시점의 디렉토리 자동 생성은 `src/extension/summaryFileService.ts`의 `saveSummary()` / `saveCommitSummary()`가 담당한다.
- 저장 경로 계산과 폴백 탐색은 `src/extension/summaryFileService.ts`의 `toCommitDirName()`, `getSummaryFilePath()`, `getCommitSummaryFilePath()`, `loadSummary()`, `loadCommitSummary()`, `hasSavedSummary()`가 담당한다.
- Webview는 `FETCH_CHANGED_FILES`, `START_AI_SUMMARY_FILE`, `START_AI_SUMMARY_COMMIT`, `START_BATCH_AI_SUMMARY` 메시지에 현재 선택 커밋의 `commitMessage`를 포함해 Extension Host로 전달한다.
- 일괄 AI 정리는 `src/extension/batchService.ts`의 `runBatchAISummary()`가 `commitMessage`를 받아 저장본 확인과 저장 경로 계산에 전달한다.
- 저장 디렉토리 생성 또는 파일 쓰기에 실패하면 `SummarySaveError`가 발생하고, `src/extension/messageHandler.ts`가 F05/F05b에 `AI_SUMMARY_ERROR`로 전달한다.
- Webview 브라우저 dev fallback에서는 실제 파일 다이얼로그 대신 데모 경로를 설정한다. 실제 경로 선택 다이얼로그는 VSCode Extension Host 런타임에서만 열린다.
