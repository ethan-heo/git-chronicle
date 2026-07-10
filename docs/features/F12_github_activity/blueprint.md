# Feature Blueprint: F12_GitHubActivity

## Related Spec

- [Spec (기능 요구사항)](./spec.md)

---

## Purpose

S02 사이드바에 PR/Issue 목록 섹션 2개(`PRsSection`/`IssuesSection`)를 추가하고, 항목 클릭 시 본문에 `pr`/`issue` 워크스페이스 탭으로 상세(제목·작성자·상태·라벨·본문·리뷰·댓글)를 표시한다.

---

## Components

- `PRsSection`
- `PRList`
- `PRListItem`
- `PRStatusBadge`
- `IssuesSection`
- `IssueList`
- `IssueListItem`
- `IssueStatusBadge`
- `PRDetailPanel`
- `IssueDetailPanel`
- `ReviewSummaryList`
- `ReviewItem`
- `CommentThread`
- `CommentItem`
- `GithubMarkdown`

---

## Component Definitions

### Component: PRsSection / IssuesSection

#### Purpose
사이드바에서 GitHub 인증 상태에 따라 EmptyState 또는 PR/Issue 목록을 보여주는 `SidebarSection`(공유 컴포넌트) 래퍼. 두 섹션은 완전히 독립적으로 접고 펼 수 있다.

#### Data
- 전역 상태: `pullRequestList`/`issueList`, `githubAuthStatus`, 로딩/에러/hasMore 플래그

#### Props
```typescript
interface PRsSectionProps {
  isActive: boolean;
  activePRNumber: number | null;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSelectPullRequest: (pullRequest: PullRequestSummary) => void;
}

interface IssuesSectionProps {
  isActive: boolean;
  activeIssueNumber: number | null;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onSelectIssue: (issue: IssueSummary) => void;
}
```

`isExpanded`/`onToggleExpanded`는 `S02_WorkspaceScreen`이 소유하고 `SidebarSectionGroup`에 전달하는 controlled 상태다(컴포넌트 로컬 상태가 아니다) — `CommitsSection`/`FileTreeSection`과 동일한 패턴.

#### Interaction
- 마운트 시 `PULL_REQUESTS_LOADED`/`PULL_REQUESTS_LOAD_FAILED`(`ISSUES_*`) 메시지를 구독한다. 최초 로드 트리거는 `githubSlice`의 `handleGithubAuthState`가 인증 성공 시 자동으로 호출한다.
- 헤더 배지에 로드된 개수를 표시한다(0개면 배지 미표시).

#### Reusability
F12 전용. S02_WorkspaceScreen 사이드바에서 `CommitsSection`/`FileTreeSection`과 함께 `SidebarSectionGroup`의 형제 섹션으로 사용한다.

---

### Component: PRList / IssueList

#### Purpose
상태(인증/원격/로딩/에러/빈 목록/목록)에 따라 분기하고, 무한 스크롤로 다음 페이지를 로드한다.

#### Props
```typescript
interface PRListProps {
  pullRequestList: PullRequestSummary[];
  activePRNumber: number | null;
  githubAuthStatus: GithubAuthStatus;
  isLoadingPullRequests: boolean;
  hasMorePullRequests: boolean;
  hasLoadedPullRequests: boolean;
  pullRequestsError: string | null;
  onItemClick: (pullRequest: PullRequestSummary) => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onConnect: () => void;
}
```
`IssueListProps`는 동일한 형태를 Issue 타입으로 대응한다.

#### States
- `unauthenticated`: `EmptyState`(연결하기 CTA)
- `no-remote`: `EmptyState`(CTA 없음)
- `loading`: 초기 로드 중 `LoadingState [lg]`
- `error`: 목록이 비어 있는 상태에서 로드 실패 시 `ErrorState`
- `empty`: 인증됐고 로드는 끝났지만 항목이 0개
- `populated`: 목록 + 하단 `InfiniteScrollTrigger`([global_components](../../core/global_components.md#infinitescrolltrigger))

#### Reusability
F12 전용. `PRsSection`/`IssuesSection` 내부에서만 사용.

---

### Component: PRListItem / IssueListItem

#### Purpose
목록 항목 1행. 번호·제목·상태 뱃지·작성자·최종 갱신일을 표시한다.

#### Interaction
- 클릭 또는 Enter/Space 키 → `onClick(pullRequest | issue)` 호출 → S02가 `openWorkspaceTab({ panelType: 'pr' | 'issue', ... })` 실행
- 활성 탭과 대응하는 항목은 좌측 accent bar로 강조(F01 `CommitListItem`과 동일한 시각 패턴)

#### Reusability
F12 전용.

---

### Component: PRStatusBadge / IssueStatusBadge

#### Purpose
PR은 `open`/`closed`/`merged`, Issue는 `open`/`closed` 상태를 색상 뱃지로 표시한다.

#### Props
```typescript
interface PRStatusBadgeProps { state: 'open' | 'closed' | 'merged'; }
interface IssueStatusBadgeProps { state: 'open' | 'closed'; }
```

#### Reusability
F12 전용. `PRListItem`/`IssueListItem`과 `PRDetailPanel`/`IssueDetailPanel` 헤더에서 사용.

---

### Component: PRDetailPanel / IssueDetailPanel

#### Purpose
S02 본문 `pr`/`issue` 탭의 콘텐츠. 상세를 로드하고 제목/작성자/상태/라벨/본문(마크다운) 다음에 `ReviewSummaryList`(PR만)와 `CommentThread`를 표시한다.

#### Props
```typescript
interface PRDetailPanelProps { prNumber: number; isActive: boolean; }
interface IssueDetailPanelProps { issueNumber: number; isActive: boolean; }
```

#### Interaction
- `isActive`가 true가 되면 `loadPRDetail`/`loadIssueDetail` 호출 → 이미 로드된 캐시가 있으면(`hasLoaded && !error`) 재요청하지 않음
- `PR_DETAIL_LOADED`/`ISSUE_DETAIL_LOADED` 메시지를 번호로 필터링해 구독

#### States
- `loading`: `LoadingState [lg]`
- `error`: `ErrorState` + 재시도
- `populated`: 헤더(번호/상태/제목/작성자/라벨) + 본문 마크다운 + 리뷰(PR만) + 댓글

#### Reusability
F12 전용. S02 `ActiveTabPanel`의 `pr`/`issue` 패널 타입에서만 사용.

---

### Component: ReviewSummaryList / ReviewItem

#### Purpose
PR 리뷰 요약을 제출 시각순으로 나열한다. 코드 라인별 인라인 코멘트는 표시하지 않는다.

#### Data
- `ReviewSummary { author: string; state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED'; bodyMarkdown: string; submittedAt: string }`

#### Reusability
F12 전용(`PRDetailPanel`에서만 사용, Issue에는 리뷰 개념이 없다).

---

### Component: CommentThread / CommentItem

#### Purpose
댓글을 작성 시각순으로 나열한다. `PRDetailPanel`과 `IssueDetailPanel`이 공유한다(F12 내부 컴포넌트 재사용이며 `shared/components/`로 승격하지 않는다).

#### Data
- `CommentSummary { author: string; bodyMarkdown: string; createdAt: string }`

#### States
- `empty`: 댓글이 0개면 `EmptyState`
- `populated`: `CommentItem` 목록

#### Reusability
F12 전용. `PRDetailPanel`, `IssueDetailPanel` 둘 다 사용.

---

### Component: GithubMarkdown

#### Purpose
PR/Issue 본문·리뷰 총평·댓글 본문의 마크다운을 렌더링하는 공용 내부 컴포넌트. F11 `NoteEditorPanel`의 `ReactMarkdown` + `HighlightedCode` 패턴을 재사용하되, Mermaid 다이어그램 렌더링은 포함하지 않는다(범위 밖).

#### Props
```typescript
interface GithubMarkdownProps { content: string; }
```

#### Reusability
F12 전용. `PRDetailPanel`, `IssueDetailPanel`, `ReviewItem`, `CommentItem`에서 사용.

---

## Layout Rules

- `PRsSection`/`IssuesSection`은 [`SidebarSectionGroup`](../../core/global_components.md#sidebarsectiongroup) 안에서 `CommitsSection`/`FileTreeSection`과 동등한 형제 섹션으로 위치하며(순서는 Commit → File → PR → Issues), 기본값은 접힌 상태다.
- 두 섹션은 `CommitsSection`/`FileTreeSection`과 동일하게 `SidebarSectionGroup`의 리사이즈 가능한 높이 분할에 참여한다 — 펼쳐지면 인접한 다른 펼침 섹션과 드래그로 높이를 나눠 가지며, 더 이상 고정 캡(`max-h-64`)을 갖지 않는다. 펼침 상태와 높이는 Commit/File과 동일하게 Webview State에 저장된다(F01/F02 사이드바 섹션과의 차이 없음).
- `PRDetailPanel`/`IssueDetailPanel`은 헤더(제목/상태/라벨) → 본문 마크다운 → 리뷰(PR만) → 댓글 순으로 세로 스크롤되는 단일 컬럼 레이아웃이다.

---

## Interaction Model

| 인터랙션 | 트리거 | 결과 |
|---------|--------|------|
| [연결하기] 클릭 | `EmptyState` CTA (`unauthenticated`) | `CONNECT_GITHUB` 전송 → GitHub 로그인 팝업 → 성공 시 두 목록 자동 로드 |
| PR/Issue 항목 클릭 | `PRListItem`/`IssueListItem` | `openWorkspaceTab({ panelType: 'pr' | 'issue', ... })` → 본문에 탭 생성 또는 기존 탭 활성화 |
| 스크롤 하단 도달 | `InfiniteScrollTrigger` | 다음 페이지(`per_page=30`) 추가 로드 |
| 탭 재클릭 | 이미 열린 `pr`/`issue` 탭과 동일 번호 클릭 | 새 탭 생성 없이 기존 탭 활성화 |
| 탭 닫기 | `WorkspaceTabBar`의 × 클릭 | F02의 기존 탭 닫기·fallback 규칙을 그대로 따름 |

---

## Empty States

- **미인증:** `EmptyState`(message: "GitHub 계정을 연결해주세요", ctaLabel: "연결하기") — `PRsSection`/`IssuesSection` 각각 독립 표시
- **원격 없음:** `EmptyState`(message: "GitHub 원격 저장소가 없습니다", ctaLabel 없음)
- **목록 없음:** `EmptyState`(message: "PR이 없습니다" / "Issue가 없습니다")
- **댓글 없음:** `EmptyState`(message: "댓글이 없습니다") — `CommentThread` 내부

---

## Error States

- **목록 로드 실패:** `ErrorState`(message: "PR 목록을 불러오지 못했습니다" / "Issue 목록을 불러오지 못했습니다", onRetry: 목록 재로드)
- **상세 로드 실패:** `ErrorState`(message: 서버 에러 메시지 또는 "불러오지 못했습니다", onRetry: 해당 탭 상세 재로드) — 다른 탭에는 영향 없음

---

## Loading States

| 상태 | 컴포넌트 | 위치 |
|------|---------|------|
| 목록 초기 로드 | `LoadingState [lg]` | `PRList`/`IssueList` 전체 영역 중앙 |
| 목록 추가 로드 | `LoadingState [sm]` | 목록 하단 |
| 상세 로드 | `LoadingState [lg]` | `PRDetailPanel`/`IssueDetailPanel` 전체 영역 중앙 |

---

## Reusable Components

- [`EmptyState`](../../core/global_components.md#emptystate)
- [`LoadingState`](../../core/global_components.md#loadingstate)
- [`ErrorState`](../../core/global_components.md#errorstate)
- [`SidebarSection`](../../core/global_components.md#sidebarsection)
- [`InfiniteScrollTrigger`](../../core/global_components.md#infinitescrolltrigger)
