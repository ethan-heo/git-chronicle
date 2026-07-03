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
- [S04_AISummaryViewerScreen](../S05_ai_summary_viewer/blueprint.md) — 파일 [AI 정리 보기] 또는 [커밋 AI 정리] 클릭 시
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

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
| `BatchProgressBar` | [F08 blueprint](../../features/F08_batch_ai_summary/blueprint.md#component-batchprogressbar) — App 전역 상단 진행 표시 | `src/webview/features/F08/BatchProgressBar.tsx` |
| `TopHeader` | [global_components](../../core/global_components.md#topheader) | `src/webview/shared/components/TopHeader.tsx` |
| `BackButton` | [global_components](../../core/global_components.md#backbutton) | `src/webview/shared/components/BackButton.tsx` |
| `CommitActionBar` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md#component-commitactionbar) | `src/webview/features/F02/CommitActionBar.tsx` |
| `FileTree` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md#component-filetree) | `src/webview/features/F02/FileTree.tsx` |
| `DirectoryNode` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md#component-directorynode) | `src/webview/features/F02/DirectoryNode.tsx` |
| `FileTreeNode` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md#component-filetreenode) | `src/webview/features/F02/FileTreeNode.tsx` |
| `FileStatusBadge` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md#component-filestatusbadge) | `src/webview/shared/components/FileStatusBadge.tsx` |
| `FileActionButtons` | [global_components](../../core/global_components.md#fileactionbuttons) | `src/webview/shared/components/FileActionButtons.tsx` |
| `SavedBadge` | [global_components](../../core/global_components.md#savedbadge) | `src/webview/shared/components/SavedBadge.tsx` |
| `EmptyState` | [global_components](../../core/global_components.md#emptystate) | `src/webview/shared/components/EmptyState.tsx` |
| `LoadingState` | [global_components](../../core/global_components.md#loadingstate) | `src/webview/shared/components/LoadingState.tsx` |
| `ErrorState` | [global_components](../../core/global_components.md#errorstate) | `src/webview/shared/components/ErrorState.tsx` |

---

## Screen States

`loading`/`empty`/`populated`/`error`는 [F02_changed_file_tree/blueprint.md](../../features/F02_changed_file_tree/blueprint.md)의 State Model이 유일한 출처다. 아래는 F02와 F08(일괄 AI 정리)이 조합될 때만 발생하는 화면 전용 상태다.

| 상태 | 조건 | UI |
|------|------|-----|
| `batchRunning` | `isBatchRunning === true` | [전체 파일 AI 정리] 버튼 비활성화 + App 전역 `BatchProgressBar` 표시 |

> 인터랙션 흐름은 [F02_changed_file_tree/blueprint.md](../../features/F02_changed_file_tree/blueprint.md)의 Interaction Model을 참고한다. BackButton/설정 아이콘 이동은 위 Layout Structure에 표시된 대로다.

---

## Responsive Rules

- 현재 구현은 `CommitActionBar` 텍스트 버튼을 유지한다.
- `BatchProgressBar`는 S02 내부가 아니라 App 전역에 마운트되어 화면 이동 후에도 유지된다.
