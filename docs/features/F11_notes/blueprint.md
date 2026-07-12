# Blueprint: F11_Notes

## Layout

- `NotesSection`
- `NoteTree`
- `NoteDirectoryNode`
- `NoteFileNode`
- `NoteEditorPanel`

## Component Definitions

| 컴포넌트 | 역할 | 구현 |
|---|---|---|
| `NotesSection` | 사이드바 노트 섹션, 새 노트 입력, note tree 메시지 구독 | `src/webview/features/F11/NotesSection.tsx` |
| `NoteTree` | 목록 상태 분기 및 루트 트리 렌더링 | `src/webview/features/F11/NoteTree.tsx` |
| `NoteDirectoryNode` | 폴더 노드 재귀 렌더링, 드롭 타겟 | `src/webview/features/F11/NoteDirectoryNode.tsx` |
| `NoteFileNode` | 파일 노드 렌더링, note 탭 열기, 삭제 확인 | `src/webview/features/F11/NoteFileNode.tsx` |
| `noteTreeModel.ts` | `NoteEntry[]`를 디렉토리 트리로 변환 | `src/webview/features/F11/noteTreeModel.ts` |
| `NoteEditorPanel` | 노트 로드/저장/모드 전환 | `src/webview/features/F11/NoteEditorPanel.tsx` |
| `HighlightedCode` | fenced code block 문법 강조 렌더링 | `src/webview/shared/highlighter/HighlightedCode.tsx` |
| `MermaidBlock` | ```mermaid 코드블록 미리보기 렌더링 | `src/webview/features/F11/MermaidBlock.tsx` |
| `CopyMarkdownButton` | 각 기능의 복사 트리거 | `src/webview/features/F11/CopyMarkdownButton.tsx` |

## Interaction

- Notes 섹션 활성 시 `FETCH_NOTE_TREE`
- 새 노트 생성 시 `CREATE_NOTE`, 삭제 시 `DELETE_NOTE`, 폴더 드롭 이동 시 `MOVE_NOTE`
- 파일 클릭으로 `relativePath`를 조회해 일반 노트면 `note` 탭을, `aiSummaryLink`가 있으면 연결된 `aiSummary` 또는 `code` 탭을 연다
- 진입 시 현재 탭의 `relativePath` 기준으로 `FETCH_NOTE`
- 입력 후 1000ms 디바운스 뒤 `SAVE_NOTE`
- 탭 전환/닫기로 패널이 언마운트될 때 저장되지 않은 초안이 있으면 즉시 플러시 저장
- `edit` / `split` / `preview` 모드 전환
- preview에서 언어 태그가 있는 fenced code block은 `HighlightedCode`로 렌더링하고, `mermaid`는 기존처럼 `MermaidBlock`으로 분기
