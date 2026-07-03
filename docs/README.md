# GitChronicle — 문서 가이드

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
| 문서 작성 규칙 확인 | [project/documentation_guidelines.md](project/documentation_guidelines.md) |

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

---

## 화면 문서 (Screens)

화면별 레이아웃 구조와 포함 기능을 정의합니다.

| 화면 | 파일 | 설명 |
|------|------|------|
| **S01** 커밋 목록 | [blueprint](screens/S01_commit_list/blueprint.md) | 필터 패널 + 커밋 리스트 메인 화면 |
| **S02** 커밋 히스토리 뷰 | [blueprint](screens/S02_history_view/blueprint.md) | 선택 커밋의 변경 파일 트리 화면 |
| **S03** 코드 뷰어 | [blueprint](screens/S03_code_viewer/blueprint.md) | Diff 코드 뷰어 화면 |
| **S04** AI 요약 뷰어 | [blueprint](screens/S05_ai_summary_viewer/blueprint.md) | AI 요약 결과 마크다운 뷰어 화면 (F05b/F09 조합) |
| **S05** 의존성 캔버스 | [blueprint](screens/S04_dependency_canvas/blueprint.md) | 노드-엣지 의존성 그래프 화면 |
| **S06** 설정 | [blueprint](screens/S06_settings/blueprint.md) | AI 프로바이더·저장 경로 설정 화면 (F06/F07 조합) |
| **S08** 파일 내부 심볼 의존성 캔버스 | [blueprint](screens/S08_intra_file_dependency_canvas/blueprint.md) | 단일 파일 내 심볼(함수·클래스·변수 등) 간 의존 관계 그래프 + 우측 코드 패널 화면 |

> 디렉토리명과 화면 ID가 일부 어긋나 있다 — 자세한 내용은 [project/known_issues.md](project/known_issues.md) 참고.
