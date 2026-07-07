# Feature: F03_CodeViewer

## Related Original Sections

- [화면 구성 > S-03](../../product/product_overview.md#s-03)
- [사용자 시나리오 > 3.6 코드 뷰어](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.8 코드 뷰어](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

파일 단위로 Git diff를 unified diff 형식으로 표시하고, Shiki 신텍스 하이라이팅을 적용하여 변경 내역을 명확하게 보여준다. 현재 구현은 파일 전체를 표시하되 변경 라인을 색상으로 강조한다.

---

## User Goal

선택한 파일에서 어떤 코드가 추가되고 삭제되었는지 신텍스 하이라이팅이 적용된 unified diff로 확인한다.

---

## User Scenarios

- 파일 트리(S-02) 또는 캔버스 노드(S-05)에서 [코드 보기] 버튼을 클릭하면 해당 파일의 **변경 이력(diff)** 을 확인할 수 있다.
- 코드 뷰어(S-03) 헤더의 [AI 요약 함께 보기] 버튼을 클릭하면 같은 파일을 유지한 채 우측 AI 요약 패널이 인라인으로 슬라이드 인한다.
- 다른 파일로 다시 진입할 때는 이전 커밋/파일 요약 상태를 초기화하고, 스플릿 패널은 현재 파일 기준으로 새 요약을 생성한다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| diff 표시 방식 | unified diff 고정 (단일 컬럼, +/- 라인 표시, 파일 전체 표시, 변경 없는 긴 컨텍스트 구간은 기본 접힘 · 클릭으로 펼치기 가능) |
| 신텍스 하이라이팅 | Shiki 사용 (VSCode와 동일한 TextMate 문법, 필요한 언어 그래머만 동적 로드) |
| 이진 파일 | "Binary file — diff를 표시할 수 없습니다" 안내 메시지 표시 |
| 삭제된 파일 | "삭제된 파일입니다" 안내 후 삭제 전 코드 표시 |
| 첫 변경 라인 이동 | diff 로드 후 첫 추가/삭제 라인으로 자동 스크롤 |
| 마크다운 복사 | diff 라인을 마우스로 드래그해 범위를 선택하면 드래그 종료 지점 근처에 복사 아이콘이 나타나고, 클릭 시 해당 범위를 마크다운으로 복사 |
| 메시지 수신 안정성 | Webview는 diff 요청 전에 `FILE_DIFF_LOADED` / `FILE_DIFF_LOAD_FAILED` 수신 리스너를 활성화해야 한다 |

---

## Error Handling

| 상황 | 발생 조건 |
|------|------|
| 이진 파일 | `isBinary === true` |
| 삭제된 파일 | 파일 상태가 삭제(`D`) |
| diff 로드 실패 | `git show` 실행 자체가 실패 |
| diff 후처리 실패 | 하이라이팅 또는 후속 가공 중 예외 발생 |

> 정확한 안내 메시지·컴포넌트는 [blueprint.md](./blueprint.md)의 Empty States / Error States가 유일한 출처다.

---

## Dependencies

- [F02_ChangedFileTree](../F02_changed_file_tree/spec.md) — `selectedFile` 제공
- [F04_DependencyCanvas](../F04_dependency_canvas/spec.md) — 캔버스 노드에서도 진입 가능

---

## Related Screens

- [S03_CodeViewerScreen](../../screens/S03_code_viewer/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `selectedFile` | `ChangedFile` | 전역 상태. 표시할 파일 경로와 상태 |
| `selectedCommit` | `Commit` | 전역 상태. 헤더 컨텍스트 표시 및 diff 추출 기준 |
| simple-git `show` | `string` | Extension Host에서 `{hash}:{file}` 형식으로 파일 diff 추출 |
| Shiki 그래머 | 동적 로드 | 파일 확장자에서 언어를 추론하여 필요한 그래머만 로드 |

---

## Outputs

없음 (읽기 전용 뷰어. 전역 상태를 변경하지 않음)

---

## Side Effects

없음 (뷰어 전용. 전역 상태 변경, 파일 저장, 외부 호출 없음)
