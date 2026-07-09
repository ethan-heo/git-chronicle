# Screen: S02_WorkspaceScreen

## Related Features

- [F01_CommitLog](../../features/F01_commit_log/spec.md)
- [F02_ChangedFileTree](../../features/F02_changed_file_tree/spec.md)
- [F03_CodeViewer](../../features/F03_code_viewer/spec.md)
- [F04_DependencyCanvas](../../features/F04_dependency_canvas/spec.md)
- [F05b_AISummaryCommit](../../features/F05b_ai_summary_commit/spec.md)
- [F09_AISummaryQA](../../features/F09_ai_summary_qa/spec.md)
- [F10_IntraFileSymbolDependencyCanvas](../../features/F10_intra_file_symbol_dependency_canvas/spec.md)

---

## Purpose

하나의 지속형 워크스페이스 안에서 필터, 커밋 목록, 변경 파일 탐색, 본문 패널 전환을 모두 처리한다. S01은 별도 화면이 아니라 S02 사이드바 섹션으로 통합되었다.

---

## Entry Condition

확장 프로그램을 열면 항상 S02로 진입한다. 초기 상태는 `selectedCommit = null`, `activeWorkspacePanel = "none"`이며, 사용자가 사이드바 커밋 목록에서 커밋을 선택하면 커밋 종속 상태만 리셋되고 화면 전환은 발생하지 않는다.

---

## Parent Screen

- 없음

---

## Child Screens

- [S06_SettingsScreen](../S06_settings/blueprint.md) — 본문 헤더 우측 설정 버튼 클릭 시 진입
- [S07_NoteScreen](../S07_note/blueprint.md) — 본문 헤더 좌측 노트 버튼 클릭 시 진입

---

## Layout Structure

```text
S02_WorkspaceScreen
├─ Sidebar (drag resize, collapse / reopen)
│  ├─ WorkspaceHeading
│  └─ SidebarSectionGroup
│     ├─ FilterSection
│     │  └─ CommitFilterPanel (embedded)
│     ├─ CommitListSection
│     │  └─ CommitList
│     └─ FileTreeSection
│        └─ FileTree
├─ SidebarResizeHandle
└─ Main
   ├─ MainHeader
   │  ├─ AISummaryToggleButton
   │  ├─ FileCanvasToggleButton
   │  ├─ NoteToggleButton
   │  ├─ SettingsToggleButton
   │  └─ SymbolCodePanelToggleButton (symbolGraph일 때만)
   └─ ContentPanel
      ├─ code → CodeDiffPanel
      ├─ aiSummary → AISummaryPanel
      ├─ fileCanvas → DependencyCanvasPanel
      └─ symbolGraph → SymbolGraphPanel
```

사이드바 안의 세 섹션은 각각 독립적으로 접고 펼칠 수 있으며, 펼쳐진 섹션이 2개 이상일 때는 `ResizableSplitPane`의 세로 분할로 높이를 드래그 조정한다. 이 펼침 상태와 마지막 높이는 Webview State에 저장된다.

---

## Components

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
| `WorkspaceHeading` | 이 문서 | `src/webview/features/F02/WorkspaceHeading.tsx` |
| `SidebarSection` | 이 문서 | `src/webview/shared/components/SidebarSection.tsx` |
| `CommitFilterPanel` | [F01 blueprint](../../features/F01_commit_log/blueprint.md#component-commitfilterpanel) | `src/webview/features/F01/CommitFilterPanel.tsx` |
| `CommitList` | [F01 blueprint](../../features/F01_commit_log/blueprint.md#component-commitlist) | `src/webview/features/F01/CommitList.tsx` |
| `FileTree` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md#component-filetree) | `src/webview/features/F02/FileTree.tsx` |
| `AISummaryToggleButton` | 이 문서 | `src/webview/features/F02/AISummaryToggleButton.tsx` |
| `FileCanvasToggleButton` | 이 문서 | `src/webview/features/F02/FileCanvasToggleButton.tsx` |
| `NoteToggleButton` | 이 문서 | `src/webview/features/F02/NoteToggleButton.tsx` |
| `SettingsToggleButton` | 이 문서 | `src/webview/features/F02/SettingsToggleButton.tsx` |
| `ResizableSplitPane` | [global_components](../../core/global_components.md#resizablesplitpane) | `src/webview/shared/components/ResizableSplitPane.tsx` |
| `useChangedFileTree` | 이 문서 (F02 소속 훅) | `src/webview/features/F02/useChangedFileTree.ts` |
| `useSymbolGraph` | 이 문서 (F10 소속 훅) | `src/webview/features/F10/useSymbolGraph.ts` |

---

## Screen States

| 상태 | 조건 | UI |
|------|------|----|
| `idle` | `selectedCommit === null`, `activeWorkspacePanel === "none"` | 사이드바 헤더/파일트리에 placeholder, 본문 빈 상태 |
| `commitSelected` | `selectedCommit !== null`, `activeWorkspacePanel === "none"` | 커밋 컨텍스트만 갱신, 본문은 패널 미선택 상태 |
| `code` | `activeWorkspacePanel === "code"` | `CodeDiffPanel` |
| `aiSummary` | `activeWorkspacePanel === "aiSummary"` | `AISummaryPanel` |
| `fileCanvas` | `activeWorkspacePanel === "fileCanvas"` | `DependencyCanvasPanel` |
| `symbolGraph` | `activeWorkspacePanel === "symbolGraph"` | `SymbolGraphPanel` |

---

## Navigation Rules

- 앱은 항상 S02에서 시작한다.
- 사이드바 커밋 목록에서 다른 커밋을 선택하면 `selectedCommit`과 커밋 종속 상태만 갱신되고, 화면은 그대로 S02에 머문다.
- 사이드바 전체 폭은 별도 리사이즈 핸들로 조정하며, 폭을 0까지 줄이면 사이드바 전체가 접힌다.
- 본문 헤더의 설정 버튼은 S06으로 이동하고, S06 뒤로가기는 다시 S02로 복귀한다.
- 본문 헤더의 노트 버튼은 S07로 이동하고, S07 뒤로가기는 다시 S02로 복귀한다.
- `activeWorkspacePanel`은 커밋 재선택 시 항상 `'none'`으로 초기화된다.
