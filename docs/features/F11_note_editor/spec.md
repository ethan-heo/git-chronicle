# Feature: F11_NoteEditor

## Purpose

커밋 컨텍스트를 유지한 채 독립 화면에서 마크다운 노트를 작성하고 자동 저장한다. 기존 기능에서 복사한 마크다운/mermaid 조각을 붙여넣어 사용자 주도의 분석 기록을 남긴다.

## Domain Glossary

Feature 간 공유되는 용어는 [core/glossary.md](../../core/glossary.md)를 참고한다. 아래는 F11 전용 용어다.

| 용어 | 정의 | 관련 코드 식별자 |
|---|---|---|
| 노트(Note) | 커밋 컨텍스트에 종속된 자유 형식 마크다운 메모. 명시적 저장 버튼 없이 디바운스로 자동저장된다 | `noteContent`, `SAVE_NOTE` |

## Business Rules

- 노트 화면은 `S07_NoteScreen`으로 S02 워크스페이스 본문 `WorkspaceHeading`의 노트 아이콘 클릭 시 진입한다.
- 저장 파일은 `{savePath}/{shortHash}_{sanitizedCommitMessage}/노트.md`다.
- 저장 방식은 명시적 버튼 없이 디바운스 자동저장이다.
- 저장 경로가 없으면 F05b와 동일한 "저장 경로를 먼저 설정해주세요" 안내를 사용한다.
- F01/F02/F03/F04/F10에서 복사한 내용은 마크다운 또는 Mermaid 코드블록으로 클립보드에 기록된다.
- 미리보기는 일반 마크다운을 렌더링하고, ```mermaid 코드블록은 다이어그램으로 렌더링한다.

## Data Sources

- `selectedCommit`
- `savePath`
- `noteContent`

## Outputs

- `노트.md`
- `FETCH_NOTE` / `SAVE_NOTE`
