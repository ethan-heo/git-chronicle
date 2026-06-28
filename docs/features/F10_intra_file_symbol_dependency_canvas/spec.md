# Feature: F10_IntraFileSymbolDependencyCanvas

## Related Original Sections

- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

단일 파일 내부의 함수·클래스·변수·타입 등 노드(node) 간 호출·참조·상속 관계를 노드-엣지 그래프로 시각화하여, 사용자가 파일의 내부 구조와 노드 간 결합도를 직관적으로 파악할 수 있도록 한다.

---

## User Goal

S05 의존성 캔버스에서 특정 파일 노드를 선택하면, 해당 파일 안에서 각 노드가 다른 노드를 어떻게 사용·호출하는지를 그래프로 탐색한다.

---

## User Scenarios

1. S05 캔버스에서 파일 노드를 호버하거나 클릭하면 `[심볼 그래프]` 버튼이 나타난다.
2. `[심볼 그래프]` 버튼을 클릭하면 S08 화면으로 전환된다.
3. 헤더에는 선택된 파일의 경로가 표시된다.
4. 파일 내 노드들이 **노드(Node)** 로 표시되고, 노드 간 의존 관계가 **엣지(Edge)** 로 연결된다.
5. 노드에 마우스를 호버링하면 연결된 엣지가 강조되고 비연결 엣지는 감쇠된다.
6. BackButton을 클릭하면 이전 화면(S05)으로 복귀한다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 분석 도구 | JS/TS 계열은 TypeScript Compiler API(`typescript` 패키지), Python/Go는 정규식 기반 AST 파싱 |
| 파일 내용 가져오기 | `commitHash`가 있으면 `git show <hash>:<path>`, 없으면 현재 디스크 파일 읽기 |
| 지원 파일 유형 | JS/TS: `.mjs .cjs .js .jsx .mts .cts .ts .tsx` / Python: `.py` / Go: `.go` |
| 미지원 파일 유형 | `EmptyState`: "이 파일 유형은 심볼 분석이 지원되지 않습니다" |
| 심볼 범위 | 파일 최상위 선언(Top-level declarations)만 노드로 표시. 중첩 함수는 포함하지 않음 |
| 심볼 종류 | `function` / `class` / `interface` / `type` / `variable` / `constant` / `enum` |
| 엣지 종류 | `calls`(함수 호출) / `uses`(변수·타입 참조) / `extends`(클래스 상속) / `implements`(인터페이스 구현) |
| 렌더링 라이브러리 | React Flow (`@xyflow/react`, F04와 동일) |
| 레이아웃 | 엣지가 있으면 Dagre 계층 레이아웃, 없으면 심볼 종류(kind) 그룹 기반 고정 앵커 배치 |
| 고립 노드 | 관계가 없는 심볼도 노드로 표시 (엣지 없이 단독 노드) |
| 인터랙션 | 노드 호버 → 연결 엣지 강조 + 비연결 엣지 감쇠. 노드 드래그로 위치 조정 가능 |
| 화면 맞춤 | 초기 렌더링 및 캔버스 크기 변경 시 `fitView()` 자동 적용 |
| 엔트리 조건 | S05의 JS/TS/Python/Go 파일 노드에서만 `[심볼 그래프]` 버튼 활성. 미지원 파일은 버튼 비활성(disabled) |

---

## Error Handling

| 상황 | 처리 |
|------|------|
| 심볼 분석 실패 | `ErrorState`: "심볼을 분석하지 못했습니다" + [재시도] 버튼 |
| 분석 가능 심볼 없음 | `EmptyState`: "분석 가능한 심볼이 없습니다" |
| 미지원 파일 유형 | `EmptyState`: "이 파일 유형은 심볼 분석이 지원되지 않습니다" |

---

## Dependencies

- [F04_DependencyCanvas](../F04_dependency_canvas/spec.md) — S05에서 진입. `selectedFile` 재사용
- [F02_ChangedFileTree](../F02_changed_file_tree/spec.md) — `changedFiles` 컨텍스트

---

## Related Screens

- [S08_IntraFileSymbolDependencyCanvasScreen](../../screens/S08_intra_file_dependency_canvas/blueprint.md)

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `selectedFileForSymbolGraph` | `ChangedFile` | 전역 상태. 분석 대상 파일 |
| `selectedCommit` | `Commit` | 전역 상태. `commitHash` 파일 복원 컨텍스트 |
| TypeScript Compiler API / 정규식 파서 | AST 분석 결과 | Extension Host에서 파일 내용을 파싱하여 심볼 및 관계 추출 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `symbolNodes` | `SymbolNode[]` | 전역 상태. 파일 내 노드 목록 |
| `symbolEdges` | `SymbolEdge[]` | 전역 상태. 노드 간 의존 관계 목록 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `isLoadingSymbolGraph = true` | 분석 시작 | 로딩 상태 전환 |
| `symbolNodes`, `symbolEdges` 업데이트 | 분석 완료 | 전역 상태 설정 후 SymbolGraph 렌더링 |
| S08 화면 전환 | `[심볼 그래프]` 버튼 클릭 | `currentScreen = "S08"`, `previousScreen = "S05"` |
| S05 복귀 | S08 BackButton 클릭 | `goBackFromDetail()` → `previousScreen`으로 복귀 |
