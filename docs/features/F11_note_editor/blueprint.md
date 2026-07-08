# Blueprint: F11_NoteEditor

## Layout

- `S07_NoteScreen`
- `TopHeader`
- `NotePreviewToggle`
- `textarea`
- `ReactMarkdown` preview
- `MermaidBlock` preview
- `SaveStatusIndicator`

## Component Definitions

| 컴포넌트 | 역할 | 구현 |
|---|---|---|
| `S07NoteScreen` | 노트 로드/저장/모드 전환 | `src/webview/features/F11/S07_NoteScreen.tsx` |
| `HighlightedCode` | fenced code block 문법 강조 렌더링 | `src/webview/shared/highlighter/HighlightedCode.tsx` |
| `MermaidBlock` | ```mermaid 코드블록 미리보기 렌더링 | `src/webview/features/F11/MermaidBlock.tsx` |
| `CopyMarkdownButton` | 각 기능의 복사 트리거 | `src/webview/features/F11/CopyMarkdownButton.tsx` |

## Interaction

- 진입 시 현재 커밋 기준으로 `FETCH_NOTE`
- 입력 후 1000ms 디바운스 뒤 `SAVE_NOTE`
- `edit` / `split` / `preview` 모드 전환
- preview에서 언어 태그가 있는 fenced code block은 `HighlightedCode`로 렌더링하고, `mermaid`는 기존처럼 `MermaidBlock`으로 분기
