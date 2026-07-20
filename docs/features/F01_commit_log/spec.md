# Feature: F01_CommitLog

## Related Original Sections

- [화면 구성 > S-01](../../product/product_overview.md#s-01)
- [사용자 시나리오 > 3.2 커밋 목록](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.6 커밋 로그 조회](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

사용자가 Git 저장소의 전체 커밋 이력을 빠르게 탐색하고, 기간·작성자·키워드 기준으로 필터링하여 원하는 커밋을 찾을 수 있도록 한다.

---

## Domain Glossary

Feature 간 공유되는 용어는 [core/glossary.md](../../core/glossary.md)를 참고한다. 이 Feature는 공유 용어 외 전용 용어가 없다.

---

## User Goal

내가 작업한 특정 커밋을 날짜, 작성자, 메시지 키워드 기준으로 빠르게 찾아 같은 워크스페이스 안에서 후속 탐색으로 이어간다.

---

## User Scenarios

1. 확장 프로그램 활성화 시 전체 커밋 이력이 목록 형태로 로드된다.
   - Git 저장소가 감지되지 않으면 "Git 저장소가 감지되지 않았습니다" 안내 메시지와 레포 열기 CTA가 표시된다.
2. 이력은 기본적으로 **커밋 생성 시간 기준 내림차순**으로 정렬되며, 사용자는 오래된순으로 전환할 수 있다.
3. 필터 영역에서 다음 기준으로 목록을 필터링할 수 있다.
   - **기간(날짜 범위):** `<input type="date">` × 2 (시작일 / 종료일)
   - **작성자(Author):** 드롭다운 자동완성 (커밋 로드 시 작성자 목록 추출)
   - **커밋 메시지 포함 키워드:** 텍스트 입력창에 키워드 입력 후 300ms 디바운싱
   - **커밋 메시지 제외 키워드:** 쉼표로 구분한 키워드를 입력하면 해당 문자열을 포함한 커밋을 제외
   - 포함 키워드는 대소문자를 구분하지 않는다.
4. 커밋 항목을 클릭하면 화면 전환 없이 같은 S-02 워크스페이스 안에서 선택 커밋과 변경 파일 섹션 내용이 갱신된다.
   - 현재 선택된 커밋 항목은 목록 안에서 하이라이트되어 다시 스크롤해 찾기 쉽도록 유지된다.
   - S-02 사이드바에서는 현재 선택된 커밋 항목을 호버할 때만 [AI 요약], [파일 캔버스], [Markdown 복사] 액션 버튼이 나타난다.
   - 선택되지 않은 커밋 항목에서는 [AI 요약]과 [파일 캔버스] 버튼이 보이지 않는다.
5. 필터 섹션이 접혀 있어도 적용된 조건은 유지되며, 다시 펼치면 이전 값이 그대로 보인다.
6. VSCode에서 패널이 숨김 처리되어 Webview 런타임이 재생성되어도 기간·작성자·키워드 필터는 복원되고, 복원된 조건으로 커밋 목록을 다시 로드한다.
7. 커밋 목록 섹션은 워크스페이스 안에서 계속 마운트된 상태를 유지하므로, 커밋을 바꾸거나 S02 사이드바 설정 뷰를 열었다 닫거나 S07을 다녀와도 이전 스크롤 위치를 유지한다.
8. 필터 적용 결과 커밋이 없으면 "조건에 맞는 커밋이 없습니다" 안내 메시지를 표시한다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 로딩 전략 | git 명령어 레벨 필터 (`--max-count`, `--after`, `--before`, `--author`, `--grep`) + 무한 스크롤 |
| 초기 로드 | 200개. 스크롤 하단 도달 시 200개씩 추가 로드 |
| 날짜 필터 | `<input type="date">` × 2 (시작일 / 종료일) |
| 종료일 포함 | `--before=<date>T23:59:59` 형태로 전달하여 종료일 당일 커밋을 포함 |
| 작성자 필터 | 드롭다운 선택. 커밋 로드 시 작성자 목록 추출하여 선택지 표시 |
| 키워드 검색 | 커밋 메시지 대상 (`--grep`). 입력 후 300ms 디바운싱. 대소문자 구분 없음 |
| 필터 조합 | 기간·작성자·키워드 세 조건 AND 고정. [F14_BranchSwitcher](../F14_branch_switcher/spec.md)의 브랜치 필터(`filterBranch`)가 추가되면 `git log <branch>` 범위를 먼저 좁히고, [F13_CommitGroups](../F13_commit_groups/spec.md)의 그룹 필터(`filterGroupId`)도 같은 `FilterState`의 필드로 추가되어 추가 조건으로 결합된다. 단, 그룹 필터가 활성화되면 브랜치 범위는 무시된다 |
| 필터 상태 복원 | `vscode.getState()` / `setState()`에 필터 값만 저장하여 Webview 재생성 후 복원 |
| 목록 스크롤 복원 | 워크스페이스 내에서는 커밋 목록 컴포넌트가 유지되어 스크롤 위치를 그대로 사용하고, Webview 재생성 시에는 저장된 `commitListScrollTop`으로 복원 |
| 정렬 | 기본값은 커밋 생성 시간 기준 내림차순. 사용자는 `sortOrder`로 오래된순 전환 가능. `asc`일 때는 전체 건수를 먼저 계산한 뒤 역산된 페이지 기준으로 가져온다 |
| 추가 로드 판정 | Extension Host가 `hasMore` 플래그를 함께 내려주며, Webview는 이를 그대로 사용한다 |
| 응답 순서 제어 | 요청마다 `requestId`를 부여하고, 응답 수신 시 최신 요청인지 확인한다 |

---

## Error Handling

| 상황 | 발생 조건 |
|------|------|
| Git 저장소 없음 | `isGitRepoDetected === false` |
| 커밋 이력 없음 | `commitList.length === 0`이고 필터 미적용 |
| 필터 결과 없음 | `commitList.length === 0`이고 필터 적용 중 |
| git 명령어 실행 실패 | `git log` 실행 자체가 실패 |
| 추가 로드 실패 | 무한 스크롤 중 후속 페이지 요청 실패. 이전에 로드된 목록은 유지 |

> 정확한 안내 메시지·CTA 문구·컴포넌트는 [blueprint.md](./blueprint.md)의 Empty States / Error States / Loading States가 유일한 출처다.

---

## Dependencies

- [F05b_AISummaryCommit](../F05b_ai_summary_commit/spec.md) — 선택된 커밋 항목 호버 [AI 요약] 버튼 진입점 제공
- [F04_DependencyCanvas](../F04_dependency_canvas/spec.md) — 선택된 커밋 항목 호버 [파일 캔버스] 버튼 진입점 제공
- [F13_CommitGroups](../F13_commit_groups/spec.md) — `CommitListItem`에 다중 선택 체크박스를 추가하고, `filterGroupId`로 그룹 필터를 적용한다

---

## Related Screens

- [S02_WorkspaceScreen](../../screens/S02_history_view/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| Git 저장소 | simple-git | Extension Host에서 현재 워크스페이스 경로 기준으로 `git log` 실행 |
| `filterDateStart` | `string \| null` | 전역 상태. `--after` 옵션으로 git 명령에 전달 |
| `filterDateEnd` | `string \| null` | 전역 상태. `--before=<date>T23:59:59` 형태로 git 명령에 전달 |
| `filterAuthor` | `string \| null` | 전역 상태. `--author` 옵션으로 git 명령에 전달 |
| `filterBranch` | `string \| null` | 전역 상태. 값이 있으면 `git log <branch>` / `git rev-list --count <branch>` 범위로 전달 |
| `filterKeyword` | `string` | 전역 상태. `--regexp-ignore-case --grep` 옵션으로 git 명령에 전달 |
| `filterExcludeKeyword` | `string` | 전역 상태. 쉼표 구분 후 Extension Host에서 후처리 필터로 적용 |
| `sortOrder` | `'desc' \| 'asc'` | 전역 상태. `asc`일 때 전체 카운트를 기반으로 오래된순 페이지를 계산 |
| `commitPage` | `number` | 전역 상태. `--max-count`, `--skip` 기반 페이지 오프셋 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `commitList` | `Commit[]` | 전역 상태 업데이트. 로드된 커밋 목록 |
| `authorList` | `string[]` | 전역 상태 업데이트. 드롭다운용 작성자 목록 (로드된 커밋에서 중복 제거 후 추출) |
| `selectedCommit` | `Commit` | 전역 상태 업데이트. 커밋 항목 클릭 시 설정 |
| `commitListScrollTop` | `number` | 전역 상태 업데이트. S-02 사이드바 커밋 목록 섹션의 마지막 스크롤 위치 |
| `hasMoreCommits` | `boolean` | 전역 상태 업데이트. 추가 로드 가능 여부 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `commitList` 전역 상태 업데이트 | 커밋 로드 완료 / 필터 변경 | 기존 목록 교체 또는 추가 (무한 스크롤) |
| `authorList` 전역 상태 업데이트 | 커밋 로드 완료 시 | 현재 로드된 커밋 목록에서 중복 제거 후 작성자 목록 추출 |
| `hasMoreCommits` 업데이트 | `hasMore` 판정값 수신 시 | 무한 스크롤 종료 신호 |
| Webview State 업데이트 | 필터 변경 / 필터 초기화 | 기간·작성자·포함/제외 키워드·정렬 순서만 `{ filter }` 구조로 저장. `commitList`, `selectedCommit`, 로딩 상태는 저장하지 않음 |
| 워크스페이스 커밋 컨텍스트 갱신 | `selectedCommit` 설정 | `selectedCommit`과 커밋 종속 상태를 갱신하고, S02 본문 패널은 `'none'`으로 초기화 |
| 커밋 목록 스크롤 복원 | Webview 재생성 | 저장된 `scrollTop`을 복원하고 같은 필터 조건으로 목록을 다시 로드 |
