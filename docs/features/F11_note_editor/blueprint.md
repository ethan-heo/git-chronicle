# Blueprint: F11_NoteEditor

## Layout

- `S07_NoteScreen`
- `TopHeader`
- `NotePreviewToggle`
- `textarea`
- `ReactMarkdown` preview
- `SaveStatusIndicator`

## Component Definitions

| 컴포넌트 | 역할 | 구현 |
|---|---|---|
| `S07NoteScreen` | 노트 로드/저장/모드 전환 | `src/webview/features/F11/S07_NoteScreen.tsx` |
| `CopyMarkdownButton` | 각 기능의 복사 트리거 | `src/webview/features/F11/CopyMarkdownButton.tsx` |

## Interaction

- 진입 시 현재 커밋 기준으로 `FETCH_NOTE`
- 입력 후 1000ms 디바운스 뒤 `SAVE_NOTE`
- `edit` / `split` / `preview` 모드 전환

