# Screen: S02_HistoryViewScreen

## Related Features

- [F02_ChangedFileTree](../../features/F02_changed_file_tree/spec.md)
- [F08_BatchAISummary](../../features/F08_batch_ai_summary/spec.md)

---

## Purpose

선택된 커밋의 변경 파일 트리를 탐색하고, 파일 단위 또는 커밋 단위 액션(코드 보기, AI 정리, 일괄 생성, 캔버스)을 실행하는 화면.

---

## Entry Condition

S01_CommitListScreen에서 커밋 항목 클릭 시 진입. `selectedCommit` 전역 상태 설정 후 진입.

---

## Parent Screen

- [S01_CommitListScreen](../S01_commit_list/blueprint.md)

---

## Child Screens

- [S03_CodeViewerScreen](../S03_code_viewer/blueprint.md) — 파일 [코드 보기] 클릭 시
- [S04_AISummaryViewerScreen](../S04_ai_summary_viewer/blueprint.md) — 파일 [AI 정리 보기] 또는 [커밋 AI 정리] 클릭 시
- [S05_DependencyCanvasScreen](../S04_dependency_canvas/blueprint.md) — [캔버스 보기] 클릭 시

---

## Layout Structure

```
S02_HistoryViewScreen
├─ TopHeader (커밋 메시지)
│   ├─ BackButton → S01
│   └─ SettingsIcon (⚙) → S06
├─ CommitActionBar
│   ├─ PrimaryButton [커밋 AI 정리] → S04 placeholder
│   ├─ PrimaryButton [전체 파일 AI 정리] → F08 시작 상태 설정
│   └─ PrimaryButton [캔버스 보기] → S05 dependency canvas
└─ FileTree (스크롤 영역)
    ├─ DirectoryNode
    │   └─ FileTreeNode
    │       ├─ FileStatusBadge
    │       ├─ SavedBadge (조건부)
    │       └─ FileActionButtons (호버 시)
    └─ ...
```

---

## Components

| 컴포넌트 | 출처 |
|---------|------|
| `BatchProgressBar` | [F08 blueprint](../../features/F08_batch_ai_summary/blueprint.md) — F08 구현 시 추가 |
| `TopHeader` | [global_components](../../core/global_components.md#topheader) |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) |
| `CommitActionBar` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md) |
| `FileTree` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md) |
| `DirectoryNode` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md) |
| `FileTreeNode` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md) |
| `FileStatusBadge` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md) |
| `FileActionButtons` | [global_components](../../core/global_components.md#fileactionbuttons) |
| `SavedBadge` | [global_components](../../core/global_components.md#savedbadge) |
| `EmptyState` | [global_components](../../core/global_components.md#emptystate) |
| `LoadingState` | [global_components](../../core/global_components.md#loadingstate) |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) |

---

## Screen States

| 상태 | 조건 | UI |
|------|------|-----|
| `loading` | 변경 파일 로드 중 | `LoadingState` |
| `empty` | `changedFiles.length === 0` | `EmptyState`: "변경된 파일이 없습니다" |
| `populated` | `changedFiles.length > 0` | `FileTree` + `CommitActionBar` |
| `error` | 로드 실패 | `ErrorState` |
| `batchRunning` | `isBatchRunning === true` | [전체 파일 AI 정리] 버튼 비활성화 (`BatchProgressBar`는 F08 구현 시 추가) |

---

## Interaction Flow

```
[S01에서 커밋 클릭]
    → changedFiles 로드
    → FileTree 표시
        → 파일 호버 → FileActionButtons 표시
            → [코드 보기] → S03 code viewer
            → [AI 정리 보기] → S04 placeholder
        → [커밋 AI 정리] → S04 placeholder
        → [전체 파일 AI 정리] → isBatchRunning true, START_BATCH_AI_SUMMARY 전송
        → [캔버스 보기] → S05 dependency canvas
    → BackButton → S01
    → ⚙ → S06
```

---

## Responsive Rules

- 현재 구현은 `CommitActionBar` 텍스트 버튼을 유지한다.
- `BatchProgressBar`는 F08 구현 시 추가한다.
