# Feature: F04_DependencyCanvas

## Related Original Sections

- [화면 구성 > S-05](../../product/product_overview.md#s-05)
- [사용자 시나리오 > 3.4 의존 관계 캔버스](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.3 의존 관계 캔버스](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

커밋에서 변경된 파일 간의 import/require 의존 관계를 노드-엣지 그래프로 시각화하여, 사용자가 변경 범위의 영향도와 파일 간 연결 구조를 직관적으로 파악할 수 있도록 한다.

---

## User Goal

변경된 파일들이 서로 어떻게 의존하는지 시각적 그래프로 확인하고, 관심 있는 파일 노드에서 코드 뷰어 또는 AI 정리 뷰어로 진입한다.

---

## User Scenarios

1. 이력 조회 화면에서 [캔버스 보기] 버튼을 클릭하면 캔버스 화면이 활성화된다.
2. 변경 파일이 **노드(Node)** 로 표시되고, 파일 간 의존 관계가 **엣지(Edge)** 로 연결된다.
3. 변경 파일 로딩이 끝나기 전에는 [캔버스 보기] 버튼이 로딩 상태로 표시되어 조기 진입을 방지한다.
4. 노드에 마우스를 호버링하면 두 개의 액션 버튼이 활성화되고, 연결된 엣지가 강조된다.
   - **[코드 보기]** → 코드 뷰어(S-03) 활성화
   - **[AI 정리 보기]** → AI 정리 뷰어(S-04) 활성화

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 분석 도구 | dependency-cruiser (JS/TS/CJS/ESM, TypeScript path alias 지원) |
| 입력 재구성 | 현재 디스크 파일은 임시 디렉토리로 복사, 누락 파일은 `git show <commitHash>:<filePath>`로 복원 후 분석 |
| 렌더링 라이브러리 | React Flow (MIT 라이선스, 줌·패닝·선택 인터랙션 내장) |
| 노드 범위 | 커밋에서 변경된 파일만. 의존하는 미변경 파일은 노드로 표시하지 않음 |
| 엣지 | 변경 파일 간 import / require 의존 관계 |
| 고립 노드 | 의존 관계가 없는 변경 파일도 노드로 표시 (엣지 없이 단독 노드) |
| JS/TS 외 파일 | 노드로 표시하되 엣지 없음. 노드에 "의존 관계 분석 불가" 툴팁 표시 |
| 레이아웃 | 확장자 그룹 기반 고정 앵커 배치. 확장자 그룹은 수평으로 나누고, 같은 확장자 파일은 왼쪽 면을 맞춰 수직으로 배치 |
| 인터랙션 | 노드 호버 → [코드 보기] / [AI 정리 보기] 버튼 활성화 + 연결 엣지 강조. 노드는 드래그로 위치 조정 가능 |
| 화면 맞춤 | 초기 렌더링 및 캔버스 크기 변경 시 `fitView()` 자동 적용 |
| 엣지 연결 | 직선 엣지를 유지하되 노드의 상/하/좌/우 핸들 중 가장 가까운 면에서 연결 |

---

## Error Handling

| 상황 | 처리 |
|------|------|
| 의존 관계 분석 실패 | `ErrorState`: "의존 관계를 분석하지 못했습니다" + [재시도] 버튼 |
| dependency-cruiser 실행 파일 없음 | `ErrorState`: "dependency-cruiser가 설치되지 않았습니다. pnpm install 후 다시 시도해주세요." + [재시도] 버튼 |
| 변경 파일 없음 | `EmptyState`: "변경된 파일이 없습니다" |
| JS/TS 외 파일 | 노드로 표시 + "의존 관계 분석 불가" 툴팁 |

---

## Dependencies

- [F02_ChangedFileTree](../F02_changed_file_tree/spec.md) — `changedFiles` 제공
- [F03_CodeViewer](../F03_code_viewer/spec.md) — 노드 호버 [코드 보기] 진입
- [F05_AISummaryFile](../F05_ai_summary_file/spec.md) — 노드 호버 [AI 정리 보기] 진입

---

## Related Screens

- [S05_DependencyCanvasScreen](../../screens/S04_dependency_canvas/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `changedFiles` | `ChangedFile[]` | 전역 상태. 노드로 변환될 변경 파일 목록 |
| `selectedCommit` | `Commit` | 전역 상태. 의존 관계 분석 컨텍스트, `commitHash` 복원, 헤더 표시 |
| `previousScreen` | `ScreenID \| null` | S05에서 S03/S04로 진입한 뒤 뒤로가기 목적지 보존 |
| dependency-cruiser | CLI 실행 결과 | Extension Host에서 변경 파일을 임시 디렉토리로 재구성한 뒤 의존 관계 분석 실행 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `selectedFile` | `ChangedFile` | 전역 상태 업데이트. 노드 [코드 보기]/[AI 정리 보기] 클릭 시 설정 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `selectedFile` 전역 상태 업데이트 | 노드 액션 버튼 클릭 | 선택된 파일 설정 후 화면 전환 |
| S-03 화면 전환 | [코드 보기] 클릭 | `currentScreen = "S03"`, `previousScreen = "S05"` |
| S-04 화면 전환 | [AI 정리 보기] 클릭 | `currentScreen = "S04"`, `summaryMode = "file"`, `previousScreen = "S05"` |
| S-05 화면 복귀 | S03/S04 뒤로가기 | `currentScreen = previousScreen`, 이후 `previousScreen = null` |
