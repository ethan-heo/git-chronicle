# Screen: S02_WorkspaceScreen

## Related Features

- [F02_ChangedFileTree](../../features/F02_changed_file_tree/spec.md)
- [F03_CodeViewer](../../features/F03_code_viewer/spec.md)
- [F04_DependencyCanvas](../../features/F04_dependency_canvas/spec.md)
- [F05b_AISummaryCommit](../../features/F05b_ai_summary_commit/spec.md)
- [F09_AISummaryQA](../../features/F09_ai_summary_qa/spec.md)
- [F10_IntraFileSymbolDependencyCanvas](../../features/F10_intra_file_symbol_dependency_canvas/spec.md)

---

## Purpose

선택된 커밋을 하나의 지속형 워크스페이스에서 탐색한다. 좌측 사이드바에는 뒤로가기, 패널 토글, 변경 파일 트리가 있고, 우측 본문은 코드 diff, AI 요약, 의존성 캔버스, 심볼 그래프 중 하나를 표시한다.

---

## Entry Condition

S01_CommitListScreen에서 커밋 항목 클릭 시 진입. `selectedCommit` 설정과 함께 `currentScreen = "S02"`, `activeWorkspacePanel = "none"`으로 초기화된다.

---

## Parent Screen

- [S01_CommitListScreen](../S01_commit_list/blueprint.md)

---

## Child Screens

- 없음. 기존 S03/S04/S05/S08 콘텐츠는 모두 S02 본문 패널로 통합되었다.

---

## Layout Structure

```
S02_WorkspaceScreen
├─ Sidebar
│  ├─ BackButton → S01
│  ├─ AISummaryToggleButton → activeWorkspacePanel = 'aiSummary'
│  ├─ FileCanvasToggleButton → activeWorkspacePanel = 'fileCanvas'
│  └─ FileTree
│     └─ FileTreeNode
│        ├─ [코드 보기] → activeWorkspacePanel = 'code'
│        └─ [심볼 그래프] → activeWorkspacePanel = 'symbolGraph'
└─ Main
   ├─ WorkspaceHeading
   │  └─ SettingsIcon (⚙) → S06
   └─ ContentPanel
      ├─ code → DiffViewer
      ├─ aiSummary → AISummaryViewer + QAInputArea
      ├─ fileCanvas → DependencyGraph
      └─ symbolGraph → SymbolGraph + SymbolCodePanel
```

---

## Components

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
| `BackButton` | [global_components](../../core/global_components.md#backbutton) | `src/webview/shared/components/BackButton.tsx` |
| `AISummaryToggleButton` | 이 문서 | `src/webview/features/F02/AISummaryToggleButton.tsx` |
| `FileCanvasToggleButton` | 이 문서 | `src/webview/features/F02/FileCanvasToggleButton.tsx` |
| `FileTree` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md#component-filetree) | `src/webview/features/F02/FileTree.tsx` |
| `WorkspaceHeading` | 이 문서 | `src/webview/features/F02/WorkspaceHeading.tsx` |
| `DiffViewer` | [F03 blueprint](../../features/F03_code_viewer/blueprint.md) | `src/webview/features/F03/DiffViewer.tsx` |
| `AISummaryViewer` | [F05b blueprint](../../features/F05b_ai_summary_commit/blueprint.md) | `src/webview/features/F05b/AISummaryViewer.tsx` |
| `DependencyGraph` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md#component-dependencygraph) | `src/webview/features/F04/DependencyGraph.tsx` |
| `SymbolGraph` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md#component-symbolgraph) | `src/webview/features/F10/SymbolGraph.tsx` |
| `SymbolCodePanel` | [F10 blueprint](../../features/F10_intra_file_symbol_dependency_canvas/blueprint.md#component-symbolcodepanel) | `src/webview/features/F10/SymbolCodePanel.tsx` |

---

## Screen States

| 상태 | 조건 | UI |
|------|------|----|
| `idle` | `activeWorkspacePanel === "none"` | 본문 비어 있음 |
| `code` | `activeWorkspacePanel === "code"` | DiffViewer |
| `aiSummary` | `activeWorkspacePanel === "aiSummary"` | AISummaryViewer + QA |
| `fileCanvas` | `activeWorkspacePanel === "fileCanvas"` | DependencyGraph |
| `symbolGraph` | `activeWorkspacePanel === "symbolGraph"` | SymbolGraph + SymbolCodePanel |

---

## Navigation Rules

- 사이드바 `BackButton`은 언제나 S01로 이동한다.
- 본문 설정 아이콘은 S06으로 이동하고, S06 뒤로가기는 다시 S02로 복귀한다.
- 다른 커밋을 다시 선택하면 `activeWorkspacePanel`은 항상 `'none'`으로 초기화된다.
