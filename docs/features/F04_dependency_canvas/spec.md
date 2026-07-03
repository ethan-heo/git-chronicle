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
4. 노드에 마우스를 호버링하면 두 개의 액션 버튼이 활성화되고, 연결된 엣지가 강조되며 비연결 엣지는 감쇠된다.
   - **[코드 보기]** → 코드 뷰어(S-03) 활성화
   - **[AI 정리 보기]** → AI 정리 뷰어(S-04) 활성화

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 분석 도구 | JS/TS/CJS/ESM은 `dist/depcruiser-runner.mjs`를 통한 dependency-cruiser API 실행, Python/Go는 텍스트 파싱 기반 분석 |
| 입력 재구성 | 현재 디스크 파일은 임시 디렉토리로 복사, 누락 파일은 `git show <commitHash>:<filePath>`로 복원 후 분석 |
| 경로 비교 | 분석 결과가 `tmpDir`/`repoPath` 절대 경로로 반환되더라도 변경 파일 집합과 비교할 수 있도록 repo-relative 경로로 정규화 |
| JS/TS 경로 해석 | `dependency-cruiser`가 `resolved` 대신 `module`만 반환하거나, `./Button`처럼 확장자 없는 상대 경로를 반환해도 같은 커밋의 변경 파일로 재해석 |
| 렌더링 라이브러리 | React Flow (MIT 라이선스, 줌·패닝·선택 인터랙션 내장) |
| 노드 범위 | 커밋에서 변경된 파일만. 의존하는 미변경 파일은 노드로 표시하지 않음 |
| 엣지 | 변경 파일 간 import / require 의존 관계 |
| 고립 노드 | 의존 관계가 없는 변경 파일도 노드로 표시 (엣지 없이 단독 노드) |
| Python/Go 파일 | 변경 파일 간 import 의존 관계를 엣지로 표시 |
| JS/TS 외, Python/Go 제외 파일 | 노드로 표시하되 엣지 없음. 노드에 "의존 관계 분석 불가" 툴팁 표시 |
| 레이아웃 | 엣지가 있으면 Dagre 계층 레이아웃, 없으면 고립 파일들을 한곳에 응집한 컴팩트 클러스터 배치. 연결 그래프 안의 고립 노드도 같은 응집 규칙을 유지 |
| 인터랙션 | 노드 호버 → [코드 보기] / [AI 정리 보기] 버튼 활성화 + 연결 엣지 강조 + 비연결 엣지 감쇠. 노드는 드래그로 위치 조정 가능 |
| 화면 맞춤 | 초기 렌더링 및 캔버스 크기 변경 시 `fitView()` 자동 적용 |
| 엣지 연결 | SmoothStep 엣지를 사용하며 노드의 상/하/좌/우 핸들 중 가장 가까운 면에서 연결 |

---

## Error Handling

| 상황 | 발생 조건 |
|------|------|
| 의존 관계 분석 실패 | runner 실행 자체가 실패 |
| dependency-cruiser 실행 파일 없음 | `dist/depcruiser-runner.mjs` 의존 모듈 미설치 |
| 변경 파일 없음 | `changedFiles.length === 0` |
| JS/TS 외, Python/Go 제외 파일 | 지원하지 않는 언어의 파일 |

> 정확한 안내 메시지·컴포넌트는 [blueprint.md](./blueprint.md)의 Empty States / Error States가 유일한 출처다.

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
| dependency-cruiser / 텍스트 파서 | runner(JSON) 결과 / 정적 파싱 결과 | Extension Host에서 변경 파일을 임시 디렉토리로 재구성한 뒤 언어별 의존 관계 분석 실행 |

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
