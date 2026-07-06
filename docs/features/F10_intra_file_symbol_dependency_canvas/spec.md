# Feature: F10_IntraFileSymbolDependencyCanvas

## Related Original Sections

- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

단일 파일 내부의 함수·클래스·변수·타입과, 파일이 외부 모듈에서 가져온 import 심볼까지 노드(node)로 시각화하고, 이들 간 호출·참조·상속 관계를 그래프로 탐색할 수 있도록 한다.

---

## User Goal

S02 워크스페이스의 파일 트리에서 특정 파일의 `[심볼 그래프]` 액션을 실행하면, 해당 파일 안에서 각 노드가 다른 노드를 어떻게 사용·호출하는지를 그래프로 탐색한다.

---

## User Scenarios

1. S02 파일 트리에서 지원 파일 유형의 행을 호버하면 `[심볼 그래프]` 버튼이 나타난다.
2. `[심볼 그래프]` 버튼을 클릭하면 S02 본문이 `symbolGraph` 패널로 전환된다.
3. 헤더에는 선택된 파일의 경로가 표시된다.
4. 파일 내 로컬 선언과 import 심볼이 **노드(Node)** 로 표시되고, 로컬 심볼의 의존 관계가 **엣지(Edge)** 로 연결된다.
5. 노드에 마우스를 호버링하면 연결된 엣지가 강조되고 비연결 엣지는 감쇠된다.
6. 헤더의 `[코드 보기]` 버튼을 누르면 오른쪽 코드 패널이 슬라이드 인한다.
7. 코드 패널에서 노드를 클릭하면 해당 라인 범위로 스크롤되고, 호버하면 강조만 갱신되며 스크롤은 발생하지 않는다.
8. 워크스페이스 좌측 `BackButton`을 클릭하면 S01로 복귀하고, 설정 화면(S06)에 진입했다가 돌아오면 기존 S02 워크스페이스 문맥을 유지한다.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 분석 도구 | JS/TS 계열은 TypeScript Compiler API(`typescript` 패키지), Python/Go는 정규식 기반 AST 파싱 |
| 파일 내용 가져오기 | `commitHash`가 있으면 `git show <hash>:<path>`, 없으면 현재 디스크 파일 읽기 |
| 지원 파일 유형 | JS/TS: `.mjs .cjs .js .jsx .mts .cts .ts .tsx` / Python: `.py` / Go: `.go` |
| 미지원 파일 유형 | `EmptyState`: "이 파일 유형은 심볼 분석이 지원되지 않습니다" |
| 심볼 범위 | 파일 최상위 선언(Top-level declarations)과 JS/TS `import` 심볼을 노드로 표시. 중첩 함수는 포함하지 않음 |
| 라인 범위 계산 | JS/TS는 JSDoc(`/** ... */`)을 포함한 선언 시작 라인부터 종료 토큰 라인까지, Python은 들여쓰기 기준 블록 종료 라인까지, Go는 매칭되는 닫는 `}` 라인까지 하이라이팅 범위를 계산한다 |
| 심볼 종류 | `function` / `class` / `interface` / `type` / `variable` / `constant` / `enum` |
| import 노드 | JS/TS에서 `default` / `named` / `namespace` import를 개별 노드로 생성. `modulePath`, `importKind`, `nodeCategory: "import"` 메타데이터를 포함하며 라인 범위는 import 구문 기준 |
| 엣지 종류 | `calls`(함수 호출) / `uses`(변수·타입 참조) / `extends`(클래스 상속) / `implements`(인터페이스 구현) |
| import 엣지 규칙 | 로컬 심볼이 import 심볼을 참조하면 엣지를 생성한다. import 노드끼리의 엣지는 생성하지 않는다 |
| 렌더링 라이브러리 | React Flow (`@xyflow/react`, F04와 동일) |
| 레이아웃 | 엣지가 있으면 Dagre 계층 레이아웃, 없으면 심볼 종류(kind) 그룹 기반 고정 앵커 배치. import 노드는 항상 가장 왼쪽 레인에 배치 |
| 고립 노드 | 관계가 없는 심볼도 노드로 표시 (엣지 없이 단독 노드) |
| 인터랙션 | 노드 호버 → 연결 엣지 강조 + 비연결 엣지 감쇠. 노드 드래그로 위치 조정 가능 |
| 화면 맞춤 | 초기 렌더링 시 노드/엣지 준비 완료 후 `fitView()` 1회 적용, 이후 사용자가 `CanvasControls`로 재조정 |
| 엔트리 조건 | S02 파일 트리의 JS/TS 계열 파일에서만 `[심볼 그래프]` 버튼 활성. 미지원 파일은 버튼 비활성(disabled) |
| 코드 패널 | S02 `symbolGraph` 패널 내부 우측 슬라이드 패널로 표시. 분석 시점에 파일 본문을 함께 수신하며, 개발 demo 모드도 샘플 코드를 표시한다 |
| 라인 하이라이트 | 코드 패널의 하이라이트는 심볼의 `lineStart`/`lineEnd` 범위를 그대로 사용하며, JSDoc 주석과 블록 종료 라인을 포함해 계산한다 |
| 코드 뷰어 간격 | 코드 패널은 라인 번호와 본문이 붙어 보이지 않도록 충분한 좌우 여백과 분리 컬럼을 사용한다 |
| 범례 패널 | 우측 하단 오버레이로 표시. 기본 상태는 접힘(minimized)이며 사용자가 펼칠 수 있다 |
| 옵셔널 표기 | 함수 파라미터와 interface/class 멤버의 옵셔널(`?`)은 노드와 코드 뷰어에서 그대로 표시한다 |
| import 노드 UI | `imp` 배지, 점선 테두리, 모듈 경로, import kind(`named` / `default` / `namespace`)를 표시한다 |
| 다국어 | S08의 로딩/빈 상태, 헤더의 심볼 개수 문구, 코드 패널, 범례 패널, 코드 뷰어 접근성 라벨은 `src/webview/i18n/locales/en/translation.json` 및 `ko/translation.json`의 `symbol_graph.*` 키로 관리한다 |

---

## Error Handling

| 상황 | 발생 조건 |
|------|------|
| 심볼 분석 실패 | 분석 파이프라인 실행 자체가 실패 |
| 분석 가능 심볼 없음 | `symbolNodes.length === 0` (분석은 완료) |
| 미지원 파일 유형 | 지원 확장자(JS/TS/Python/Go) 외 파일 |
| 코드 패널 비어 있음 | `fileContent`가 빈 문자열인 채로 패널이 열림 |
| 번역 누락 | F10 전용 문자열은 하드코딩하지 않고 `symbol_graph.*` 번역 키를 사용한다 |

> 정확한 안내 메시지·컴포넌트는 [blueprint.md](./blueprint.md)의 Empty States / Error States가 유일한 출처다.

---

## Dependencies

- [F02_ChangedFileTree](../F02_changed_file_tree/spec.md) — S02 파일 트리에서 진입
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
| `symbolFileContent` | `string` | 전역 상태. 코드 패널에 표시할 파일 본문 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `symbolNodes` | `SymbolNode[]` | 전역 상태. 파일 내 노드 목록 |
| `symbolEdges` | `SymbolEdge[]` | 전역 상태. 노드 간 의존 관계 목록 |
| `symbolFileContent` | `string` | 전역 상태. 코드 패널에 표시할 파일 본문 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `isLoadingSymbolGraph = true` | 분석 시작 | 로딩 상태 전환 |
| `symbolNodes`, `symbolEdges` 업데이트 | 분석 완료 | 전역 상태 설정 후 SymbolGraph 렌더링 |
| `symbolFileContent` 업데이트 | 분석 완료 | 코드 패널 렌더링용 파일 본문 저장 |
| 심볼 그래프 패널 전환 | `[심볼 그래프]` 버튼 클릭 | `activeWorkspacePanel = "symbolGraph"` |
| 설정 복귀 | S06 BackButton 클릭 | `goBackFromDetail()` → `currentScreen = "S02"` 복귀 |
| 코드 패널 열기/닫기 | `[코드 보기]` 버튼 또는 패널 닫기 버튼 클릭 | `isCodePanelOpen` 토글, 닫을 때 활성/호버 노드 초기화 |
