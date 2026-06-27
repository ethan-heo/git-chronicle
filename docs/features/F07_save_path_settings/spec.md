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
| 저장 구조 | 파일 단위 `{루트경로}/{커밋해시}/{파일명}.md`, 커밋 단위 `{루트경로}/{커밋해시}/_commit_summary.md` |
| 커밋해시 규칙 | 선택된 커밋의 전체 hash를 디렉토리명으로 사용 |
| 미설정 시 동작 | AI 정리 시도 시 "저장 경로를 먼저 설정해주세요" 토스트 + 설정(⚙) 화면 자동 진입 |
| 경로 자동 생성 | 지정된 경로가 존재하지 않으면 `fs.mkdirSync({ recursive: true })`로 자동 생성 |
| 삭제 동작 | 삭제 버튼 클릭 시 경로 초기화. **기존 저장 파일은 삭제하지 않음** |

---

## Error Handling

| 상황 | 처리 |
|------|------|
| 저장 경로 미설정 | AI 정리 시도 시 `Toast` (error): "저장 경로를 먼저 설정해주세요" (AI 정리 Feature에서 처리) |
| 경로 자동 생성 실패 | `Toast` (error): "저장 경로를 생성할 수 없습니다. 권한을 확인하세요" |

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
- 경로 영속 저장은 `src/extension/aiProviderService.ts`의 `setSavePath()`가 `gitAuthorExplorer.savePath` 키로 `ExtensionContext.globalState`에 저장한다.
- 경로 선택 취소 시 기존 경로는 유지되며 Webview에는 별도 변경 이벤트를 보내지 않는다.
- 저장 파일 생성 시점의 디렉토리 자동 생성은 `src/extension/summaryFileService.ts`의 `saveSummary()` / `saveCommitSummary()`가 담당한다.
