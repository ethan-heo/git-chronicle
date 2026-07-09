# Product Overview: GitChronicle

> **요약:** GitChronicle의 제품 목적, 사용자 목표, 화면 전환 모델(S01~S07), 전역 비즈니스 규칙, 전체 Feature 목록을 정의한다. 새 기능을 기획하거나 화면 흐름·Feature 관계를 파악할 때 가장 먼저 참고한다.

> **버전** v1.4 | **작성일** 2026-06-25 | **갱신** 2026-07-03 (F05/F08 제거, 사용자 주도 분석 방향 반영) | **상태** 각 기능 spec.md를 최신 기준으로 삼음

---

## Product Purpose

GitChronicle는 VSCode Extension으로, 개발자가 자신의 Git 커밋 이력을 효율적으로 탐색하고, 파일 변경 내역을 시각적으로 분석하며, AI CLI를 통해 커밋 단위 작업 내역을 마크다운으로 요약하고 궁금한 부분은 직접 질문하며 분석할 수 있는 도구다. 분석의 주체는 항상 사용자이며, AI와 시각화 기능은 그 과정을 보조한다.

---

## Background

이전 프로젝트에서 내가 작업한 내용을 분석하려면 Git 로그를 직접 탐색해야 한다. 이 과정이 비효율적이어서 프로그래매틱하게 자동화하는 VSCode Extension을 만든다.

---

## Primary User Goals

1. 과거 커밋 이력을 기간·작성자·키워드 기준으로 빠르게 필터링한다.
2. 특정 커밋에서 변경된 파일을 디렉토리 트리 형태로 파악한다.
3. 파일 간 import/require 의존 관계를 노드-엣지 캔버스로 시각적으로 이해한다.
4. AI CLI를 통해 커밋 단위 작업 내역을 마크다운으로 자동 정리한다.
5. 정리된 요약에 직접 질문하며 개별 파일의 세부 내용을 파악하고, 대화 내용을 로컬 경로에 자동 저장하여 나중에 즉시 재활용한다.

---

## Global Navigation Model

확장 프로그램은 S01 이후를 **지속형 워크스페이스**로 유지한다. 커밋을 선택하면 S02로 진입하고, 이후 코드/AI 요약/의존성 캔버스/심볼 그래프는 모두 S02 본문 패널 전환으로 처리한다.

| 화면 ID | 화면명 | 진입 조건 | 이전 화면 |
|---------|--------|-----------|-----------|
| S-01 | 커밋 목록 | 확장 프로그램 활성화 | — |
| S-02 | 워크스페이스 | 커밋 목록에서 항목 클릭 | S-01 |
| S-06 | 설정 | 우측 상단 설정(⚙) 아이콘 클릭 | 어디서든 |
| S-07 | 노트 | S-02 본문 `WorkspaceHeading`의 노트 아이콘 클릭 | S-02 |

> 과거 별도 화면이었던 S-03/S-04/S-05/S-08은 더 이상 독립 라우트가 아니며, 해당 콘텐츠는 S-02 워크스페이스 내부 패널로 통합되었다.

---

## Global Business Rules

- Git 저장소가 감지되지 않으면 S-01에서 "Git 저장소가 감지되지 않았습니다" 안내 + 레포 열기 CTA 표시.
- 커밋 목록의 포함 키워드는 대소문자를 구분하지 않으며, 종료일은 선택한 날짜 당일까지 포함한다.
- AI 미설정 상태에서 AI 정리 시도 시 "AI가 설정되지 않았습니다" 안내 + 설정(⚙) 이동 CTA 표시.
- 저장 경로 미설정 상태에서 AI 정리 시도 시 "저장 경로를 먼저 설정해주세요" 안내 + 설정(⚙) 이동 CTA 표시.
- AI CLI는 복수 등록 가능하나 하나만 활성화 가능. 하나가 활성화되면 나머지는 자동으로 비활성화.
- AI 정리는 설정 경로에 자동 저장되며, 저장본이 있으면 AI 재호출 없이 즉시 표시.
- AI 정리 타임아웃은 120초. 실패 시 "생성에 실패했습니다" + [재시도] 버튼 표시.
- 저장 경로가 존재하지 않으면 `fs.mkdirSync({ recursive: true })`로 자동 생성.

---

## Screen Flow Diagram {#screen-flow}

```
[Extension 활성화]
       ↓
  [S-01: 커밋 목록] ◄────────────────────────────────────┐
       ↓ 커밋 클릭                               뒤로가기 │
  [S-02: 워크스페이스] ───────────────────────────────────┘
       ├─ 파일 [코드 보기]           → 본문 code 패널
       ├─ [커밋 AI 정리]             → 본문 aiSummary 패널
       ├─ [캔버스 보기]              → 본문 fileCanvas 패널
       ├─ 파일 [심볼 그래프]         → 본문 symbolGraph 패널
       └─ [노트]                    → [S-07: 노트] ──(뒤로가기)──→ 복귀

  [⚙ 아이콘] → [S-02 사이드바 설정 뷰]
```

---

## Feature Summary {#feature-summary}

| Feature ID | Feature명 | 설명 | 관련 화면 |
|------------|-----------|------|-----------|
| [F01_CommitLog](../features/F01_commit_log/spec.md) | 커밋 로그 조회 | 전체 커밋 이력 목록 표시. 기간·작성자·키워드 필터, 무한 스크롤 | [S01](../screens/S01_commit_list/blueprint.md) |
| [F02_ChangedFileTree](../features/F02_changed_file_tree/spec.md) | 변경 파일 트리 | 커밋 선택 시 변경 파일을 디렉토리 트리로 표시. 파일 상태 뱃지 포함 | [S02](../screens/S02_history_view/blueprint.md) |
| [F03_CodeViewer](../features/F03_code_viewer/spec.md) | 코드 변경이력 | 파일 단위 unified diff 뷰어. Shiki 신텍스 하이라이팅 | [S02](../screens/S02_history_view/blueprint.md) |
| [F04_DependencyCanvas](../features/F04_dependency_canvas/spec.md) | 의존 관계 캔버스 | 변경 파일 간 의존 관계를 노드-엣지 그래프로 시각화. React Flow 기반 | [S02](../screens/S02_history_view/blueprint.md) |
| [F05b_AISummaryCommit](../features/F05b_ai_summary_commit/spec.md) | AI 정리 (커밋 단위) | 커밋 전체 변경을 AI가 종합 요약하는 유일한 AI 정리 진입점. 스트리밍 표시, 로컬 저장, 재사용 | [S02](../screens/S02_history_view/blueprint.md) |
| [F06_AISettings](../features/F06_ai_settings/spec.md) | AI 설정 | Claude/Gemini/Codex CLI 등록·활성화·비활성화 | [S02](../screens/S02_history_view/blueprint.md) |
| [F07_SavePathSettings](../features/F07_save_path_settings/spec.md) | 저장 경로 설정 | AI 정리 결과물 저장 경로 지정·삭제 | [S02](../screens/S02_history_view/blueprint.md) |
| [F09_AISummaryQA](../features/F09_ai_summary_qa/spec.md) | AI 요약 Q&A | 요약 완료 후 질문/답변으로 개별 파일까지 파고들며 분석. 커밋 전체 diff를 근거로 답변하며, 답변을 기존 요약 문서 하단에 append | [S02](../screens/S02_history_view/blueprint.md) |
| [F10_IntraFileSymbolDependencyCanvas](../features/F10_intra_file_symbol_dependency_canvas/spec.md) | 파일 내부 심볼 의존성 캔버스 | 단일 파일 내 함수·클래스 등 심볼 간 호출·참조·상속 관계를 노드-엣지 그래프로 시각화 | [S02](../screens/S02_history_view/blueprint.md) |
| [F11_NoteEditor](../features/F11_note_editor/spec.md) | 노트 에디터 | 커밋 컨텍스트를 유지한 채 마크다운 노트를 작성하고 디바운스 자동저장 | [S07](../screens/S07_note/blueprint.md) |

---

## Anchor Index

- [S-01: 커밋 목록](#s-01) → [screens/S01_commit_list/blueprint.md](../screens/S01_commit_list/blueprint.md)
- [S-02: 워크스페이스](#s-02) → [screens/S02_history_view/blueprint.md](../screens/S02_history_view/blueprint.md) (코드 뷰어·AI 정리 뷰어·캔버스·심볼 캔버스는 모두 이 화면의 본문 패널로 통합됨)
- [S-07: 노트](#s-07) → [screens/S07_note/blueprint.md](../screens/S07_note/blueprint.md)
- [F-01: 커밋 로그 조회](#f-01) → [features/F01_commit_log/spec.md](../features/F01_commit_log/spec.md)
- [F-02: 변경 파일 트리](#f-02) → [features/F02_changed_file_tree/spec.md](../features/F02_changed_file_tree/spec.md)
- [F-03: 코드 변경이력](#f-03) → [features/F03_code_viewer/spec.md](../features/F03_code_viewer/spec.md)
- [F-04: 의존 관계 캔버스](#f-04) → [features/F04_dependency_canvas/spec.md](../features/F04_dependency_canvas/spec.md)
- [F-05b: AI 정리 (커밋 단위)](#f-05b) → [features/F05b_ai_summary_commit/spec.md](../features/F05b_ai_summary_commit/spec.md)
- [F-06: AI 설정](#f-06) → [features/F06_ai_settings/spec.md](../features/F06_ai_settings/spec.md)
- [F-07: 저장 경로 설정](#f-07) → [features/F07_save_path_settings/spec.md](../features/F07_save_path_settings/spec.md)
- [F-09: AI 요약 Q&A](#f-09) → [features/F09_ai_summary_qa/spec.md](../features/F09_ai_summary_qa/spec.md)
- [F-10: 파일 내부 심볼 의존성 캔버스](#f-10) → [features/F10_intra_file_symbol_dependency_canvas/spec.md](../features/F10_intra_file_symbol_dependency_canvas/spec.md)
- [F-11: 노트 에디터](#f-11) → [features/F11_note_editor/spec.md](../features/F11_note_editor/spec.md)
