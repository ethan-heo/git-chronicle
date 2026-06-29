# Product Overview: GitRewind

> **버전** v1.2 | **작성일** 2026-06-25 | **상태** 확정

---

## Product Purpose

GitRewind는 VSCode Extension으로, 개발자가 자신의 Git 커밋 이력을 효율적으로 탐색하고, 파일 변경 내역을 시각적으로 분석하며, AI CLI를 통해 작업 내용을 마크다운 형식으로 자동 요약·저장할 수 있는 도구다.

---

## Background

이전 프로젝트에서 내가 작업한 내용을 분석하려면 Git 로그를 직접 탐색해야 한다. 이 과정이 비효율적이어서 프로그래매틱하게 자동화하는 VSCode Extension을 만든다.

---

## Primary User Goals

1. 과거 커밋 이력을 기간·작성자·키워드 기준으로 빠르게 필터링한다.
2. 특정 커밋에서 변경된 파일을 디렉토리 트리 형태로 파악한다.
3. 파일 간 import/require 의존 관계를 노드-엣지 캔버스로 시각적으로 이해한다.
4. AI CLI를 통해 파일 단위 및 커밋 단위 작업 내역을 마크다운으로 자동 정리한다.
5. 정리된 AI 요약을 로컬 경로에 자동 저장하여 나중에 즉시 재활용한다.

---

## Global Navigation Model

확장 프로그램은 **퍼널(Funnel) 방식**으로 화면이 전환된다. 상위 화면에서 항목을 선택하면 세부 화면으로 진입하고, [뒤로가기] 버튼으로 복귀한다.

| 화면 ID | 화면명 | 진입 조건 | 이전 화면 |
|---------|--------|-----------|-----------|
| S-01 | 커밋 목록 | 확장 프로그램 활성화 | — |
| S-02 | 이력 조회 | 커밋 목록에서 항목 클릭 | S-01 |
| S-03 | 코드 뷰어 | 파일/노드 호버 → [코드 보기] 버튼 클릭 | S-02 |
| S-04 | AI 정리 뷰어 | 파일/노드 호버 → [AI 정리 보기] 버튼 클릭, 또는 [커밋 AI 정리] 클릭 | S-02 |
| S-05 | 캔버스 | 이력 조회 화면 내 [캔버스 보기] 버튼 클릭 | S-02 |
| S-06 | 설정 | 우측 상단 설정(⚙) 아이콘 클릭 | 어디서든 |

---

## Global Business Rules

- Git 저장소가 감지되지 않으면 S-01에서 "Git 저장소가 감지되지 않았습니다" 안내 + 레포 열기 CTA 표시.
- 커밋 목록의 포함 키워드는 대소문자를 구분하지 않으며, 종료일은 선택한 날짜 당일까지 포함한다.
- AI 미설정 상태에서 AI 정리 시도 시 "AI가 설정되지 않았습니다" 안내 + 설정(⚙) 이동 CTA 표시.
- 저장 경로 미설정 상태에서 AI 정리 시도 시 "저장 경로를 먼저 설정해주세요" 안내 + 설정(⚙) 이동 CTA 표시.
- AI CLI는 복수 등록 가능하나 하나만 활성화 가능. 하나가 활성화되면 나머지는 자동으로 비활성화.
- AI 정리는 설정 경로에 자동 저장되며, 저장본이 있으면 AI 재호출 없이 즉시 표시.
- AI 정리 타임아웃은 120초. 실패 시 "생성에 실패했습니다" + [재시도] 버튼 표시.
- 일괄 생성(F-08) 중 화면 이동 시에도 백그라운드에서 계속 진행되며 상단 고정 프로그레스 바로 상태 표시.
- 저장 경로가 존재하지 않으면 `fs.mkdirSync({ recursive: true })`로 자동 생성.

---

## Screen Flow Diagram {#screen-flow}

```
[Extension 활성화]
       ↓
  [S-01: 커밋 목록] ◄────────────────────────────────────┐
       ↓ 커밋 클릭                               뒤로가기 │
  [S-02: 이력 조회] ──────────────────────────────────────┘
       ├─ 파일 호버 → [코드 보기]    → [S-03: 코드 뷰어]
       ├─ 파일 호버 → [AI 정리 보기] → [S-04: AI 정리 뷰어]
       ├─ [커밋 AI 정리]             → [S-04: AI 정리 뷰어]
       └─ [캔버스 보기]              → [S-05: 캔버스]
                                          ├─ 노드 호버 → [코드 보기]    → [S-03]
                                          └─ 노드 호버 → [AI 정리 보기] → [S-04]

  [⚙ 아이콘 (어디서든)] → [S-06: 설정]
```

---

## Feature Summary {#feature-summary}

| Feature ID | Feature명 | 설명 | 관련 화면 |
|------------|-----------|------|-----------|
| [F01_CommitLog](../features/F01_commit_log/spec.md) | 커밋 로그 조회 | 전체 커밋 이력 목록 표시. 기간·작성자·키워드 필터, 무한 스크롤 | [S01](../screens/S01_commit_list/blueprint.md) |
| [F02_ChangedFileTree](../features/F02_changed_file_tree/spec.md) | 변경 파일 트리 | 커밋 선택 시 변경 파일을 디렉토리 트리로 표시. 상태 뱃지·저장됨 뱃지 포함 | [S02](../screens/S02_history_view/blueprint.md) |
| [F03_CodeViewer](../features/F03_code_viewer/spec.md) | 코드 변경이력 | 파일 단위 unified diff 뷰어. Shiki 신텍스 하이라이팅 | [S03](../screens/S03_code_viewer/blueprint.md) |
| [F04_DependencyCanvas](../features/F04_dependency_canvas/spec.md) | 의존 관계 캔버스 | 변경 파일 간 의존 관계를 노드-엣지 그래프로 시각화. React Flow 기반 | [S05](../screens/S04_dependency_canvas/blueprint.md) |
| [F05_AISummaryFile](../features/F05_ai_summary_file/spec.md) | AI 정리 (파일 단위) | 파일 diff를 AI가 마크다운으로 요약. 스트리밍 표시, 로컬 저장, 재사용 | [S04](../screens/S04_ai_summary_viewer/blueprint.md) |
| [F05b_AISummaryCommit](../features/F05b_ai_summary_commit/spec.md) | AI 정리 (커밋 단위) | 커밋 전체 변경을 AI가 종합 요약. 스트리밍 표시, 로컬 저장, 재사용 | [S04](../screens/S04_ai_summary_viewer/blueprint.md) |
| [F06_AISettings](../features/F06_ai_settings/spec.md) | AI 설정 | Claude/Gemini/Codex CLI 등록·활성화·비활성화 | [S06](../screens/S06_settings/blueprint.md) |
| [F07_SavePathSettings](../features/F07_save_path_settings/spec.md) | 저장 경로 설정 | AI 정리 결과물 저장 경로 지정·삭제 | [S06](../screens/S06_settings/blueprint.md) |
| [F08_BatchAISummary](../features/F08_batch_ai_summary/spec.md) | AI 정리 일괄 생성 | 커밋 내 모든 파일에 대해 파일 단위 AI 정리를 순차 자동 생성 | [S02](../screens/S02_history_view/blueprint.md) |

---

## Anchor Index

- [S-01: 커밋 목록](#s-01) → [screens/S01_commit_list/blueprint.md](../screens/S01_commit_list/blueprint.md)
- [S-02: 이력 조회](#s-02) → [screens/S02_history_view/blueprint.md](../screens/S02_history_view/blueprint.md)
- [S-03: 코드 뷰어](#s-03) → [screens/S03_code_viewer/blueprint.md](../screens/S03_code_viewer/blueprint.md)
- [S-04: AI 정리 뷰어](#s-04) → [screens/S04_ai_summary_viewer/blueprint.md](../screens/S04_ai_summary_viewer/blueprint.md)
- [S-05: 캔버스](#s-05) → [screens/S04_dependency_canvas/blueprint.md](../screens/S04_dependency_canvas/blueprint.md)
- [S-06: 설정](#s-06) → [screens/S06_settings/blueprint.md](../screens/S06_settings/blueprint.md)
- [F-01: 커밋 로그 조회](#f-01) → [features/F01_commit_log/spec.md](../features/F01_commit_log/spec.md)
- [F-02: 변경 파일 트리](#f-02) → [features/F02_changed_file_tree/spec.md](../features/F02_changed_file_tree/spec.md)
- [F-03: 코드 변경이력](#f-03) → [features/F03_code_viewer/spec.md](../features/F03_code_viewer/spec.md)
- [F-04: 의존 관계 캔버스](#f-04) → [features/F04_dependency_canvas/spec.md](../features/F04_dependency_canvas/spec.md)
- [F-05: AI 정리 (파일 단위)](#f-05) → [features/F05_ai_summary_file/spec.md](../features/F05_ai_summary_file/spec.md)
- [F-05b: AI 정리 (커밋 단위)](#f-05b) → [features/F05b_ai_summary_commit/spec.md](../features/F05b_ai_summary_commit/spec.md)
- [F-06: AI 설정](#f-06) → [features/F06_ai_settings/spec.md](../features/F06_ai_settings/spec.md)
- [F-07: 저장 경로 설정](#f-07) → [features/F07_save_path_settings/spec.md](../features/F07_save_path_settings/spec.md)
- [F-08: AI 정리 일괄 생성](#f-08) → [features/F08_batch_ai_summary/spec.md](../features/F08_batch_ai_summary/spec.md)
