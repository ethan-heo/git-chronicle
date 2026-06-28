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

## User Goal

내가 작업한 특정 커밋을 날짜, 작성자, 메시지 키워드 기준으로 빠르게 찾아 상세 이력 조회로 진입한다.

---

## User Scenarios

1. 확장 프로그램 활성화 시 전체 커밋 이력이 목록 형태로 로드된다.
   - Git 저장소가 감지되지 않으면 "Git 저장소가 감지되지 않았습니다" 안내 메시지와 레포 열기 CTA가 표시된다.
2. 이력은 **커밋 생성 시간 기준 내림차순**으로 정렬된다.
3. 필터 영역에서 다음 기준으로 목록을 필터링할 수 있다.
   - **기간(날짜 범위):** `<input type="date">` × 2 (시작일 / 종료일)
   - **작성자(Author):** 드롭다운 자동완성 (커밋 로드 시 작성자 목록 추출)
   - **커밋 메시지 키워드:** 텍스트 입력창에 키워드 입력 후 300ms 디바운싱
4. 커밋 항목을 클릭하면 이력 조회 화면(S-02)으로 전환된다.
5. S-02 또는 다른 상세 화면에서 S-01로 돌아오면 이전에 적용한 필터 값을 유지한다.
6. VSCode에서 패널이 숨김 처리되어 Webview 런타임이 재생성되어도 기간·작성자·키워드 필터는 복원되고, 복원된 조건으로 커밋 목록을 다시 로드한다.
7. S-02 또는 설정 화면 등 다른 화면에서 S-01로 돌아오면 이전에 보던 커밋 목록과 스크롤 위치를 유지한다.
8. 필터 적용 결과 커밋이 없으면 "조건에 맞는 커밋이 없습니다" 안내 메시지를 표시한다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 로딩 전략 | git 명령어 레벨 필터 (`--max-count`, `--after`, `--before`, `--author`, `--grep`) + 무한 스크롤 |
| 초기 로드 | 200개. 스크롤 하단 도달 시 200개씩 추가 로드 |
| 날짜 필터 | `<input type="date">` × 2 (시작일 / 종료일) |
| 작성자 필터 | 드롭다운 선택. 커밋 로드 시 작성자 목록 추출하여 선택지 표시 |
| 키워드 검색 | 커밋 메시지 대상 (`--grep`). 입력 후 300ms 디바운싱 |
| 필터 조합 | 세 조건(기간·작성자·키워드) AND 고정 |
| 필터 상태 복원 | `vscode.getState()` / `setState()`에 필터 값만 저장하여 Webview 재생성 후 복원 |
| 목록 스크롤 복원 | S-01 재진입 시 커밋 목록이 이미 로드되어 있으면 목록은 재사용하고 스크롤 위치만 복원 |
| 정렬 | 커밋 생성 시간 기준 내림차순 고정. 사용자 변경 불가 |

---

## Error Handling

| 상황 | 처리 |
|------|------|
| Git 저장소 없음 | `EmptyState`: "Git 저장소가 감지되지 않았습니다" + "레포 열기" CTA |
| 커밋 이력 없음 | `EmptyState`: "커밋 이력이 없습니다" |
| 필터 결과 없음 | `EmptyState`: "조건에 맞는 커밋이 없습니다" |
| git 명령어 실행 실패 | `ErrorState`: "커밋 목록을 불러오지 못했습니다" + [재시도] 버튼 |
| 추가 로드 실패 | 하단 에러 메시지 표시. 이전에 로드된 목록은 유지 |

---

## Dependencies

없음 (최상위 진입 Feature)

---

## Related Screens

- [S01_CommitListScreen](../../screens/S01_commit_list/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| Git 저장소 | simple-git | Extension Host에서 현재 워크스페이스 경로 기준으로 `git log` 실행 |
| `filterDateStart` | `string \| null` | 전역 상태. `--after` 옵션으로 git 명령에 전달 |
| `filterDateEnd` | `string \| null` | 전역 상태. `--before` 옵션으로 git 명령에 전달 |
| `filterAuthor` | `string \| null` | 전역 상태. `--author` 옵션으로 git 명령에 전달 |
| `filterKeyword` | `string` | 전역 상태. `--grep` 옵션으로 git 명령에 전달 |
| `commitPage` | `number` | 전역 상태. `--max-count`, `--skip` 기반 페이지 오프셋 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `commitList` | `Commit[]` | 전역 상태 업데이트. 로드된 커밋 목록 |
| `authorList` | `string[]` | 전역 상태 업데이트. 드롭다운용 작성자 목록 (로드된 커밋에서 중복 제거 후 추출) |
| `selectedCommit` | `Commit` | 전역 상태 업데이트. 커밋 항목 클릭 시 설정 |
| `commitListScrollTop` | `number` | 전역 상태 업데이트. S-01 커밋 목록의 마지막 스크롤 위치 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `commitList` 전역 상태 업데이트 | 커밋 로드 완료 / 필터 변경 | 기존 목록 교체 또는 추가 (무한 스크롤) |
| `authorList` 전역 상태 업데이트 | 커밋 로드 완료 시 | 현재 로드된 커밋 목록에서 중복 제거 후 작성자 목록 추출 |
| `hasMoreCommits` 업데이트 | 로드 결과 < 200개 시 | 무한 스크롤 종료 신호 |
| Webview State 업데이트 | 필터 변경 / 필터 초기화 | 기간·작성자·키워드 필터만 `{ filter }` 구조로 저장. `commitList`, `selectedCommit`, 로딩 상태는 저장하지 않음 |
| S-02 화면 전환 | `selectedCommit` 설정 | `currentScreen = "S02"` 업데이트. F01 구현에서는 선택 커밋 요약 화면으로 진입하고, S02 상세 파일 트리는 F02에서 확장 |
| S-01 스크롤 복원 | S-01 재진입 | 이미 로드된 커밋이 있으면 재로드를 생략하고 저장된 `scrollTop`을 복원 |
