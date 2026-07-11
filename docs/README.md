# GitChronicle — 문서 가이드

VSCode Extension 프로젝트의 모든 문서를 목적별로 정리한 색인입니다.

---

## 빠른 탐색

| 목적 | 바로 가기 |
|------|-----------|
| 프로젝트 전체 맥락 파악 | [기획서](#기획서--제품-개요) |
| 아키텍처·기술 스택 이해 | [프로젝트 문서](#프로젝트-문서) |
| UI 설계 원칙·토큰 확인 | [코어 설계](#코어-설계) |
| 도메인 용어 확인 | [core/glossary.md](core/glossary.md) |
| 특정 기능 요구사항 조회 | [기능 문서 (Features)](#기능-문서-features) |
| 화면 레이아웃·내비게이션 구조 파악 | [화면 문서 (Screens)](#화면-문서-screens) |
| 공유 컴포넌트 Props 확인 | [core/global_components.md](core/global_components.md) |
| 문서 작성 규칙 확인 | [project/documentation_guidelines.md](project/documentation_guidelines.md) |
| 계획서(Plan) 작성 구조 확인 | [project/plan_writing_guide.md](project/plan_writing_guide.md) |

---

## 기획서 / 제품 개요

| 파일 | 설명 |
|------|------|
| [product/product_overview.md](product/product_overview.md) | 제품 목적, 사용자 목표, 글로벌 네비게이션 모델 |

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
| [project/known_issues.md](project/known_issues.md) | 문서·코드 상의 알려진 불일치·미해결 이슈 |
| [project/documentation_guidelines.md](project/documentation_guidelines.md) | `docs/` 작성·구성 규칙 |
| [project/plan_writing_guide.md](project/plan_writing_guide.md) | `docs/plans/` 임시 계획서 작성 구조·템플릿 |

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
| [core/glossary.md](core/glossary.md) | Feature 간 공유되는 핵심 도메인 용어 정의 |

---

## 기능 문서 (Features)

각 기능은 `spec` · `blueprint` 2개 파일로 구성됩니다.

| 기능 | spec | blueprint |
|------|------|-----------|
| **F01** 커밋 로그 조회·필터 | [spec](features/F01_commit_log/spec.md) | [blueprint](features/F01_commit_log/blueprint.md) |
| **F02** 변경 파일 트리 | [spec](features/F02_changed_file_tree/spec.md) | [blueprint](features/F02_changed_file_tree/blueprint.md) |
| **F03** 코드 뷰어 (Diff) | [spec](features/F03_code_viewer/spec.md) | [blueprint](features/F03_code_viewer/blueprint.md) |
| **F04** 의존성 캔버스 | [spec](features/F04_dependency_canvas/spec.md) | [blueprint](features/F04_dependency_canvas/blueprint.md) |
| **F05b** AI 요약 — 커밋 단위 | [spec](features/F05b_ai_summary_commit/spec.md) | [blueprint](features/F05b_ai_summary_commit/blueprint.md) |
| **F06** AI 설정 | [spec](features/F06_ai_settings/spec.md) | [blueprint](features/F06_ai_settings/blueprint.md) |
| **F07** 저장 경로 설정 | [spec](features/F07_save_path_settings/spec.md) | [blueprint](features/F07_save_path_settings/blueprint.md) |
| **F09** AI 요약 Q&A | [spec](features/F09_ai_summary_qa/spec.md) | [blueprint](features/F09_ai_summary_qa/blueprint.md) |
| **F10** 파일 내부 심볼 의존성 캔버스 | [spec](features/F10_intra_file_symbol_dependency_canvas/spec.md) | [blueprint](features/F10_intra_file_symbol_dependency_canvas/blueprint.md) |
| **F11** 노트 | [spec](features/F11_notes/spec.md) | [blueprint](features/F11_notes/blueprint.md) |
| **F12** GitHub PR/Issue | [spec](features/F12_github_activity/spec.md) | [blueprint](features/F12_github_activity/blueprint.md) |

---

## 화면 문서 (Screens)

화면별 레이아웃 구조와 포함 기능을 정의합니다.

| 화면 | 파일 | 설명 |
|------|------|------|
| **S02** 워크스페이스 | [blueprint](screens/S02_history_view/blueprint.md) | 사이드바 + 본문 레이아웃에서 변경 파일 트리, Diff, AI 요약, 의존성 캔버스, 심볼 그래프를 전환하는 통합 화면 |
> S01, S03, S04, S05, S06, S07, S08은 독립 화면으로 유지하지 않는다. S01은 S02 사이드바 섹션으로, S06 설정과 F11 노트는 각각 S02 사이드바 로컬 뷰/섹션과 워크스페이스 탭으로 흡수되었으며, S03/S04/S05/S08은 S02 워크스페이스 본문 패널로 통합되었다.
