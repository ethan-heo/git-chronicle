# GitRewind — 문서 가이드

VSCode Extension 프로젝트의 모든 문서를 목적별로 정리한 색인입니다.

---

## 빠른 탐색

| 목적 | 바로 가기 |
|------|-----------|
| 프로젝트 전체 맥락 파악 | [기획서](#기획서--제품-개요) |
| 아키텍처·기술 스택 이해 | [프로젝트 문서](#프로젝트-문서) |
| UI 설계 원칙·토큰 확인 | [코어 설계](#코어-설계) |
| 특정 기능 요구사항 조회 | [기능 문서 (Features)](#기능-문서-features) |
| 화면 레이아웃·내비게이션 구조 파악 | [화면 문서 (Screens)](#화면-문서-screens) |
| 공유 컴포넌트 Props 확인 | [core/global_components.md](core/global_components.md) |

> **문서 최소화 원칙**: 각 기능은 `spec.md`(요구사항) + `blueprint.md`(UI/컴포넌트 계약)만 영구 문서로 유지한다. AI 생성용 프롬프트나 구현 상세는 작업 시 계획서(Plan)로 생성하고 완료 후 spec/blueprint에 반영한 뒤 폐기한다. 여러 Feature가 공유하는 컴포넌트는 `core/global_components.md`에만 문서화하고, Feature 전용 컴포넌트는 해당 `blueprint.md`의 Component Definitions 섹션이 유일한 문서다.

---

## 기획서 / 제품 개요

| 파일 | 설명 |
|------|------|
| [product/product_overview.md](product/product_overview.md) | 제품 목적, 사용자 목표, 글로벌 네비게이션 모델 |

> 최초 기획 원문(`git_rewind_기획서.md`)은 삭제했다. 배경·목적·화면 구성은 `product_overview.md`가, 기능별 요구사항은 각 `features/F##_*/spec.md`가 대신하며, AI 정리 프롬프트는 `src/extension/prompts.ts`가 유일한 진실이다. 이 문서는 v1.2(2026-06-25) 스냅샷과 100% 겹치면서도 갱신되지 않아 F09/F10처럼 이후 추가된 기능을 반영하지 못했다.

---

## 프로젝트 문서

개발 환경 설정, 기술 구조, 코딩 규칙을 다룹니다.

| 파일 | 설명 |
|------|------|
| [project/architecture.md](project/architecture.md) | Feature-First 아키텍처, Extension Host / Webview 이중 런타임 구조 |
| [project/directory_structure.md](project/directory_structure.md) | `src/` 디렉토리 구성 규칙 및 파일 배치 기준 |
| [project/development_environment.md](project/development_environment.md) | 개발 환경 세팅, 빌드·실행 방법 |
| [project/release_workflow.md](project/release_workflow.md) | 로컬 릴리스 절차, CHANGELOG 생성, bumpp 설정 |
| [project/coding_standards.md](project/coding_standards.md) | TypeScript·React 코딩 컨벤션, 커밋 메시지 규칙(Conventional Commits) |
| [project/state_management.md](project/state_management.md) | 상태 관리 전략 (Zustand 스토어 구성) |
| [project/testing_strategy.md](project/testing_strategy.md) | 테스트 레벨·범위·도구 |

---

## 코어 설계

UI 전체에 일관되게 적용되는 원칙, 토큰, 규칙입니다.

| 파일 | 설명 |
|------|------|
| [core/design_principles.md](core/design_principles.md) | Information Hierarchy, Progressive Disclosure 등 설계 원칙 |
| [core/design_tokens.md](core/design_tokens.md) | 색상, 타이포그래피, 간격, 그림자 토큰 정의 |
| [core/global_components.md](core/global_components.md) | 전역 공유 컴포넌트 목록 및 사용 기준 |
| [core/interaction_model.md](core/interaction_model.md) | 호버·클릭·로딩·에러 등 인터랙션 패턴 |
| [core/naming_rules.md](core/naming_rules.md) | 파일명, 컴포넌트명, 변수명 네이밍 규칙 |

> 전역 상태 정의는 `core/state_model.md`가 아니라 [project/state_management.md](project/state_management.md) 하나로 관리한다. 이전에 있던 `core/state_model.md`는 이 문서와 대부분 중복되면서 더 stale했기 때문에 삭제했다.

---

## 기능 문서 (Features)

각 기능은 `spec` · `blueprint` 2개 파일로 구성됩니다.

| 기능 | spec | blueprint |
|------|------|-----------|
| **F01** 커밋 로그 조회·필터 | [spec](features/F01_commit_log/spec.md) | [blueprint](features/F01_commit_log/blueprint.md) |
| **F02** 변경 파일 트리 | [spec](features/F02_changed_file_tree/spec.md) | [blueprint](features/F02_changed_file_tree/blueprint.md) |
| **F03** 코드 뷰어 (Diff) | [spec](features/F03_code_viewer/spec.md) | [blueprint](features/F03_code_viewer/blueprint.md) |
| **F04** 의존성 캔버스 | [spec](features/F04_dependency_canvas/spec.md) | [blueprint](features/F04_dependency_canvas/blueprint.md) |
| **F05** AI 요약 — 파일 단위 | [spec](features/F05_ai_summary_file/spec.md) | [blueprint](features/F05_ai_summary_file/blueprint.md) |
| **F05b** AI 요약 — 커밋 단위 | [spec](features/F05b_ai_summary_commit/spec.md) | [blueprint](features/F05b_ai_summary_commit/blueprint.md) |
| **F06** AI 설정 | [spec](features/F06_ai_settings/spec.md) | [blueprint](features/F06_ai_settings/blueprint.md) |
| **F07** 저장 경로 설정 | [spec](features/F07_save_path_settings/spec.md) | [blueprint](features/F07_save_path_settings/blueprint.md) |
| **F08** 일괄 AI 요약 | [spec](features/F08_batch_ai_summary/spec.md) | [blueprint](features/F08_batch_ai_summary/blueprint.md) |
| **F09** AI 요약 Q&A | [spec](features/F09_ai_summary_qa/spec.md) | [blueprint](features/F09_ai_summary_qa/blueprint.md) |
| **F10** 파일 내부 심볼 의존성 캔버스 | [spec](features/F10_intra_file_symbol_dependency_canvas/spec.md) | [blueprint](features/F10_intra_file_symbol_dependency_canvas/blueprint.md) |

> - **spec**: 기능 요구사항 및 동작 명세
> - **blueprint**: UI 레이아웃·컴포넌트 구성 (Props·State·Interaction 포함, 개별 컴포넌트 문서를 겸함)
>
> AI 디자인/구현 생성용 프롬프트는 영구 문서로 두지 않는다. 계획(Plan) 수립 시 spec·blueprint·project·core 문서를 근거로 그때그때 생성하고, 작업 완료 후 변경 사항만 spec/blueprint에 반영한 뒤 폐기한다.

---

## 화면 문서 (Screens)

화면별 레이아웃 구조와 포함 기능을 정의합니다.

| 화면 | 파일 | 설명 |
|------|------|------|
| **S01** 커밋 목록 | [blueprint](screens/S01_commit_list/blueprint.md) | 필터 패널 + 커밋 리스트 메인 화면 |
| **S02** 커밋 히스토리 뷰 | [blueprint](screens/S02_history_view/blueprint.md) | 선택 커밋의 변경 파일 트리 화면 |
| **S03** 코드 뷰어 | [blueprint](screens/S03_code_viewer/blueprint.md) | Diff 코드 뷰어 화면 |
| **S04** AI 요약 뷰어 | [blueprint](screens/S05_ai_summary_viewer/blueprint.md) | AI 요약 결과 마크다운 뷰어 화면 (F05/F05b/F09 조합) |
| **S05** 의존성 캔버스 | [blueprint](screens/S04_dependency_canvas/blueprint.md) | 노드-엣지 의존성 그래프 화면 |
| **S06** 설정 | [blueprint](screens/S06_settings/blueprint.md) | AI 프로바이더·저장 경로 설정 화면 (F06/F07 조합) |
| **S08** 파일 내부 심볼 의존성 캔버스 | [blueprint](screens/S08_intra_file_dependency_canvas/blueprint.md) | 단일 파일 내 심볼(함수·클래스·변수 등) 간 의존 관계 그래프 + 우측 코드 패널 화면 |

> 디렉토리명과 화면 ID가 일부 어긋나 있다(S04 디렉토리 = 화면 S05, S05 디렉토리 = 화면 S04). 링크의 화면 ID를 기준으로 참고할 것.
>
> 화면 문서는 단일 Feature로 구성된 화면(S01·S02·S03·S05·S08)의 경우 진입 조건·화면 상태·내비게이션 흐름처럼 해당 Feature의 `blueprint.md`에는 없는 화면 단위 정보를 담고, 여러 Feature가 조합되는 화면(S04·S06)은 그 조합 관계 자체를 문서화한다. 이전에 존재했던 S07(코드+AI 요약 분할)은 현재 S03/S04 내부 인라인 분할 패널로 대체되어 문서를 제거했다 — 최신 동작은 `core/global_components.md`의 `ResizableSplitPane`/`SplitViewButton` 항목과 F03/F05 `blueprint.md`를 참고할 것.

---

## 공유 컴포넌트

여러 Feature가 공유하는 컴포넌트(Props·States·구현 파일)는 [core/global_components.md](core/global_components.md) 하나에만 문서화한다: `PrimaryButton`, `BackButton`, `EmptyState`, `LoadingState`, `ErrorState`, `Toast`, `FileActionButtons`, `FileStatusBadge`, `SavedBadge`, `TopHeader`, `ResizableSplitPane`, `SplitViewButton`.

Feature 전용 컴포넌트(예: `CommitListItem`, `DiffViewer`, `DependencyGraph`, `SymbolGraph` 등)는 별도 문서를 두지 않고 해당 기능 `blueprint.md`의 **Component Definitions** 섹션이 유일한 문서다.
