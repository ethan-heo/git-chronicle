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

## Domain Glossary

Feature 간 공유되는 용어는 [core/glossary.md](../../core/glossary.md)를 참고한다. 이 Feature는 공유 용어 외 전용 용어가 없다.

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
| 저장 구조 | 파일 단위 `{루트경로}/{shortHash}_{sanitizedCommitMessage}/{파일명}.md`, 커밋 단위 `{루트경로}/{shortHash}_{sanitizedCommitMessage}/{커밋 정리 파일명}` (파일명은 언어별 분기, 아래 "저장 파일 Naming" 참고) |
| 커밋 디렉토리 규칙 | 선택된 커밋의 hash 앞 7자리와 파일시스템 안전 문자로 정리한 커밋 메시지를 조합 |
| 미설정 시 동작 | AI 정리 화면에서 `EmptyState`: "저장 경로를 먼저 설정해주세요" + "설정으로 이동" CTA |
| 경로 자동 생성 | 지정된 경로가 존재하지 않으면 `fs.mkdirSync({ recursive: true })`로 자동 생성 |
| 삭제 동작 | 삭제 버튼 클릭 시 경로 초기화. **기존 저장 파일은 삭제하지 않음** |
| 프로젝트별 분리 | `savePath`는 현재 워크스페이스 기준으로만 저장되며 다른 프로젝트에 공유되지 않음 |

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
| 커밋 단위 AI 정리 | `{savePath}/{shortHash}_{sanitizedCommitMessage}/{커밋 정리 파일명}` |
| 커밋 노트 | `{savePath}/{shortHash}_{sanitizedCommitMessage}/{노트 파일명}` |

`normalizedFilePath`는 파일 경로의 `/` 또는 `\`를 `__`로 치환한 값이다.

**커밋 정리 파일명 / 노트 파일명은 `vscode.env.language`에 따라 분기한다** (저장 시점 기준, `ko`로 시작하면 한국어·그 외는 영어):

| 언어 | 커밋 정리 파일명 | 노트 파일명 |
|------|-----------------|-------------|
| 한국어 (`ko*`) | `전체_파일_정리.md` | `노트.md` |
| 그 외 | `full_file_summary.md` | `note.md` |

예 (한국어 환경에서 저장한 경우):

```
{savePath}/abc1234_feat-add-batch-AI-summary/전체_파일_정리.md
{savePath}/abc1234_feat-add-batch-AI-summary/src__App.tsx.md
{savePath}/abc1234_feat-add-batch-AI-summary/노트.md
```

### 하위 호환성

기존에 저장된 파일은 자동으로 이름을 변경하지 않는다. 언어를 전환해도 다른 언어로 저장된 기존 파일을 계속 읽을 수 있도록, 읽기 시에는 두 언어의 파일명과 구 형식을 모두 후보로 탐색한다.

파일 단위 AI 정리:

1. `{savePath}/{shortHash}_{sanitizedCommitMessage}/{normalizedFilePath}.md`
2. `{savePath}/{fullCommitHash}/{normalizedFilePath}.md`

커밋 단위 AI 정리:

1. `{savePath}/{shortHash}_{sanitizedCommitMessage}/전체_파일_정리.md`
2. `{savePath}/{shortHash}_{sanitizedCommitMessage}/full_file_summary.md`
3. `{savePath}/{shortHash}_{sanitizedCommitMessage}/_commit_summary.md`
4. `{savePath}/{fullCommitHash}/_commit_summary.md`

커밋 노트:

1. `{savePath}/{shortHash}_{sanitizedCommitMessage}/노트.md`
2. `{savePath}/{shortHash}_{sanitizedCommitMessage}/note.md`

재생성 또는 신규 생성 시에는 항상 현재 언어의 파일명으로 저장한다. 기존 디렉토리와 파일을 새 이름으로 바꾸는 마이그레이션 명령은 현재 범위에 포함하지 않는다.

---

## Error Handling

| 상황 | 발생 조건 |
|------|------|
| 저장 경로 미설정 | `savePath === null` (UI는 F05b가 담당) |
| 경로 자동 생성 실패 | `fs.mkdirSync` 실패 (권한 등) |

> 정확한 안내 메시지·컴포넌트는 [blueprint.md](./blueprint.md)의 Error States 또는 F05b blueprint.md의 Empty States가 유일한 출처다.

---

## Dependencies

- [F05b_AISummaryCommit](../F05b_ai_summary_commit/spec.md) — `savePath` 소비

---

## Related Screens

- [S02_WorkspaceScreen](../../screens/S02_history_view/blueprint.md) — 사이드바 `settings` 로컬 뷰

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `savePath` | `string \| null` | 워크스페이스별 상태. 현재 설정된 저장 경로 |
| VSCode ExtensionContext | `Memento` | `workspaceState`에 워크스페이스별 경로를 영속 저장 |
| `vscode.window.showOpenDialog()` | `Uri[] \| undefined` | 사용자가 선택한 디렉토리 경로 반환 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `savePath` | `string \| null` | 워크스페이스별 상태 업데이트. 선택된 경로 또는 null (삭제 시) |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `savePath` 워크스페이스별 상태 업데이트 | 경로 선택 / 삭제 | 모든 AI 정리 저장 로직이 이 값을 참조 |
| VSCode ExtensionContext 영속 저장 | `savePath` 변경 시 | `context.workspaceState.update`로 현재 워크스페이스에만 복원 |
| `fs.mkdirSync({ recursive: true })` | AI 정리 첫 저장 시 | 저장 경로가 존재하지 않을 경우 자동 생성 (이 Feature가 아닌 F05/F05b/F08에서 실행) |
