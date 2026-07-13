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
| `NoteEditorPanel` | 노트 로드/저장과 단일 라이브 에디터 호스트 | `src/webview/features/F11/NoteEditorPanel.tsx` |
| `MarkdownLiveEditor` | CodeMirror 6 기반 라이브 프리뷰 편집기. 커서 기반 마크다운 문법 표시/은닉, Cmd/Ctrl+클릭 링크 열기, 체크박스 토글, fenced code/mermaid/table 위젯 렌더링 | `src/webview/features/F11/MarkdownLiveEditor.tsx` |
| `MermaidBlock` | ```mermaid 코드블록 미리보기 렌더링 | `src/webview/features/F11/MermaidBlock.tsx` |
| `CopyMarkdownButton` | 각 기능의 복사 트리거 | `src/webview/features/F11/CopyMarkdownButton.tsx` |

## Interaction

- Notes 섹션 활성 시 `FETCH_NOTE_TREE`
- 새 노트 생성 시 `CREATE_NOTE`, 삭제 시 `DELETE_NOTE`, 폴더 드롭 이동 시 `MOVE_NOTE`
- 파일 클릭으로 `relativePath`를 조회해 일반 노트면 `note` 탭을, `aiSummaryLink`가 있으면 연결된 `aiSummary` 또는 `code` 탭을 연다
- 진입 시 현재 탭의 `relativePath` 기준으로 `FETCH_NOTE`
- 입력 후 1000ms 디바운스 뒤 `SAVE_NOTE`
- 탭 전환/닫기로 패널이 언마운트될 때 저장되지 않은 초안이 있으면 즉시 플러시 저장
- `NoteEditorPanel`은 별도 모드 전환 UI 없이 `MarkdownLiveEditor` 하나만 렌더링한다
- `MarkdownLiveEditor`는 `relativePath`를 React `key`로 받아 노트 전환 시 전체 재마운트된다. 덕분에 각 노트의 undo 히스토리, selection, decoration cache가 다른 노트와 섞이지 않는다
- `MarkdownLiveEditor`는 shared Shiki highlighter를 재사용하되, 편집 커서가 블록 밖일 때만 위젯/하이라이트를 적용한다
- mermaid 다이어그램은 `MermaidBlock`이 사용하는 렌더 캐시를 `prewarmMermaidDiagram()`으로 미리 채운 뒤에만 위젯으로 접힌다. 접힌 위젯은 `MermaidBlock`을 마운트하지 않고 캐시된 SVG를 직접 삽입한다 — 위젯이 빈 상태로 먼저 붙었다가 렌더링이 끝난 뒤 그 자리에서 커지면 CodeMirror의 줄 높이 캐시가 어긋나 방향키 커서 이동이 엉뚱한 줄로 튀기 때문이다
- GFM 파이프 테이블은 `parseTableBlocks()`가 헤더/정렬 구분자/바디 행을 하나의 블록으로 인식하고, 커서가 블록 밖에 있을 때만 `TableWidget`으로 전체를 접는다. 셀 내부 텍스트는 기존 인라인 문법 클래스(`cm-md-strong`, `cm-md-link`, `cm-md-inline-code` 등)를 재사용해 렌더링한다
- 헤딩/인용구/굵게/기울임/링크/인라인 코드/취소선처럼 폭 0인 `hiddenSyntaxDecoration`으로 문법 기호를 숨기는 줄로 방향키 커서가 진입할 때는 `moveVerticalLineAvoidingLayoutAmbiguity`가 CodeMirror의 픽셀 좌표 계산을 우회하고 논리적 줄/컬럼으로 직접 위치를 계산한다 — 폭 0 구간의 시작과 끝이 같은 x좌표에 놓여 CodeMirror가 정확한 위치를 구분하지 못해 커서가 숨겨진 기호 뒤로 튀기 때문이다
- 테이블도 mermaid와 같은 block 위젯 접힘 범주에 포함되므로, `moveVerticalLineAvoidingLayoutAmbiguity`는 커서가 블록 밖에서 표 블록 범위로 진입하는 위/아래 방향키 이동만 진입 방향과 같은 쪽의 경계 줄(아래로 진입하면 헤더 줄, 위로 진입하면 마지막 row 줄)로 직접 보정한다 — 반대쪽 경계로 보정하면 표 전체를 한 번에 건너뛰어 버린다. 커서가 이미 블록 내부 줄(mermaid는 펜스 시작~끝, 표는 헤더~바디 끝)에 있을 때는 이 보정을 적용하지 않고 일반 줄 이동에 맡긴다 — 그렇지 않으면 이미 펼쳐진 블록 내부에서 줄을 옮길 때마다 매번 "진입"으로 오인해 중간 줄을 건너뛰고 경계 줄로 순간이동한다
- 수평선(`---`) 줄을 대체하는 `HorizontalRuleWidget`은 `Decoration.replace`에 `block: true`를 주지 않는다 — 한 줄 전체를 대체하는 위젯이라 `block: true` 없이도 정상 렌더링되는데, CodeMirror 6.43.6에서는 `block: true`가 붙으면 이 위젯보다 아래에 있는 모든 줄에서 방향키 세로 이동 좌표 계산이 깨져 거리와 무관하게 항상 위젯 바로 앞 줄로 커서가 튄다
- mermaid/table처럼 여러 문서 줄을 하나의 `block: true` replace 데코레이션으로 접는 위젯이 문서에 존재하면, CodeMirror 6.43.6의 내부 높이 맵(heightMap)이 실제 DOM 높이와 영구히 어긋난다 — `requestMeasure()`를 호출하고 충분히 기다려도 스스로 복구되지 않으며, `EditorView.atomicRanges`에 접힌 범위를 등록해도 `moveVertically()` 내부의 `posAtCoords`가 이 높이 맵을 그대로 사용해 해결되지 않는다. 그 결과 이런 위젯이 있는 문서에서는 위젯과 맞닿지 않은, 훨씬 떨어진 줄에서도 위 방향키가 위젯 바로 앞 줄로 순간이동한다. 따라서 문서에 mermaid/table 위젯이 하나라도 있으면 `moveVerticalLineAvoidingLayoutAmbiguity`는 CodeMirror의 픽셀 좌표 기반 이동을 아예 신뢰하지 않고, 화면에서 줄바꿈되지 않은(단일 시각적 줄인) 일반 줄 이동까지 논리적 줄/컬럼으로 직접 계산해 처리한다. `isLineWrapped()`가 `getClientRects().length`로 실제 DOM을 실측해 줄바꿈 여부를 판정하며(높이 맵이 아닌 실제 DOM 사각형을 쓰는 이유도 같은 결함 때문이다), 줄바꿈된 긴 줄 내부에서의 시각적 줄 이동만 CodeMirror 기본 동작에 남겨둔다
