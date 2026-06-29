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
| 화면 레이아웃 구조 파악 | [화면 문서 (Screens)](#화면-문서-screens) |
| 컴포넌트 Props·동작 확인 | [컴포넌트 문서](#컴포넌트-문서) |

---

## 기획서 / 제품 개요

| 파일 | 설명 |
|------|------|
| [git_rewind_기획서.md](git_rewind_기획서.md) | 최초 기획 원문. 배경, 목표, 전체 기능 범위 |
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
| [core/state_model.md](core/state_model.md) | UI 상태 모델 (로딩·에러·빈 상태 처리 기준) |

---

## 기능 문서 (Features)

각 기능은 `spec` · `blueprint` · `design_prompt` · `implementation_prompt` 4개 파일로 구성됩니다.

| 기능 | spec | blueprint | design_prompt | implementation_prompt |
|------|------|-----------|---------------|-----------------------|
| **F01** 커밋 로그 조회·필터 | [spec](features/F01_commit_log/spec.md) | [blueprint](features/F01_commit_log/blueprint.md) | [design](features/F01_commit_log/design_prompt.md) | [impl](features/F01_commit_log/implementation_prompt.md) |
| **F02** 변경 파일 트리 | [spec](features/F02_changed_file_tree/spec.md) | [blueprint](features/F02_changed_file_tree/blueprint.md) | [design](features/F02_changed_file_tree/design_prompt.md) | [impl](features/F02_changed_file_tree/implementation_prompt.md) |
| **F03** 코드 뷰어 (Diff) | [spec](features/F03_code_viewer/spec.md) | [blueprint](features/F03_code_viewer/blueprint.md) | [design](features/F03_code_viewer/design_prompt.md) | [impl](features/F03_code_viewer/implementation_prompt.md) |
| **F04** 의존성 캔버스 | [spec](features/F04_dependency_canvas/spec.md) | [blueprint](features/F04_dependency_canvas/blueprint.md) | [design](features/F04_dependency_canvas/design_prompt.md) | [impl](features/F04_dependency_canvas/implementation_prompt.md) |
| **F05** AI 요약 — 파일 단위 | [spec](features/F05_ai_summary_file/spec.md) | [blueprint](features/F05_ai_summary_file/blueprint.md) | [design](features/F05_ai_summary_file/design_prompt.md) | [impl](features/F05_ai_summary_file/implementation_prompt.md) |
| **F05b** AI 요약 — 커밋 단위 | [spec](features/F05b_ai_summary_commit/spec.md) | [blueprint](features/F05b_ai_summary_commit/blueprint.md) | [design](features/F05b_ai_summary_commit/design_prompt.md) | [impl](features/F05b_ai_summary_commit/implementation_prompt.md) |
| **F06** AI 설정 | [spec](features/F06_ai_settings/spec.md) | [blueprint](features/F06_ai_settings/blueprint.md) | [design](features/F06_ai_settings/design_prompt.md) | [impl](features/F06_ai_settings/implementation_prompt.md) |
| **F07** 저장 경로 설정 | [spec](features/F07_save_path_settings/spec.md) | [blueprint](features/F07_save_path_settings/blueprint.md) | [design](features/F07_save_path_settings/design_prompt.md) | [impl](features/F07_save_path_settings/implementation_prompt.md) |
| **F08** 일괄 AI 요약 | [spec](features/F08_batch_ai_summary/spec.md) | [blueprint](features/F08_batch_ai_summary/blueprint.md) | [design](features/F08_batch_ai_summary/design_prompt.md) | [impl](features/F08_batch_ai_summary/implementation_prompt.md) |
| **F09** AI 요약 Q&A | [spec](features/F09_ai_summary_qa/spec.md) | [blueprint](features/F09_ai_summary_qa/blueprint.md) | - | - |
| **F10** 파일 내부 심볼 의존성 캔버스 | [spec](features/F10_intra_file_symbol_dependency_canvas/spec.md) | [blueprint](features/F10_intra_file_symbol_dependency_canvas/blueprint.md) | [design](features/F10_intra_file_symbol_dependency_canvas/design_prompt.md) | [impl](features/F10_intra_file_symbol_dependency_canvas/implementation_prompt.md) |

> - **spec**: 기능 요구사항 및 동작 명세
> - **blueprint**: UI 레이아웃·컴포넌트 구성
> - **design_prompt**: AI 디자인 생성용 프롬프트
> - **implementation_prompt**: AI 구현 생성용 프롬프트

---

## 화면 문서 (Screens)

화면별 레이아웃 구조와 포함 기능을 정의합니다.

| 화면 | 파일 | 설명 |
|------|------|------|
| **S01** 커밋 목록 | [blueprint](screens/S01_commit_list/blueprint.md) | 필터 패널 + 커밋 리스트 메인 화면 |
| **S02** 커밋 히스토리 뷰 | [blueprint](screens/S02_history_view/blueprint.md) | 선택 커밋의 변경 파일 트리 화면 |
| **S03** 코드 뷰어 | [blueprint](screens/S03_code_viewer/blueprint.md) | Diff 코드 뷰어 화면 |
| **S04** AI 요약 뷰어 | [blueprint](screens/S05_ai_summary_viewer/blueprint.md) | AI 요약 결과 마크다운 뷰어 화면 |
| **S05** 의존성 캔버스 | [blueprint](screens/S04_dependency_canvas/blueprint.md) | 노드-엣지 의존성 그래프 화면 |
| **S06** 설정 | [blueprint](screens/S06_settings/blueprint.md) | AI 프로바이더·저장 경로 설정 화면 |
| **S07** 코드 + AI 요약 분할 | [blueprint](screens/S07_code_and_ai_summary/blueprint.md) | 코드 diff와 AI 요약을 좌우 분할로 동시에 보는 화면 |
| **S08** 파일 내부 심볼 의존성 캔버스 | [blueprint](screens/S08_intra_file_dependency_canvas/blueprint.md) | 단일 파일 내 심볼(함수·클래스·변수 등) 간 의존 관계 그래프 + 우측 코드 패널 화면 |

---

## 컴포넌트 문서

UI 컴포넌트별 Props 정의, 동작 명세, 사용 예시입니다.

### 레이아웃 / 네비게이션

| 파일 | 설명 |
|------|------|
| [components/TopHeader.md](components/TopHeader.md) | 화면 상단 고정 헤더 (타이틀·컨텍스트 표시) |
| [components/BackButton.md](components/BackButton.md) | 이전 화면으로 돌아가는 뒤로가기 버튼 |

### 상태 표시

| 파일 | 설명 |
|------|------|
| [components/LoadingState.md](components/LoadingState.md) | 데이터 로딩 중 스피너·메시지 표시 |
| [components/ErrorState.md](components/ErrorState.md) | 에러 발생 시 안내 메시지 표시 |
| [components/EmptyState.md](components/EmptyState.md) | 데이터 없음 상태 안내 표시 |
| [components/Toast.md](components/Toast.md) | 일시적 알림 토스트 메시지 |

### 커밋 목록

| 파일 | 설명 |
|------|------|
| [components/CommitListItem.md](components/CommitListItem.md) | 커밋 목록 개별 행 (해시·메시지·날짜·작성자) |
| [components/CommitFilterPanel.md](components/CommitFilterPanel.md) | 기간·작성자·포함/제외 키워드·정렬 필터 패널 |

### 파일 트리

| 파일 | 설명 |
|------|------|
| [components/FileTreeNode.md](components/FileTreeNode.md) | 파일 트리 개별 노드 (폴더·파일 재귀 렌더링) |
| [components/FileNode.md](components/FileNode.md) | 파일 항목 (상태 배지·액션 버튼 포함) |
| [components/FileStatusBadge.md](components/FileStatusBadge.md) | 파일 변경 상태 배지 (Added·Modified·Deleted) |
| [components/FileActionButtons.md](components/FileActionButtons.md) | 호버 시 노출되는 파일 액션 버튼 그룹 |

### AI 요약

| 파일 | 설명 |
|------|------|
| [components/AISummaryViewer.md](components/AISummaryViewer.md) | AI 요약 마크다운 뷰어 (스트리밍 타이핑 효과 + 질문 입력 영역) |
| [components/AIProviderButton.md](components/AIProviderButton.md) | AI 프로바이더 선택 버튼 (Claude·GPT 등) |
| [components/BatchProgressBar.md](components/BatchProgressBar.md) | 일괄 AI 요약 진행률 표시 바 |
| [components/ResizableSplitPane.md](components/ResizableSplitPane.md) | 좌우 패널 분할 및 드래그 리사이즈 컨테이너 |
| [components/SplitViewButton.md](components/SplitViewButton.md) | 코드/요약 분할 화면 진입용 아이콘 버튼 |

### 의존성 캔버스

| 파일 | 설명 |
|------|------|
| [components/DependencyGraph.md](components/DependencyGraph.md) | 노드-엣지 의존성 그래프 캔버스 컨테이너 |
| [components/DependencyEdge.md](components/DependencyEdge.md) | 의존성 그래프 엣지 (방향·라벨) |

### 파일 내부 심볼 캔버스

| 파일 | 설명 |
|------|------|
| [components/SymbolGraph.md](components/SymbolGraph.md) | 파일 내부 심볼 의존성 그래프 캔버스 컨테이너 |
| [components/SymbolLegendPanel.md](components/SymbolLegendPanel.md) | 심볼 그래프 범례 패널 |
| [components/SymbolCodePanel.md](components/SymbolCodePanel.md) | 우측 슬라이드 인 코드 패널 |
| [components/SymbolFileCodeViewer.md](components/SymbolFileCodeViewer.md) | Shiki 기반 코드 뷰어 및 라인 강조 |

### 설정

| 파일 | 설명 |
|------|------|
| [components/SavePathSelector.md](components/SavePathSelector.md) | AI 요약 저장 경로 선택기 |
| [components/SavedBadge.md](components/SavedBadge.md) | 저장 완료 상태 배지 |

### 공통 UI

| 파일 | 설명 |
|------|------|
| [components/PrimaryButton.md](components/PrimaryButton.md) | 주요 액션 버튼 (공통 스타일) |
