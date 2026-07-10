# Feature: F12_GitHubActivity

## Related Original Sections

- [Feature Summary](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

S02 워크스페이스 사이드바에서 현재 저장소의 GitHub PR/Issue 목록을 조회하고, 목록 항목을 클릭하면 본문에 새 워크스페이스 탭으로 상세(제목·작성자·상태·라벨·본문·리뷰·댓글)를 표시한다. PR과 Issue는 GitHub 인증/API를 공유하고 상호작용 패턴이 동일하여 하나의 Feature로 묶는다.

---

## Domain Glossary

Feature 간 공유되는 용어는 [core/glossary.md](../../core/glossary.md)를 참고한다. 아래는 F12 전용 용어다.

| 용어 | 정의 | 관련 코드 식별자 |
|---|---|---|
| PullRequestSummary / IssueSummary | 사이드바 목록 항목 하나를 표현하는 요약 정보(번호·제목·작성자·상태·라벨·최종 갱신일) | `src/webview/features/F12/types.ts`, `src/extension/githubTypes.ts` |
| PullRequestDetail / IssueDetail | 본문 탭에 표시되는 상세 정보. Summary에 본문(마크다운)·댓글·리뷰(PR만)를 더한 것 | 위와 동일 |
| CommentSummary | 댓글 스레드의 댓글 1건(작성자·마크다운 본문·작성 시각) | 위와 동일 |
| ReviewSummary | PR 리뷰 요약 1건(리뷰어·상태 `APPROVED`\|`CHANGES_REQUESTED`\|`COMMENTED`·리뷰 총평·제출 시각). 코드 라인별 인라인 리뷰 코멘트는 포함하지 않는다 | 위와 동일 |
| GithubAuthStatus | 사이드바 섹션의 인증 상태(`unauthenticated`\|`authenticated`\|`no-remote`) | `githubAuthStatus` |

---

## User Goal

사이드바에서 현재 작업 중인 저장소의 PR/Issue를 빠르게 훑어보고, 필요한 항목을 클릭해 커밋 탐색과 같은 워크스페이스 안에서 제목·상태·본문·리뷰·댓글을 확인한다.

---

## User Scenarios

1. GitHub 계정을 연결하지 않은 상태로 확장 프로그램을 열면, 사이드바 `PRsSection`/`IssuesSection` 각각에 "GitHub 계정을 연결해주세요" 안내와 [연결하기] CTA가 독립적으로 표시된다.
2. [연결하기]를 클릭하면 VS Code 내장 GitHub 인증 세션(`vscode.authentication.getSession('github', ['repo'], { createIfNone: true })`)으로 로그인 흐름이 시작되고, 인증에 성공하면 두 섹션의 목록이 자동으로 로드된다.
3. 현재 저장소에 GitHub 원격이 없으면(로컬 전용 저장소) 두 섹션을 숨기지 않고 "GitHub 원격 저장소가 없습니다" 안내를 유지한다.
4. 인증된 상태에서는 PR/Issue 모두 `open`/`closed`/`merged`(PR) 또는 `open`/`closed`(Issue) 전체가 목록에 표시되며, 상태 뱃지로 구분한다. 별도 상태 필터 UI는 없다.
5. 목록은 최신 갱신순으로 정렬되며, 스크롤 하단에 도달하면 다음 페이지를 무한 스크롤로 추가 로드한다(F01 커밋 목록과 동일한 패턴).
6. PR 또는 Issue 항목을 클릭하면 S02 본문에 `pr`/`issue` 워크스페이스 탭이 새로 열리고, 제목·작성자·상태·라벨·본문(마크다운)·리뷰 요약(PR만)·댓글 스레드가 표시된다.
7. 이미 열려 있는 PR/Issue 탭을 다시 클릭하면 새 탭을 만들지 않고 기존 탭을 활성화한다(`panelType + prNumber`/`panelType + issueNumber` 기준).
8. PR/Issue 탭에 포커스가 가 있어도 사이드바 파일 트리 등 커밋 종속 UI는 직전에 선택했던 커밋 컨텍스트를 그대로 유지한다(커밋과 무관한 탭이므로 컨텍스트를 비우지 않음).
9. 리뷰는 리뷰어·상태(승인/변경 요청/코멘트)·리뷰 총평만 보여주며, 코드 라인별 인라인 리뷰 코멘트나 타임라인(라벨 변경 등 이벤트 로그)은 표시하지 않는다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 인증 | VS Code 내장 GitHub 인증 세션. 스코프는 `repo`(private 저장소 포함) |
| 데이터 소스 | GitHub REST API(`api.github.com`)를 Extension Host에서 네이티브 `fetch`로 직접 호출. 별도 의존성(`@octokit/rest` 등) 추가하지 않음 |
| 저장소 판별 | `simple-git`의 `getRemotes(true)`로 `origin` URL을 읽어 owner/repo를 정규식으로 파싱 |
| 목록 상태 범위 | `open`/`closed`/`merged`(PR), `open`/`closed`(Issue) 전체. 필터 UI 없음 |
| 페이지네이션 | 목록은 무한 스크롤(`per_page=30`). 댓글/리뷰는 상세 조회 시 `per_page=100` 단일 요청만 사용하고 추가 페이지네이션은 만들지 않음(100개 초과 시 뒷부분 생략) |
| 상세 로딩 | 댓글·리뷰는 상세 탭 진입 시 PR/Issue 본체와 함께 한 번에 로드(`PR_DETAIL_LOADED`/`ISSUE_DETAIL_LOADED`) |
| Issue 목록 필터링 | GitHub `issues` 엔드포인트는 PR도 함께 반환하므로 `pull_request` 필드가 있는 항목은 제외 |
| 탭 식별 | `pr`/`issue` 탭은 `panelType + prNumber`/`panelType + issueNumber`로 식별하며 커밋 기반 탭(`panelType + commitHash + filePath`)과는 별도 규칙을 쓴다 |
| 커밋 컨텍스트 유지 | `pr`/`issue` 탭이 포커스되어도 `selectedCommit`은 갱신·초기화하지 않고 마지막 값을 유지 |
| 인증 세션 확인 | 데이터 조회 함수는 항상 silent 세션 확인(`createIfNone: false`)만 사용해 백그라운드에서 로그인 팝업이 뜨지 않게 한다. 로그인 팝업은 `CONNECT_GITHUB`(명시적 [연결하기] 클릭)에서만 발생 |

---

## Error Handling

| 상황 | 발생 조건 |
|------|------|
| 미인증 | `githubAuthStatus === 'unauthenticated'` |
| 원격 없음 | `githubAuthStatus === 'no-remote'`(GitHub 원격이 감지되지 않는 저장소) |
| 목록 로드 실패 | GitHub API 요청 실패. 이미 로드된 목록은 유지 |
| 상세 로드 실패 | 특정 번호의 PR/Issue 상세 조회 실패. 해당 탭에만 에러 상태 표시, 다른 탭에는 영향 없음 |

> 정확한 안내 메시지·CTA 문구·컴포넌트는 [blueprint.md](./blueprint.md)의 Empty States / Error States / Loading States가 유일한 출처다.

---

## Dependencies

- 사이드바 배치: F01_CommitLog, F02_ChangedFileTree와 같은 `SidebarSectionGroup` 안에 위치
- 탭 시스템: F02의 `WorkspaceTab`/`paneTree`를 확장하여 사용

---

## Related Screens

- [S02_WorkspaceScreen](../../screens/S02_history_view/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| GitHub REST API | HTTPS (native `fetch`) | Extension Host에서 PR/Issue 목록·상세·댓글·리뷰 조회 |
| `githubAuthStatus` | `'unauthenticated' \| 'authenticated' \| 'no-remote'` | 전역 상태. 사이드바 두 섹션의 EmptyState 분기 기준 |
| `pullRequestPage` / `issuePage` | `number` | 전역 상태. 무한 스크롤 페이지 오프셋 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `pullRequestList` / `issueList` | `PullRequestSummary[]` / `IssueSummary[]` | 전역 상태 업데이트. 사이드바 목록 |
| `prDetailsByNumber` / `issueDetailsByNumber` | `Record<number, {...}>` | 전역 상태 업데이트. 탭별 상세(댓글·리뷰 포함) 캐시 |
| `paneTree` | `PaneNode` | `pr`/`issue` 워크스페이스 탭 추가 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `githubAuthStatus` 갱신 | 확장 프로그램 활성화 시 최초 1회 `FETCH_GITHUB_AUTH_STATE`, [연결하기] 클릭 시 `CONNECT_GITHUB` | `authenticated`로 전환되는 순간 PR/Issue 목록을 자동으로 처음 로드 |
| `pullRequestList` / `issueList` 갱신 | 목록 로드 완료 / 무한 스크롤 | 기존 목록 교체(첫 페이지) 또는 추가(다음 페이지) |
| `prDetailsByNumber[number]` / `issueDetailsByNumber[number]` 갱신 | `pr`/`issue` 탭 진입 | 해당 번호의 상세·댓글·리뷰를 캐시하여 탭 재방문 시 재조회하지 않음 |
| `selectedCommit` 미변경 | `pr`/`issue` 탭 열기/활성화/포커스 | F02의 커밋 기반 탭과 달리 커밋 컨텍스트를 갱신하지 않는다 |
