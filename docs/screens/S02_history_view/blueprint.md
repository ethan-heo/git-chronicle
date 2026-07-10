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

하나의 지속형 워크스페이스 안에서 커밋 목록, 오버레이 필터, 변경 파일 탐색, 본문 탭 전환을 모두 처리한다. S01은 별도 화면이 아니라 S02 사이드바 섹션으로 통합되었다.

---

## Entry Condition

확장 프로그램을 열면 항상 S02로 진입한다. 초기 상태는 `selectedCommit = null`, 단일 leaf pane 1개를 가진 `paneTree`, `focusedPaneId = rootPaneId`이며, 사용자가 사이드바 커밋 목록에서 커밋을 선택하면 커밋 종속 상태만 리셋되고 화면 전환은 발생하지 않는다.

---

## Parent Screen

- 없음

---

## Child Screens

- 없음. 노트는 독립 화면이 아니라 S02 본문 `note` 탭으로 흡수되었다.

---

## Layout Structure

```text
S02_WorkspaceScreen
├─ Sidebar (drag resize, collapse / reopen)
│  └─ SidebarContent
│     ├─ default → DefaultSidebarView
│     │  ├─ WorkspaceHeading
│     │  │  └─ SettingsToggleButton
│     │  └─ SidebarSectionGroup
│     │     ├─ CommitsSection
│     │     │  ├─ header actions → SortOrderToggle, FilterToggleButton
│     │     │  ├─ Popover
│     │     │  │  └─ CommitFilterPanel (embedded)
│     │     │  └─ CommitList
│     │     └─ FileTreeSection
│     │        └─ FileTree
│     └─ settings → SidebarSettingsPanel
│        ├─ SidebarSettingsHeader
│        ├─ AIProviderSection
│        └─ SavePathSection
├─ SidebarResizeHandle
└─ Main
   └─ PaneTree
      ├─ leaf → WorkspacePane
      │  ├─ WorkspaceTabBar
      │  │  ├─ WorkspaceTabItem[] (가로 스크롤, draggable)
      │  │  └─ FixedActions
      │  │     └─ PaneActionsGroup (기본 접힘, 토글 버튼으로 펼침/접힘)
      │  │        ├─ AISummaryToggleButton
      │  │        ├─ FileCanvasToggleButton
      │  │        └─ NoteToggleButton
      │  ├─ DropZoneOverlay (drag 중 left/right/top/bottom)
      │  └─ ActiveTabPanel
      │     ├─ code → CodeTabSplitArea
      │     │  ├─ CodeDiffPanel
      │     │  ├─ FileAISummaryToggleButton (CodeDiffPanel 우측 상단 오버레이)
      │     │  ├─ SymbolGraphToggleButton (CodeDiffPanel 우측 상단 오버레이)
      │     │  ├─ AISummaryPanel (파일 스코프, 토글 시)
      │     │  └─ SymbolGraphPanel (토글 시)
      │     ├─ aiSummary → AISummaryPanel
      │     ├─ fileCanvas → DependencyCanvasPanel
      │     └─ note → NoteEditorPanel
      └─ split → ResizableSplitPane (재귀)
```

사이드바 안의 두 섹션은 각각 독립적으로 접고 펼칠 수 있으며, 둘 다 펼쳐져 있을 때는 `ResizableSplitPane`의 세로 분할로 높이를 드래그 조정한다. 이 펼침 상태와 마지막 높이는 Webview State에 저장된다. 필터 입력은 커밋 목록 섹션 헤더의 토글 버튼이 여는 팝오버 오버레이로 제공되며, 목록 레이아웃 높이에는 영향을 주지 않는다.

---

## Components

| 컴포넌트 | 정의 | 구현 파일 |
|---------|------|-----------|
| `WorkspaceHeading` | 이 문서 | `src/webview/features/F02/WorkspaceHeading.tsx` |
| `SidebarSection` | 이 문서 | `src/webview/shared/components/SidebarSection.tsx` |
| `Popover` | [global_components](../../core/global_components.md#popover) | `src/webview/shared/components/Popover.tsx` |
| `CommitFilterPanel` | [F01 blueprint](../../features/F01_commit_log/blueprint.md#component-commitfilterpanel) | `src/webview/features/F01/CommitFilterPanel.tsx` |
| `FilterToggleButton` | [F01 blueprint](../../features/F01_commit_log/blueprint.md#component-filtertogglebutton) | `src/webview/features/F01/FilterToggleButton.tsx` |
| `CommitList` | [F01 blueprint](../../features/F01_commit_log/blueprint.md#component-commitlist) | `src/webview/features/F01/CommitList.tsx` |
| `FileTree` | [F02 blueprint](../../features/F02_changed_file_tree/blueprint.md#component-filetree) | `src/webview/features/F02/FileTree.tsx` |
| `PaneActionsGroup` | 이 문서 | `src/webview/features/F02/PaneActionsGroup.tsx` |
| `AISummaryToggleButton` | 이 문서 | `src/webview/features/F02/AISummaryToggleButton.tsx` |
| `FileCanvasToggleButton` | 이 문서 | `src/webview/features/F02/FileCanvasToggleButton.tsx` |
| `NoteToggleButton` | 이 문서 | `src/webview/features/F02/NoteToggleButton.tsx` |
| `SettingsToggleButton` | 이 문서 | `src/webview/features/F02/SettingsToggleButton.tsx` |
| `SidebarSettingsPanel` | [F06 blueprint](../../features/F06_ai_settings/blueprint.md#component-sidebarsettingspanel) | `src/webview/features/F06/SidebarSettingsPanel.tsx` |
| `ResizableSplitPane` | [global_components](../../core/global_components.md#resizablesplitpane) | `src/webview/shared/components/ResizableSplitPane.tsx` |
| `PaneTree` | 이 문서 | `src/webview/features/F02/PaneTree.tsx` |
| `useChangedFileTree` | 이 문서 (F02 소속 훅) | `src/webview/features/F02/useChangedFileTree.ts` |
| `useSymbolGraph` | 이 문서 (F10 소속 훅) | `src/webview/features/F10/useSymbolGraph.ts` |

---

## Screen States

| 상태 | 조건 | UI |
|------|------|----|
| `idle` | `selectedCommit === null`, 모든 leaf pane의 `activeTabId === null` | 사이드바 헤더/파일트리에 placeholder, 각 pane 본문 빈 상태 |
| `commitSelected` | `selectedCommit !== null`, 포커스 pane의 `activeTabId === null` | 커밋 컨텍스트만 갱신, 포커스 pane은 탭 미선택 상태 |
| `split` | `paneTree.kind === "split"` | `ResizableSplitPane`로 재귀 분할된 다중 pane |
| `code` | leaf pane의 `activeTab.panelType === "code"` | `CodeTabSplitArea` 내부에서 코드 뷰어 + 파일 AI 요약 + 심볼 캔버스를 중첩 분할 |
| `aiSummary` | leaf pane의 `activeTab.panelType === "aiSummary"` | 커밋 단위 `AISummaryPanel` |
| `fileCanvas` | leaf pane의 `activeTab.panelType === "fileCanvas"` | `DependencyCanvasPanel` |
| `note` | leaf pane의 `activeTab.panelType === "note"` | `NoteEditorPanel` |

---

## Navigation Rules

- 앱은 항상 S02에서 시작한다.
- 사이드바 커밋 목록에서 다른 커밋을 선택하면 `selectedCommit`과 커밋 종속 상태만 갱신되고, 화면은 그대로 S02에 머문다.
- 사이드바 전체 폭은 별도 리사이즈 핸들로 조정하며, 폭을 0까지 줄이면 사이드바 전체가 접힌다.
- 사이드바 헤더의 설정 버튼은 헤더를 포함한 사이드바 뷰 전체를 `settings` 로컬 뷰로 전환하며, 본문 탭과 사이드바 리사이즈/섹션 펼침 상태는 유지된다.
- AI 요약 패널의 "설정으로 이동" CTA도 동일한 사이드바 `settings` 로컬 뷰를 연다.
- `PaneTree`는 leaf pane 또는 split pane으로 이루어진 재귀 트리다. split pane은 `ResizableSplitPane`을 재사용해 좌우/상하 분할을 렌더링한다.
- `WorkspaceTabBar`의 좌측 탭 목록은 가로 스크롤되고, 스크롤바가 탭 내용을 덮지 않도록 `scrollbar-gutter`와 하단 여백을 둔다.
- `WorkspaceTabBar` 우측의 `AISummaryToggleButton` / `FileCanvasToggleButton` / `NoteToggleButton`은 `PaneActionsGroup`으로 묶여 기본 접힘 상태이며, 그룹 토글 버튼을 눌러야 펼쳐진다. 이 펼침 상태는 leaf pane별로 독립이며 Webview State에 저장되지 않는다.
- leaf pane은 클릭해도 포커스 강조 아웃라인을 표시하지 않는다. `focusedPaneId`는 사이드바 커밋/파일 컨텍스트가 어느 pane을 따를지 결정하는 내부 상태로만 쓰인다.
- 같은 대상(`panelType + commitHash + filePath`) 탭이 이미 열려 있으면 현재 leaf pane 안에서 새 탭을 만들지 않고 기존 탭을 활성화한다.
- 최상위 워크스페이스 탭은 `code` / `aiSummary` / `fileCanvas` / `note` 네 종류만 연다. 파일 단위 AI 요약과 심볼 캔버스는 독립 탭이 아니라 `code` 탭 내부 토글로만 연다.
- 탭을 드래그해 다른 leaf pane의 상/하/좌/우 가장자리로 드롭하면 해당 방향으로 pane이 분할된다. 중앙 합류 드롭은 지원하지 않는다.
- 탭을 닫으면 같은 pane 안에서 오른쪽 우선 fallback 탭을 활성화하고, leaf pane의 마지막 탭을 닫으면 그 pane은 트리에서 제거되며 sibling pane이 공간을 승계한다.
- 포커스 pane은 패널 내부 클릭 또는 탭 활성화로 전환되며, 사이드바의 커밋/파일 컨텍스트는 `focusedPaneId`가 가리키는 leaf pane을 따른다.
- 분할 레이아웃은 Webview State에 저장하지 않는다. 웹뷰 재생성 후에는 단일 pane으로 초기화된다.
- 노트는 더 이상 S07 화면으로 이동하지 않고 S02 내부 `note` 탭으로 열리며, 탭 이탈 시 저장되지 않은 초안은 즉시 플러시 저장된다.
- `code` 탭 내부의 `codeInnerPanels`(파일 AI 요약 / 심볼 캔버스) 상태도 최상위 pane 분할과 마찬가지로 영속화하지 않는다.
