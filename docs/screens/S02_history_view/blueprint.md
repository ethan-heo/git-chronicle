# Screen: S02_HistoryViewScreen

## Related Features

- [F02_ChangedFileTree](../../features/F02_changed_file_tree/spec.md)

---

## Purpose

선택된 커밋의 변경 파일 트리를 탐색하고, 파일 단위 또는 커밋 단위 액션(코드 보기, AI 정리, 캔버스)을 실행하는 화면.

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
│   ├─ PrimaryButton [커밋 AI 정리] → S04, SavedBadge (조건부)
│   └─ PrimaryButton [캔버스 보기] → S05 dependency canvas
└─ FileTree (스크롤 영역)
    ├─ DirectoryNode
    │   └─ FileTreeNode
    │       ├─ FileStatusBadge
    │       └─ FileActionButtons (호버 시)
    └─ ...
```

---

## Components

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
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

`loading`/`empty`/`populated`/`error`는 [F02_changed_file_tree/blueprint.md](../../features/F02_changed_file_tree/blueprint.md)의 State Model이 유일한 출처다. S02는 F02 하나로만 구성된 화면이라 별도 화면 전용 상태를 두지 않는다.

> 인터랙션 흐름은 [F02_changed_file_tree/blueprint.md](../../features/F02_changed_file_tree/blueprint.md)의 Interaction Model을 참고한다. BackButton/설정 아이콘 이동은 위 Layout Structure에 표시된 대로다.

---

## Responsive Rules

- 현재 구현은 `CommitActionBar` 텍스트 버튼을 유지한다.
