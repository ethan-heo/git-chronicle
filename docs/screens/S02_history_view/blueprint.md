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

선택된 커밋을 하나의 지속형 워크스페이스에서 탐색한다. 좌측 사이드바 상단 통합 헤더에는 왼쪽의 뒤로가기와 오른쪽의 패널 토글 버튼들이 있고, 그 아래 변경 파일 트리가 이어진다. 우측 본문은 코드 diff, AI 요약, 의존성 캔버스, 심볼 그래프 중 하나를 표시한다.

---

## Entry Condition

S01_CommitListScreen에서 커밋 항목 클릭 시 진입. `selectedCommit` 설정과 함께 `currentScreen = "S02"`, `activeWorkspacePanel = "none"`으로 초기화된다.

---

## Parent Screen

- [S01_CommitListScreen](../S01_commit_list/blueprint.md)

---

## Child Screens

- [S07_NoteScreen](../S07_note/blueprint.md) — 본문 `WorkspaceHeading`의 노트 아이콘 클릭 시 진입
- 그 외 없음. 기존 S03/S04/S05/S08 콘텐츠는 모두 S02 본문 패널로 통합되었다.

---

## Layout Structure

```
S02_WorkspaceScreen
├─ Sidebar (drag resize, toggle collapse / expand)
│  ├─ SidebarHeader
│  │  ├─ BackButton → S01
│  │  ├─ AISummaryToggleButton → activeWorkspacePanel = 'aiSummary'
│  │  └─ FileCanvasToggleButton → activeWorkspacePanel = 'fileCanvas'
│  └─ FileTree
│     └─ FileTreeNode
│        ├─ [코드 보기] → activeWorkspacePanel = 'code'
│        └─ [심볼 그래프] → activeWorkspacePanel = 'symbolGraph'
├─ SidebarResizeHandle
└─ Main
   ├─ WorkspaceHeading
   │  ├─ NoteIcon → S07
   │  └─ SettingsIcon (⚙) → S06
   └─ ContentPanel
      ├─ code → CodeDiffPanel(useFileDiff) → DiffViewer
      ├─ aiSummary → AISummaryPanel(useAISummary) → AISummaryViewer + QAInputArea
      ├─ fileCanvas → DependencyCanvasPanel(useDependencyCanvas) → DependencyGraph
      └─ symbolGraph → SymbolGraphPanel(data: useSymbolGraph 결과) → SymbolGraph + SymbolCodePanel
```

각 Feature 전용 데이터(로딩 effect, 재시도, 파생 상태)는 화면 컴포넌트가 아니라 위 괄호 안 훅에 캡슐화되어 있다(`docs/project/coding_standards.md`의 "God 컴포넌트 방지 기준" 참고). `symbolGraph`만 `useSymbolGraph`를 `S02_WorkspaceScreen`에서 1회 호출해 헤더의 코드패널 토글 버튼과 `SymbolGraphPanel`이 결과 객체를 공유한다 — 나머지는 패널 컴포넌트가 훅을 자체 호출한다.

---

## Components

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
| `BackButton` | [global_components](../../core/global_components.md#backbutton) | `src/webview/shared/components/BackButton.tsx` |
| `AISummaryToggleButton` | 이 문서 | `src/webview/features/F02/AISummaryToggleButton.tsx` |
| `FileCanvasToggleButton` | 이 문서 | `src/webview/features/F02/FileCanvasToggleButton.tsx` |
| `FileTree` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md#component-filetree) | `src/webview/features/F02/FileTree.tsx` |
| `useChangedFileTree` | 이 문서 (F02 소속 훅, 변경 파일 로딩/재시도) | `src/webview/features/F02/useChangedFileTree.ts` |
| `WorkspaceHeading` | 이 문서 | `src/webview/features/F02/WorkspaceHeading.tsx` |
| `CodeDiffPanel` | 이 문서 (F03 소속, `useFileDiff` 자체 호출 후 `DiffViewer` 렌더) | `src/webview/features/F03/CodeDiffPanel.tsx` |
| `DiffViewer` | [F03 blueprint](../../features/F03_code_viewer/blueprint.md) | `src/webview/features/F03/DiffViewer.tsx` |
| `AISummaryPanel` | 이 문서 (F05b 소속, `useAISummary` 자체 호출 후 `AISummaryViewer`+`TokenLimitWarning`+`OverwriteConfirmDialog` 렌더) | `src/webview/features/F05b/AISummaryPanel.tsx` |
| `AISummaryViewer` | [F05b blueprint](../../features/F05b_ai_summary_commit/blueprint.md) | `src/webview/features/F05b/AISummaryViewer.tsx` |
| `DependencyCanvasPanel` | 이 문서 (F04 소속, `useDependencyCanvas` 자체 호출 후 `DependencyGraph` 렌더) | `src/webview/features/F04/DependencyCanvasPanel.tsx` |
| `DependencyGraph` | [F04 blueprint](../../features/F04_dependency_canvas/blueprint.md#component-dependencygraph) | `src/webview/features/F04/DependencyGraph.tsx` |
| `useSymbolGraph` | 이 문서 (F10 소속 훅, `S02_WorkspaceScreen`에서 1회 호출해 헤더 토글 버튼과 공유) | `src/webview/features/F10/useSymbolGraph.ts` |
| `SymbolGraphPanel` | 이 문서 (F10 소속, `useSymbolGraph` 결과 객체를 받아 `SymbolGraph`+`SymbolCodePanel` 렌더) | `src/webview/features/F10/SymbolGraphPanel.tsx` |
| `SymbolCodePanelToggleButton` | 이 문서 (F10 소속, 헤더 코드패널 토글) | `src/webview/features/F10/SymbolCodePanelToggleButton.tsx` |
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
- `SidebarResizeHandle` 드래그로 사이드바 폭을 조절할 수 있고, 끝까지 밀면 완전히 접힌다.
- 접힌 상태에서도 `SidebarResizeHandle`은 얇은 타겟으로 남아 있으며, 이를 오른쪽으로 드래그해 다시 펼칠 수 있다.
- 본문 `WorkspaceHeading`의 설정 아이콘은 S06으로 이동하고, S06 뒤로가기는 다시 S02로 복귀한다.
- 본문 `WorkspaceHeading`의 노트 아이콘은 S07로 이동하고, S07 뒤로가기는 다시 S02로 복귀한다.
- 다른 커밋을 다시 선택하면 `activeWorkspacePanel`은 항상 `'none'`으로 초기화된다.
