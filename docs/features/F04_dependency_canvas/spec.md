# Feature: F04_DependencyCanvas

## Related Original Sections

- [화면 구성 > S-02](../../product/product_overview.md#s-02)
- [사용자 시나리오 > 3.4 의존 관계 캔버스](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.3 의존 관계 캔버스](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

커밋에서 변경된 파일 간의 import/require 의존 관계를 노드-엣지 그래프로 시각화하여, 사용자가 변경 범위의 영향도와 파일 간 연결 구조를 직관적으로 파악할 수 있도록 한다.

---

## Domain Glossary

Feature 간 공유되는 용어는 [core/glossary.md](../../core/glossary.md)를 참고한다. 아래는 F04 전용 용어다.

| 용어 | 정의 | 관련 코드 식별자 |
|---|---|---|
| 감쇠(Dimmed) 엣지 | 호버 중인 노드와 연결되지 않은 엣지의 시각적 강조 해제 상태 | `graph.ts`, `LegendPanel.tsx` |
| 입력 재구성 | 선택된 커밋의 `commitHash`가 있으면 모든 변경 파일을 `git show`로 복원해 임시 디렉토리에 모으고, `commitHash`가 없을 때만 디스크의 현재 파일로 폴백하는 과정. 항상 같은 시점(커밋 스냅샷)의 파일만 섞어 분석해 파일 이동/리팩터링으로 인한 시점 불일치를 방지한다 | `analyzeDependencies()` (`dependencyService.ts`) |
| 고립 노드 | 의존 관계가 없는 변경 파일도 엣지 없이 단독 노드로 표시하는 것 | `graph.ts` |
| 자산 모듈(Asset Module) | JS/TS 코드에서 값으로 import되는 텍스트 기반 자산 파일(CSS Modules, JSON, SVG). 스스로 outgoing 의존성을 파싱하지는 않지만, JS/TS 쪽에서 이들을 가리키는 import는 엣지로 인식한다 | `isAssetModuleFile()` (`fileExtensions.ts`), `ANALYZABLE_FILE_PATTERN` (`graph.ts`) |

---

## User Goal

변경된 파일들이 서로 어떻게 의존하는지 시각적 그래프로 확인하고, 관심 있는 파일 노드에서 코드 뷰어로 진입한다.

---

## User Scenarios

1. 이력 조회 화면에서 선택된 커밋 항목의 호버 [파일 캔버스] 버튼을 클릭하면 캔버스 화면이 활성화된다.
2. 변경 파일이 **노드(Node)** 로 표시되고, 파일 간 의존 관계가 **엣지(Edge)** 로 연결된다.
3. [파일 캔버스] 진입 버튼은 선택된 커밋 항목을 호버할 때만 노출된다.
4. 노드에 마우스를 호버링하면 액션 버튼이 활성화되고, 연결된 엣지가 강조되며 비연결 엣지는 감쇠된다.
   - **[복사]** → 해당 파일 노드가 의존하는 대상 노드/엣지만 Mermaid 마크다운으로 복사
   - **[코드 보기]** → 본문 `code` 패널 활성화

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 분석 도구 | JS/TS/CJS/ESM은 `dist/depcruiser-runner.mjs`를 통한 dependency-cruiser API 실행, Python/Go는 텍스트 파싱 기반 분석. 자산 모듈(CSS Modules/JSON/SVG)은 스스로 파싱되지 않고, JS/TS 쪽 import의 엣지 대상으로만 인식 |
| 입력 재구성 | `commitHash`가 있으면 모든 변경 파일을 `git show <commitHash>:<filePath>`로 복원(커밋 시점 스냅샷 보장). `commitHash`가 없을 때만 디스크의 현재 파일로 폴백 |
| 경로 비교 | 분석 결과가 `tmpDir`/`repoPath` 절대 경로로 반환되더라도 변경 파일 집합과 비교할 수 있도록 repo-relative 경로로 정규화 |
| JS/TS 경로 해석 | `dependency-cruiser`가 `resolved` 대신 `module`만 반환하거나, `./Button`처럼 확장자 없는 상대 경로를 반환해도 같은 커밋의 변경 파일로 재해석 |
| 렌더링 라이브러리 | React Flow (MIT 라이선스, 줌·패닝·선택 인터랙션 내장) |
| 노드 범위 | 커밋에서 변경된 파일만. 의존하는 미변경 파일은 노드로 표시하지 않음 |
| 엣지 | 변경 파일 간 import / require 의존 관계 |
| 고립 노드 | 의존 관계가 없는 변경 파일도 노드로 표시 (엣지 없이 단독 노드) |
| Python/Go 파일 | 변경 파일 간 import 의존 관계를 엣지로 표시 |
| 자산 모듈 파일 | CSS Modules(`.module.css`/`.module.scss`/`.module.sass`/`.module.less`), JSON, SVG는 JS/TS import의 엣지 대상 노드로 표시(자산 모듈 자체의 outgoing 의존성은 파싱하지 않음). 순수 바이너리 자산(이미지/폰트/미디어)과 사이드이펙트 전용 일반 CSS(`.css`/`.scss` 등, 모듈 아님)는 이번 범위에서 제외 |
| JS/TS·Python/Go·자산 모듈 외 파일 | 노드로 표시하되 엣지 없음. 노드에 "의존 관계 분석 불가" 툴팁 표시 |
| 레이아웃 | 엣지가 있으면 Dagre 계층 레이아웃, 없으면 고립 파일들을 한곳에 응집한 컴팩트 클러스터 배치. 연결 그래프 안의 고립 노드도 같은 응집 규칙을 유지 |
| 인터랙션 | 노드 호버 → [복사] 아이콘 + 연결 엣지 강조 + 비연결 엣지 감쇠. [복사]는 노드 라벨을 파일명만 사용한 Mermaid 서브그래프를 생성하며, 복사한 파일에서 바깥으로 나가는 직접 의존 대상만 포함한다. 노드는 드래그로 위치 조정 가능 |
| 화면 맞춤 | 초기 렌더링 및 캔버스 크기 변경 시 `fitView()` 자동 적용 |
| 엣지 연결 | Bezier 곡선 엣지를 사용하며 노드의 상/하/좌/우 핸들 중 가장 가까운 면에서 연결 |
| 범례 패널 | 우측 하단 오버레이로 표시. 기본 상태는 접힘(`minimized`)이며 사용자가 펼치거나 다시 접을 수 있음 |

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
- [F01_CommitLog](../F01_commit_log/spec.md) — 선택된 커밋 항목 호버 [파일 캔버스] 버튼 진입점

---

## Related Screens

- [S02_WorkspaceScreen](../../screens/S02_history_view/blueprint.md) — 본문 `fileCanvas` 패널로 통합

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `changedFiles` | `ChangedFile[]` | 전역 상태. 노드로 변환될 변경 파일 목록 |
| `selectedCommit` | `Commit` | 전역 상태. 의존 관계 분석 컨텍스트, `commitHash` 복원, 헤더 표시 |
| dependency-cruiser / 텍스트 파서 | runner(JSON) 결과 / 정적 파싱 결과 | Extension Host에서 변경 파일을 임시 디렉토리로 재구성한 뒤 언어별 의존 관계 분석 실행 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `selectedFile` | `ChangedFile` | 전역 상태 업데이트. 노드 [코드 보기] 클릭 시 설정 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `selectedFile` 전역 상태 업데이트 | 노드 액션 버튼 클릭 | 선택된 파일 설정 후 패널 전환 |
| S02 `code` 탭 활성화 | [코드 보기] 클릭 | `openWorkspaceTab({ panelType: "code" })` |
