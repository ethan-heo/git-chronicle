# Feature: F11_Notes

## Purpose

S02 사이드바의 Notes 섹션에서 커밋과 무관한 독립 마크다운 노트를 파일 트리 형태로 관리하고, 선택한 노트를 워크스페이스 `note` 탭에서 자동 저장 편집한다.

## Domain Glossary

Feature 간 공유되는 용어는 [core/glossary.md](../../core/glossary.md)를 참고한다. 아래는 F11 전용 용어다.

| 용어 | 정의 | 관련 코드 식별자 |
|---|---|---|
| 노트(Note) | `savePath/notes/` 아래 실제 파일로 저장되는 독립 마크다운 문서. 열려 있는 탭에서는 디바운스 자동저장된다 | `noteTree`, `relativePath`, `SAVE_NOTE` |
| 노트 트리(Note Tree) | 실제 디렉토리 구조를 그대로 반영한 사이드바 목록. 폴더 펼침/접힘, 파일 클릭, 드래그 이동을 지원한다 | `NotesSection`, `buildNoteTree()` |

## Business Rules

- 노트 목록과 저장 루트는 `{savePath}/notes/`를 사용한다. 목록 트리는 실제 디렉토리 구조와 1:1로 대응한다.
- 새 노트 이름에 확장자가 없으면 `.md`를 자동 부여한다.
- 새 노트 이름에 `/`가 포함되면 해당 경로의 하위 폴더를 자동 생성한다.
- 노트는 S02 사이드바 `NotesSection`의 파일 클릭으로만 연다. 같은 `relativePath`를 다시 클릭하면 기존 탭을 활성화하고 중복 탭은 만들지 않는다.
- 사이드바에서 파일을 폴더로 드래그하면 실제 파일도 같은 경로로 이동한다. 대상에 동명 파일이 있으면 이동을 거부한다.
- 삭제는 인라인 재클릭 확인 방식이며, 파일 삭제 뒤 비어 있는 상위 폴더는 `notes/` 루트 직전까지 자동 정리한다.
- 저장 방식은 명시적 버튼 없이 디바운스 자동저장이다.
- 탭 전환 또는 닫기로 `NoteEditorPanel`이 언마운트될 때 저장되지 않은 초안이 있으면 디바운스를 기다리지 않고 즉시 저장한다.
- 저장 경로가 없으면 F05b와 동일한 "저장 경로를 먼저 설정해주세요" 안내를 사용한다.
- F01/F02/F03/F04/F10에서 복사한 내용은 마크다운 또는 Mermaid 코드블록으로 클립보드에 기록된다.
- 미리보기는 일반 마크다운을 렌더링하고, ```mermaid 코드블록은 다이어그램으로 렌더링한다.
- 미리보기의 fenced code block은 언어 태그가 있으면 `shiki` 기반 문법 강조를 적용한다. 지원 언어 범위는 css/html/javascript/json/jsx/markdown/mdx/tsx/typescript/yaml/bash/python/sql/diff다.

## Data Sources

- `savePath`
- `noteTree`
- `relativePath`
- `noteContent`

## Outputs

- `{savePath}/notes/**/*`
- `FETCH_NOTE_TREE` / `CREATE_NOTE` / `DELETE_NOTE` / `MOVE_NOTE` / `FETCH_NOTE` / `SAVE_NOTE`
