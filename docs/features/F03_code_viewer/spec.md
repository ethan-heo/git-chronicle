# Feature: F03_CodeViewer

## Related Original Sections

- [화면 구성 > S-03](../../product/product_overview.md#s-03)
- [사용자 시나리오 > 3.6 코드 뷰어](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.8 코드 뷰어](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

파일 단위로 Git diff를 unified diff 형식으로 표시하고, Shiki 신텍스 하이라이팅을 적용하여 변경 내역을 명확하게 보여준다.

---

## User Goal

선택한 파일에서 어떤 코드가 추가되고 삭제되었는지 신텍스 하이라이팅이 적용된 unified diff로 확인한다.

---

## User Scenarios

- 파일 트리(S-02) 또는 캔버스 노드(S-05)에서 [코드 보기] 버튼을 클릭하면 해당 파일의 **변경 이력(diff)** 을 확인할 수 있다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| diff 표시 방식 | unified diff 고정 (단일 컬럼, +/- 라인 표시) |
| 신텍스 하이라이팅 | Shiki 사용 (VSCode와 동일한 TextMate 문법, 필요한 언어 그래머만 동적 로드) |
| 이진 파일 | "Binary file — diff를 표시할 수 없습니다" 안내 메시지 표시 |
| 삭제된 파일 | "삭제된 파일입니다" 안내 후 삭제 전 코드 표시 |

---

## Error Handling

| 상황 | 처리 |
|------|------|
| 이진 파일 | `EmptyState` 변형: "Binary file — diff를 표시할 수 없습니다" (CTA 없음) |
| 삭제된 파일 | 안내 배너 표시 후 삭제 전 코드 전체 표시 |
| diff 로드 실패 | `ErrorState`: "diff를 불러오지 못했습니다" + [재시도] 버튼 |

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
