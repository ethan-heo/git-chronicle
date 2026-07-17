# Feature: F13_CommitGroups

## Related Original Sections

- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

사용자가 커밋 목록에서 여러 커밋을 직접 선택해 이름 붙인 그룹으로 저장하고, 그룹을 선택하면 해당 커밋만 필터링된 목록에서 다시 빠르게 찾을 수 있도록 한다. 커밋 수가 많아질수록 날짜 기준 자동 그룹핑만으로는 특정 커밋들을 다시 찾기 어렵다는 문제를 해결한다.

---

## Domain Glossary

Feature 간 공유되는 용어는 [core/glossary.md](../../core/glossary.md)를 참고한다. 아래는 F13 전용 용어다.

| 용어 | 정의 | 관련 코드 식별자 |
|---|---|---|
| 선택 모드(Select Mode) | 커밋 목록의 각 항목에 체크박스가 나타나 다중 선택이 가능해지는 모드. 기존 단일 커밋 클릭(상세 보기) 동작과 독립적으로 공존한다 | `isSelectModeActive`, `SelectModeToggleButton` |
| 그룹 필터(Group Filter) | `filterGroupId`로 커밋 목록을 특정 그룹의 커밋으로만 제한하는 필터. 날짜·작성자·키워드 필터와 AND로 결합된다 | `filterGroupId`, `CommitGroupFilterDropdown` |

---

## User Goal

내가 직접 고른 여러 커밋을 이름 붙인 그룹으로 저장해두고, 나중에 그룹을 선택하는 것만으로 같은 커밋들을 다시 빠르게 목록에서 찾는다.

---

## User Scenarios

1. `CommitsSection` 헤더의 선택 모드 토글 버튼을 누르면 모든 `CommitListItem`에 체크박스가 나타난다.
   - 체크박스 선택과 무관하게 항목 클릭은 기존처럼 단일 커밋 선택(상세 보기)으로 동작한다.
2. 하나 이상의 커밋을 체크하면 목록 상단 액션 바에 선택된 개수가 표시된다. 이름을 입력하고 저장하면 새 그룹이 생성되고 선택 모드가 종료된다.
3. `CommitsSection` 헤더의 그룹 필터 토글 버튼을 누르면 저장된 그룹 목록과 "전체"(필터 해제) 옵션이 있는 팝오버가 열린다.
   - 그룹을 선택하면 해당 그룹의 커밋만 목록에 표시된다. 이미 적용된 날짜/작성자/키워드 필터와는 AND로 결합된다.
4. 그룹 행의 편집(연필) 아이콘을 누르면 선택 모드로 전환되고, 기존 그룹 필터는 해제되어 전체 커밋 목록에서 다시 커밋을 고를 수 있다. 기존에 그룹에 속했던 커밋은 미리 체크된 상태로 시작한다.
   - 이름과 체크 상태를 바꾼 뒤 저장하면 그룹의 이름과 커밋 구성이 함께 갱신된다.
5. 그룹 행의 삭제(휴지통) 아이콘은 인라인 재클릭 확인 방식이다. 삭제된 그룹이 현재 활성 필터였다면 필터가 자동으로 해제되고 전체 목록으로 복귀한다.
6. 그룹 데이터는 현재 워크스페이스에 종속되어 저장되며, VSCode 창을 껐다 켜도(Webview 재생성) 유지된다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 선택 모드 진입점 | `CommitsSection` 헤더의 전용 토글 버튼(`SelectModeToggleButton`). 커밋 항목 호버 액션이 아니다 |
| 그룹 생성 | 선택된 커밋이 1개 이상이고 이름이 비어있지 않아야 생성 가능 |
| 그룹 필터 결합 | 날짜·작성자·키워드 필터와 AND로 고정 (F01의 "세 조건 AND 고정" 규칙의 네 번째 조건으로 확장) |
| 그룹 필터 로딩 전략 | git 명령어 레벨에서 `--no-walk=sorted`로 그룹의 커밋 해시만 조회. 무한 스크롤 페이지네이션은 적용하지 않고 한 번에 전체를 반환한다(`hasMore: false`) |
| 그룹 편집 | 이름 변경과 커밋 추가/제거를 모두 지원한다(불변 스냅샷이 아니다). 편집 진입 시 그룹 필터는 해제되어 전체 목록에서 다시 고를 수 있다 |
| 그룹 삭제 | 인라인 재클릭 확인 방식. 삭제 대상이 현재 활성 필터였다면 필터도 함께 해제된다 |
| 데이터 저장 위치 | 현재 워크스페이스에 종속된 `ExtensionContext.workspaceState`(`gitChronicle.commitGroups`). Git 저장소 파일로는 저장되지 않는다 |

---

## Error Handling

| 상황 | 발생 조건 |
|------|------|
| 그룹 생성 실패 | 이름이 비어있거나 선택된 커밋이 없음 |
| 그룹 수정 실패 | 대상 그룹을 찾을 수 없음(다른 세션에서 이미 삭제된 경우 등) |
| 그룹 삭제 실패 | 삭제 요청에 `id`가 없음 |

> 실패 시 토스트 메시지는 [blueprint.md](./blueprint.md)가 유일한 출처다.

---

## Dependencies

- [F01_CommitLog](../F01_commit_log/spec.md) — 커밋 목록/필터 파이프라인을 공유하고, `CommitListItem`에 체크박스를 追加한다

---

## Related Screens

- [S02_WorkspaceScreen](../../screens/S02_history_view/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `commitGroups` | `CommitGroup[]` | 전역 상태. 현재 워크스페이스에 저장된 그룹 목록 |
| `filterGroupId` | `string \| null` | 전역 상태. `FilterState`의 다섯 번째 필드. 활성 그룹 필터 |
| `ExtensionContext.workspaceState` | `gitChronicle.commitGroups` | Host가 그룹 목록을 영속화하는 저장소 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `commitGroups` | `CommitGroup[]` | 전역 상태 업데이트. 그룹 생성/수정/삭제 시 갱신 |
| `filterGroupId` | `string \| null` | 전역 상태 업데이트. 그룹 필터 선택/해제 시 갱신 → 커밋 목록 재로드 |
| `isSelectModeActive` / `selectedCommitHashesForGroup` / `editingGroupId` | 전역 상태 업데이트 | 선택 모드 진행 상태 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `CREATE_COMMIT_GROUP` / `UPDATE_COMMIT_GROUP` / `DELETE_COMMIT_GROUP` 메시지 전송 | 그룹 저장/삭제 액션 | Host가 `workspaceState`에 반영 후 `COMMIT_GROUPS_LOADED`로 전체 목록을 다시 내려준다 |
| 커밋 목록 재로드 | `filterGroupId` 변경 | 기존 `setFilter` → `loadCommits(true)` 파이프라인을 그대로 재사용 |
