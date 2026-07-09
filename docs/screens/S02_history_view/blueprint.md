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

하나의 지속형 워크스페이스 안에서 필터, 커밋 목록, 변경 파일 탐색, 본문 탭 전환을 모두 처리한다. S01은 별도 화면이 아니라 S02 사이드바 섹션으로 통합되었다.

---

## Entry Condition

확장 프로그램을 열면 항상 S02로 진입한다. 초기 상태는 `selectedCommit = null`, `openTabs = []`, `activeTabId = null`이며, 사용자가 사이드바 커밋 목록에서 커밋을 선택하면 커밋 종속 상태만 리셋되고 화면 전환은 발생하지 않는다.

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
│     │     ├─ FilterSection
│     │     │  └─ CommitFilterPanel (embedded)
│     │     ├─ CommitListSection
│     │     │  └─ CommitList
│     │     └─ FileTreeSection
│     │        └─ FileTree
│     └─ settings → SidebarSettingsPanel
│        ├─ SidebarSettingsHeader
│        ├─ AIProviderSection
│        └─ SavePathSection
├─ SidebarResizeHandle
└─ Main
   ├─ WorkspaceTabBar
   │  ├─ WorkspaceTabItem[] (가로 스크롤)
   │  └─ FixedActions
   │     ├─ AISummaryToggleButton
   │     ├─ FileCanvasToggleButton
   │     └─ NoteToggleButton
   └─ ActiveTabPanel
      ├─ code → CodeDiffPanel
      ├─ aiSummary → AISummaryPanel
      ├─ fileCanvas → DependencyCanvasPanel
      ├─ symbolGraph → SymbolGraphPanel (+ 내부 우측 상단 `SymbolCodePanelToggleButton`)
      └─ note → NoteEditorPanel
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
| `SidebarSettingsPanel` | [F06 blueprint](../../features/F06_ai_settings/blueprint.md#component-sidebarsettingspanel) | `src/webview/features/F06/SidebarSettingsPanel.tsx` |
| `ResizableSplitPane` | [global_components](../../core/global_components.md#resizablesplitpane) | `src/webview/shared/components/ResizableSplitPane.tsx` |
| `useChangedFileTree` | 이 문서 (F02 소속 훅) | `src/webview/features/F02/useChangedFileTree.ts` |
| `useSymbolGraph` | 이 문서 (F10 소속 훅) | `src/webview/features/F10/useSymbolGraph.ts` |

---

## Screen States

| 상태 | 조건 | UI |
|------|------|----|
| `idle` | `selectedCommit === null`, `activeTabId === null` | 사이드바 헤더/파일트리에 placeholder, 본문 빈 상태 |
| `commitSelected` | `selectedCommit !== null`, `activeTabId === null` | 커밋 컨텍스트만 갱신, 본문은 탭 미선택 상태 |
| `code` | `activeTab.panelType === "code"` | `CodeDiffPanel` |
| `aiSummary` | `activeTab.panelType === "aiSummary"` | `AISummaryPanel` |
| `fileCanvas` | `activeTab.panelType === "fileCanvas"` | `DependencyCanvasPanel` |
| `symbolGraph` | `activeTab.panelType === "symbolGraph"` | `SymbolGraphPanel` |
| `note` | `activeTab.panelType === "note"` | `NoteEditorPanel` |

---

## Navigation Rules

- 앱은 항상 S02에서 시작한다.
- 사이드바 커밋 목록에서 다른 커밋을 선택하면 `selectedCommit`과 커밋 종속 상태만 갱신되고, 화면은 그대로 S02에 머문다.
- 사이드바 전체 폭은 별도 리사이즈 핸들로 조정하며, 폭을 0까지 줄이면 사이드바 전체가 접힌다.
- 사이드바 헤더의 설정 버튼은 헤더를 포함한 사이드바 뷰 전체를 `settings` 로컬 뷰로 전환하며, 본문 탭과 사이드바 리사이즈/섹션 펼침 상태는 유지된다.
- AI 요약 패널의 "설정으로 이동" CTA도 동일한 사이드바 `settings` 로컬 뷰를 연다.
- `WorkspaceTabBar`의 좌측 탭 목록은 가로 스크롤되고, 스크롤바가 탭 내용을 덮지 않도록 `scrollbar-gutter`와 하단 여백을 둔다.
- 같은 대상(`panelType + commitHash + filePath`) 탭이 이미 열려 있으면 새 탭을 만들지 않고 기존 탭을 활성화한다.
- 탭을 닫으면 오른쪽 탭 우선, 없으면 왼쪽 탭을 활성화한다. 마지막 탭을 닫으면 `activeTabId = null`이 된다.
- 노트는 더 이상 S07 화면으로 이동하지 않고 S02 내부 `note` 탭으로 열리며, 탭 이탈 시 저장되지 않은 초안은 즉시 플러시 저장된다.
