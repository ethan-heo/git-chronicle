# Feature: F02_ChangedFileTree

## Related Original Sections

- [화면 구성 > S-02](../../product/product_overview.md#s-02)
- [사용자 시나리오 > 3.3 이력 조회](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.7 변경 파일 트리](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

선택된 커밋에서 변경된 파일을 디렉토리 트리 구조로 표시하여, 사용자가 변경 범위를 파악하고 파일별 코드 뷰어로 진입하거나 커밋 단위 AI 정리로 이동할 수 있도록 한다.

---

## Domain Glossary

Feature 간 공유되는 용어는 [core/glossary.md](../../core/glossary.md)를 참고한다. 아래는 F02 전용 용어다.

| 용어 | 정의 | 관련 코드 식별자 |
|---|---|---|
| 파일 상태 뱃지 | `ChangedFile`의 변경 상태를 나타내는 레터 코드(`A` 추가/`M` 수정/`D` 삭제/`R` 이름 변경) | `FileStatusBadge` |
| hasSavedCommitSummary | 커밋 단위 AI 정리 저장본이 이미 존재해 `aiSummary` 패널 진입 시 즉시 표시할 수 있는지 여부 | `hasSavedCommitSummary` |

---

## User Goal

특정 커밋에서 어떤 파일이 어떻게 변경되었는지 트리 형태로 확인하고, 관심 있는 파일의 diff를 바로 연다. 파일 단위 AI 정리와 심볼 캔버스는 코드 탭 내부 토글로 이어서 연다. 필요하면 별도로 커밋 전체 AI 정리도 연다.

---

## User Scenarios

1. 선택된 커밋의 변경 파일이 **디렉토리 트리** 형태로 표시된다.
2. 파일 항목에 마우스를 호버링하면 액션 버튼이 활성화된다.
   - **[코드 보기]** → `selectedFile` 설정 후 S02 본문 `code` 패널 활성화
3. 사이드바 헤더에는 워크스페이스 패널 전환 버튼이 위치한다.
   - **[커밋 AI 정리]**(`AISummaryToggleButton`) → S02 본문 헤더의 좌측 버튼 그룹에서 `aiSummary` 패널 활성화. 해당 커밋의 AI 정리 저장본이 이미 존재하면 패널 진입 후 `AISummaryViewer`가 저장본을 즉시 표시한다.
   - **[캔버스 보기]**(`FileCanvasToggleButton`) → S02 본문 헤더의 좌측 버튼 그룹에서 `fileCanvas` 패널 활성화

> S02_WorkspaceScreen 통합 이후 코드 뷰어·AI 요약 뷰어·의존성 캔버스는 모두 독립 화면이 아니라 S02 본문의 탭 전환으로 구현된다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 파일 상태 표시 | 파일명 앞 뱃지 레터로 구분: `A` 추가 / `M` 수정 / `D` 삭제 / `R` 이름 변경 |
| 커밋 단위 저장 여부 표시 조건 | 저장 경로가 설정되어 있고, `{savePath}/{shortHash}_{sanitizedCommitMessage}/{커밋 정리 파일명}` 저장본이 존재하면 `hasSavedCommitSummary`가 `true`로 설정되어 `aiSummary` 패널 진입 시 `AISummaryViewer`가 저장본을 즉시 표시한다. 파일명 언어 분기와 구 형식 폴백은 [F07 하위 호환성](../F07_save_path_settings/spec.md#하위-호환성)을 따른다 |
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

- [F05b_AISummaryCommit](../F05b_ai_summary_commit/spec.md) — [커밋 AI 정리] 버튼
- [F03_CodeViewer](../F03_code_viewer/spec.md) — [코드 보기] 버튼

---

## Related Screens

- [S02_WorkspaceScreen](../../screens/S02_history_view/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `selectedCommit` | `Commit` | 전역 상태. 변경 파일 조회 기준 커밋 |
| `savePath` | `string \| null` | 전역 상태. 저장본 존재 여부 판단용 |
| simple-git `diff-tree --name-status --root` | `ChangedFile[]` | Extension Host에서 해당 커밋의 변경 파일 목록 추출 |
| 로컬 파일시스템 | `boolean` | 신규 저장 경로 또는 구 형식 저장 경로 존재 여부로 `hasSavedCommitSummary` 설정 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `changedFiles` | `ChangedFile[]` | 전역 상태 업데이트. 변경 파일 목록 |
| `selectedFile` | `ChangedFile` | 전역 상태 업데이트. 파일 클릭 시 설정 |
| `hasSavedCommitSummary` | `boolean` | 전역 상태 업데이트. `aiSummary` 패널의 저장본 즉시 표시 여부 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `changedFiles` 전역 상태 업데이트 | `selectedCommit` 설정 시 | 해당 커밋의 변경 파일 목록 로드 |
| S02 `code` 탭 활성화 | `selectedFile` 설정 + [코드 보기] | `openWorkspaceTab({ panelType: "code" })` |
| S02 `aiSummary` 탭 활성화 | [커밋 AI 정리] 클릭 | `openWorkspaceTab({ panelType: "aiSummary" })` |
| S02 `fileCanvas` 탭 활성화 | [캔버스 보기] 클릭 | `openWorkspaceTab({ panelType: "fileCanvas" })` |
| 코드 탭 내부 파일 AI 요약 / 심볼 캔버스 토글 | 열린 `code` 탭 내부 버튼 클릭 | `WorkspaceTab.codeInnerPanels` 반전으로 중첩 패널 on/off |
