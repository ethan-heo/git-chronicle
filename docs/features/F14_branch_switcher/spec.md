# Feature: F14_BranchSwitcher

## Related Original Sections

- [기능 상세 > Feature Summary](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

사용자가 실제 저장소 checkout을 바꾸지 않고도, GitChronicle 안에서 어느 로컬/원격 브랜치의 커밋 이력을 볼지 전환할 수 있게 한다.

---

## Domain Glossary

Feature 간 공유되는 용어는 [core/glossary.md](../../core/glossary.md)를 참고한다. 이 Feature는 공유 용어 외 전용 용어가 없다.

---

## User Goal

현재 워크스페이스 상태를 건드리지 않은 채 다른 브랜치의 커밋 흐름을 빠르게 탐색한다.

---

## User Scenarios

1. S02 사이드바 최상단에 로컬 브랜치와 fetch된 원격 브랜치 목록 섹션이 표시된다.
2. 기본 선택 브랜치는 현재 checkout된 HEAD 브랜치다.
3. 다른 로컬 또는 원격 브랜치를 클릭하면 `CommitsSection`이 해당 브랜치의 `git log <branch>` 결과로 다시 로드된다.
4. 실제 저장소의 checkout 상태, 열린 에디터, 미커밋 변경사항에는 아무 영향이 없다.
5. Fetch 버튼을 누르면 primary remote(`origin`, 없으면 첫 remote) 기준으로 원격 ref를 갱신한 뒤 ahead/behind 표시를 다시 계산한다.
6. Webview가 재생성되어도 마지막 선택 브랜치는 복원된다. 복원된 브랜치가 삭제되었으면 현재 HEAD 브랜치로 폴백한다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 표시 범위 | 로컬 브랜치 + fetch된 원격 브랜치 노출 |
| 선택 반영 | `filterBranch`를 통해 F01 커밋 목록 범위를 전환 |
| 기본값 | `filterBranch === null`이면 현재 HEAD 브랜치를 유효 선택으로 간주 |
| Fetch 범위 | primary remote 하나만 fetch |
| 그룹 필터와의 관계 | F13 그룹 필터가 활성화되면 브랜치 선택은 UI에만 유지되고 실제 커밋 조회 인자에는 반영하지 않음 |
| 영속화 | 마지막 선택 브랜치는 Webview State의 `filter.filterBranch`에 저장 |
| 최초 로드 실패 | 섹션 본문에 에러 상태와 재시도 표시 |
| refresh 실패 | 기존 목록 유지 + Toast 에러 표시 |

---

## Error Handling

| 상황 | 발생 조건 |
|------|------|
| Git 저장소 없음 | 브랜치 목록 조회 시 워크스페이스에 Git 저장소가 없음 |
| 브랜치 로드 실패 | `git for-each-ref` 또는 refresh fetch 실패 |
| 삭제된 브랜치 복원 | 복원된 `filterBranch`가 현재 로컬 브랜치 목록에 없음 |

> 정확한 안내 메시지·CTA 문구·컴포넌트는 [blueprint.md](./blueprint.md)의 Empty / Error / Loading States가 유일한 출처다.

---

## Dependencies

- [F01_CommitLog](../F01_commit_log/spec.md) — `filterBranch`를 통해 커밋 목록 조회 범위를 바꾼다
- [F13_CommitGroups](../F13_commit_groups/spec.md) — 그룹 필터 활성 시 브랜치 범위 적용을 무시한다

---

## Related Screens

- [S02_WorkspaceScreen](../../screens/S02_history_view/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| Git 저장소 | simple-git | Extension Host에서 `git for-each-ref refs/heads`와 `refs/remotes`로 로컬/원격 브랜치 목록 조회 |
| `filter.filterBranch` | `string \| null` | Webview State에 저장되는 마지막 선택 브랜치 이름 (`main`, `origin/api` 등) |
| `Branch[]` | `name`, `scope`, `isCurrent`, `upstream`, `ahead`, `behind` | 사이드바 목록 렌더링과 선택/상태 표시 기준 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `branches` | `Branch[]` | 전역 상태 업데이트. 브랜치 목록 |
| `filterBranch` | `string \| null` | 전역 상태 업데이트. 현재 커밋 로그 범위 |
| `isLoadingBranches` | `boolean` | 최초 로딩 상태 |
| `isFetchingBranches` | `boolean` | 헤더 Fetch 액션 로딩 상태 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| 커밋 목록 재로드 | 브랜치 선택 변경 | `setFilter({ filterBranch })` → `loadCommits(true)` |
| Webview State 저장 | 브랜치 선택 변경 | `filter.filterBranch` 값 갱신 |
| Toast 표시 | refresh 실패 | 기존 브랜치 목록은 유지한 채 에러만 노출 |
