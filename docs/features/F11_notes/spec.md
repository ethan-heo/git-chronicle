# Feature: F11_Notes

## Purpose

S02 사이드바의 Notes 섹션에서 커밋과 무관한 독립 마크다운 노트를 파일 트리 형태로 관리하고, 선택한 노트를 워크스페이스 `note` 탭에서 자동 저장 편집한다.

## Domain Glossary

Feature 간 공유되는 용어는 [core/glossary.md](../../core/glossary.md)를 참고한다. 아래는 F11 전용 용어다.

| 용어 | 정의 | 관련 코드 식별자 |
|---|---|---|
| 노트(Note) | `savePath` 아래 실제 파일로 저장되는 독립 마크다운 문서. 열려 있는 탭에서는 디바운스 자동저장된다 | `noteTree`, `relativePath`, `SAVE_NOTE` |
| AI 요약 링크 노트 | F05b/F09에서 저장한 AI 요약 노트. `aiSummaryLink` 메타데이터가 있으면 클릭 시 일반 노트 대신 AI 요약 탭을 복원한다 | `aiSummaryLink`, `openNoteTreeEntry()` |
| 노트 트리(Note Tree) | 실제 디렉토리 구조를 그대로 반영한 사이드바 목록. 폴더 펼침/접힘, 파일 클릭, 드래그 이동을 지원한다 | `NotesSection`, `buildNoteTree()` |

## Business Rules

- 노트 목록과 저장 루트는 `{savePath}` 자체를 사용한다. 목록 트리는 실제 디렉토리 구조와 1:1로 대응한다.
- 새 노트 이름에 확장자가 없으면 `.md`를 자동 부여한다.
- 새 노트 이름에 `/`가 포함되면 해당 경로의 하위 폴더를 자동 생성한다.
- 노트는 S02 사이드바 `NotesSection`의 파일 클릭으로만 연다. 같은 `relativePath`를 다시 클릭하면 기존 탭을 활성화하고 중복 탭은 만들지 않는다.
- 사이드바에서 파일을 폴더로 드래그하면 실제 파일도 같은 경로로 이동한다. 대상에 동명 파일이 있으면 이동을 거부한다.
- 삭제는 인라인 재클릭 확인 방식이며, 파일 삭제 뒤 비어 있는 상위 폴더는 `savePath` 루트 직전까지 자동 정리한다.
- 저장 방식은 명시적 버튼 없이 디바운스 자동저장이다.
- `edit` 모드는 순수 텍스트 영역이 아니라 Obsidian 스타일 라이브 프리뷰 편집기다. 커서가 위치한 줄/구간만 원본 마크다운 문법을 유지하고, 그 밖의 줄에서는 렌더링 결과를 인라인으로 보여준다.
- 라이브 프리뷰 1차 지원 범위는 heading, bold, italic, strikethrough, inline code, link, checkbox, blockquote, hr, 목록(`-`/`*`/`1.`), GFM 파이프 테이블(`| ... |`)과 정렬 구문(`:---`, `---:`, `:---:`)이다.
- 링크는 편집 중 오동작을 막기 위해 일반 클릭으로는 열리지 않고 Cmd/Ctrl+클릭에서만 `OPEN_EXTERNAL_URL`로 연다.
- 체크박스는 렌더링된 위젯 클릭으로 원문 `- [ ]` / `- [x]` 텍스트를 직접 토글한다.
- F05b AI 요약을 [저장]하면 `.ai.md` 파일로 저장되어 이 노트 트리에 즉시 나타난다.
- `aiSummaryLink.commitMessage`가 포함된 AI 요약 노트를 클릭하면 일반 `note` 탭 대신 연결된 `aiSummary` 탭 또는 `code` 탭 내부 AI 요약 패널을 연다.
- 이 기능 배포 전 저장돼 `aiSummaryLink.commitMessage`가 없는 기존 요약 노트는 하위 호환을 위해 계속 일반 `note` 탭으로 연다.
- 탭 전환 또는 닫기로 `NoteEditorPanel`이 언마운트될 때 저장되지 않은 초안이 있으면 디바운스를 기다리지 않고 즉시 저장한다.
- 저장 경로가 없으면 F05b와 동일한 "저장 경로를 먼저 설정해주세요" 안내를 사용한다.
- F01/F02/F03/F04/F10에서 복사한 내용은 불필요한 제목/라벨 없이 핵심 텍스트만 클립보드에 기록된다. F03/F04/F10은 선택 본문 기준의 코드블록/Mermaid를 유지하고, F01/F02는 식별에 필요한 최소 텍스트만 복사한다.
- `NoteEditorPanel`은 별도 모드 전환 없이 라이브 프리뷰 편집기 하나만 렌더링한다.
- `edit` 라이브 프리뷰의 fenced code block은 언어 태그가 있으면 `shiki` 기반 문법 강조를 적용한다. 지원 언어 범위는 css/html/javascript/json/jsx/markdown/mdx/tsx/typescript/yaml/bash/python/sql/diff다.
- `edit` 라이브 프리뷰에서 ```mermaid 블록은 커서가 블록 밖에 있을 때 다이어그램 위젯으로 치환되고, 커서가 블록 안으로 들어오면 다시 원문 마크다운으로 편집 가능해야 한다.

## Data Sources

- `savePath`
- `noteTree`
- `relativePath`
- `noteContent`

## Outputs

- `{savePath}/**/*`
- `FETCH_NOTE_TREE` / `CREATE_NOTE` / `DELETE_NOTE` / `MOVE_NOTE` / `FETCH_NOTE` / `SAVE_NOTE`
