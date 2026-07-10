# Feature: F05b_AISummaryCommit

## Related Original Sections

- [화면 구성 > S-02](../../product/product_overview.md#s-02)
- [사용자 시나리오 > 3.5 AI 정리 뷰어](../../product/product_overview.md#feature-summary)
- [기능 상세 > 4.1 AI 정리 > 커밋 단위](../../product/product_overview.md#feature-summary)
- [Blueprint (UI/컴포넌트 명세)](./blueprint.md)

---

## Purpose

커밋 전체 변경(모든 파일의 diff 합산)을 AI CLI에 전달하고, 커밋 단위 종합 요약을 마크다운으로 생성·표시·저장한다. 파일 단위 AI 요약은 코드 탭 내부 토글로 열리며, 이 기능은 커밋 전체 맥락을 요약하는 전용 진입점이다.

---

## Domain Glossary

Feature 간 공유되는 용어는 [core/glossary.md](../../core/glossary.md)를 참고한다. 아래는 F05b 전용 용어다.

| 용어 | 정의 | 관련 코드 식별자 |
|---|---|---|
| 저장본(Saved Summary) | 이미 생성되어 로컬에 저장된 AI 정리 결과. 재생성 전까지 패널 진입 시 즉시 표시된다 | `hasSavedCommitSummary`, `loadCommitSummary()` |
| 재생성(Regenerate) | 기존 저장본을 덮어쓰기 확인 다이얼로그 통과 후 동일 입력으로 다시 생성하는 동작 | `RegenerateButton.tsx`, `forceRegenerate` |

---

## User Goal

커밋 전체에서 무엇이 달성되었는지를 AI가 종합 요약한 마크다운으로 파악하고, 로컬에 저장하여 나중에 재활용한다.

---

## User Scenarios

1. [커밋 AI 정리] 클릭 시 S02 본문 `aiSummary` 패널 활성화. 헤더에 `{커밋 메시지} > 커밋 전체 요약` 표시.
2. **기존 저장본이 있는 경우**: 저장된 마크다운 파일을 즉시 불러와 표시. 재생성 아이콘 버튼 제공.
3. **저장본이 없는 경우**: 클릭 즉시 커밋 내 전체 파일 diff를 컨텍스트로 AI가 마크다운 형식으로 정리.
   - 정리된 내용은 설정 경로에 `전체_파일_정리.md` 파일명으로 자동 저장.
   - 저장 경로가 설정되어 있지 않으면 "저장 경로를 먼저 설정해주세요" 안내 + 설정 이동 CTA.
4. AI가 설정되어 있지 않으면 "AI가 설정되지 않았습니다" 안내 + 설정(⚙) 이동 CTA.
5. 재생성 아이콘 버튼: 덮어쓰기 확인 다이얼로그 → 확인 시 동일 입력으로 재처리.

---

## Business Rules

| 항목 | 내용 |
|------|------|
| 입력 | 커밋 내 전체 파일 diff 합산 + 커밋 메시지(목적 분류 힌트로 프롬프트에 포함) |
| 처리 | 설정된 AI CLI에 커밋 단위 프롬프트 + 전체 diff 전달 (`child_process.spawn` 스트리밍) |
| CLI 실행 옵션 | Claude는 `-p`, Gemini는 `--skip-trust --prompt`, Codex는 `exec --skip-git-repo-check` 조합으로 비대화형 실행 |
| 출력 | 마크다운 형식의 커밋 종합 요약 (스트리밍 타이핑 효과로 실시간 표시) |
| 저장 | `{설정경로}/{shortHash}_{sanitizedCommitMessage}/전체_파일_정리.md` 로컬 저장. 상세 디렉토리 생성 규칙은 [F07 저장 파일 Naming](../F07_save_path_settings/spec.md#저장-파일-naming)을 따른다 |
| 기존 저장본 | 신규 경로를 먼저 확인하고, 없으면 신규 폴더의 `_commit_summary.md`, 기존 `{설정경로}/{커밋해시}/_commit_summary.md` 순서로 폴백하여 즉시 표시 |
| 재생성 | 재생성 아이콘 클릭 → 덮어쓰기 확인 다이얼로그 → 확인 시 동일 입력으로 재처리 |
| 복사 | 완료된 요약 본문 일부를 드래그해 복사하면 렌더링된 plain text가 아니라 해당 범위의 원본 마크다운 문자열 조각이 클립보드에 기록된다 |
| Code block copy | fenced code block 위에 hover 시 복사 버튼이 나타나며, 클릭 시 해당 코드블록의 원본 마크다운(```` 포함)을 클립보드에 기록하고 성공 토스트를 표시한다 |
| Code block highlighting | fenced code block에 언어 태그가 있으면 `shiki` 기반 문법 강조를 적용한다. 지원 언어는 기존 웹 중심 세트(css/html/javascript/json/jsx/markdown/mdx/tsx/typescript/yaml)에 `bash`, `python`, `sql`, `diff`를 추가한 범위를 따른다 |
| Mermaid preview | ```` ```mermaid ```` 코드블록은 다이어그램 preview로 렌더링되며, preview 상태에서도 hover 복사 버튼 또는 preview 선택 복사로 원본 Mermaid 마크다운 블록 복사가 가능해야 하고, 복사 버튼 클릭 시 성공 토스트를 표시한다 |
| 토큰 한계 초과 | "diff가 큽니다. AI가 일부를 생략할 수 있습니다" 안내 표시 후 그대로 호출 |
| 실패 / 타임아웃 | 타임아웃 120초. 실패 시 "생성에 실패했습니다" 오류 메시지 + [재시도] 버튼 표시 |

---

## 기본 프롬프트 (커밋 단위)

실제 템플릿은 [prompts.ts의 `buildCommitSummaryPrompt`](../../../src/extension/prompts.ts)가 유일한 출처다. 지시문은 영어, 출력 조건에 명시된 결과물은 한국어로 생성된다.

```
Here is the diff for all files changed in a Git commit.
Summarize the entire commit in Markdown so the developer can review their work later.

Commit hash: {shortHash}
Commit message: {commitMessage}

## Conditions
- Output language: Korean
- Write for someone new to this project: avoid unexplained jargon, and when a technical term is unavoidable, add a short plain-language gloss in parentheses on first use
- Focus on what the commit achieved overall rather than listing each file
- Focus on intent and context rather than translating code line by line
- Use the commit message as a hint for intent, but verify it against the actual diff and call out any mismatch
- Avoid vague statements like "코드를 개선했습니다"; cite actual function/variable names, file paths, or concrete before → after behavior
- If inference is needed, phrase it as "보임" or "추정됨"
- Follow the structure below

## Output format
### One-line summary
(Summarize the work in one sentence)

### Change purpose
(One or more of: 기능 추가 / 버그 수정 / 리팩터링 / 성능 개선 / 문서화 / 테스트 보강 / 유지보수(빌드·설정 등) / 스타일 정리 — multiple allowed, described in plain Korean, not developer shorthand like "feat"/"fix". Explain why, citing the diff)

### Key files and points
- Use the file-size table (--stat summary) at the top of the diff below to judge which files matter most
- Order the numbered list from most to least important, so the file that most drives the commit's purpose comes first
- List files with substantial changes as a numbered list. Each numbered item is the file name, followed by two nested unordered sub-bullets, exactly in this shape:
  1. `{file name}`
     - 바뀐 점: (what changed, citing concrete names or paths)
     - 중요한 점: (why this file matters: its role in the commit's purpose, e.g. "핵심 로직이 있어서", "이 변경의 시작점이라서", "다른 파일이 참조하는 공통 타입이 바뀌어서")
- If more than 5 files changed, group minor ones (formatting, lockfiles, generated code, or small unrelated edits) into one final numbered item without sub-bullets, e.g. "N. 그 외 {N}개 파일: (공통 성격 요약)"
- If 5 or fewer files changed, list all of them individually without grouping

### Technical rationale, if applicable
(Explain any notable implementation choices or patterns, referencing specific code)

## diff
{diff}
```

`commitMessage`가 없는 경우(빈 문자열 등) `Commit message:` 줄은 생략된다.

---

## 기본 프롬프트 (파일 단위)

S02 `code` 탭 내부의 파일 AI 요약 토글([F02_ChangedFileTree](../F02_changed_file_tree/spec.md), [design_principles.md](../../core/design_principles.md))이 호출하는 프롬프트다. `useAISummary`가 commit/file 스코프를 함께 다루므로 이 문서에 함께 둔다. 실제 템플릿은 [prompts.ts의 `buildFileSummaryPrompt`](../../../src/extension/prompts.ts)가 유일한 출처다.

```
Here is the diff for a file changed in a Git commit.
Summarize it in Markdown so the developer can review their work later.

File path: {filePath}
Commit message: {commitMessage}

## Conditions
- Output language: Korean
- Write for someone new to this project: avoid unexplained jargon, and when a technical term is unavoidable, add a short plain-language gloss in parentheses on first use
- Focus on intent and context rather than translating code line by line
- Use the commit message only as background context for why this file was touched — not as grounds for classifying Change purpose or selecting Key points, which must be judged from this file's own diff. If the commit message's overall intent doesn't match what this file's diff actually shows, call out the mismatch
- Avoid vague statements like "코드를 개선했습니다"; cite actual function/variable names or concrete before → after behavior
- If inference is needed, phrase it as "보임" or "추정됨"
- Follow the structure below

## Output format
### One-line summary
(Summarize the change in one sentence)

### Change purpose
(One or more of: 기능 추가 / 버그 수정 / 리팩터링 / 성능 개선 / 문서화 / 테스트 보강 / 유지보수(빌드·설정 등) / 스타일 정리 — multiple allowed, described in plain Korean, not developer shorthand like "feat"/"fix". Explain why, citing the diff)

### Key points
- Select only the points that truly matter for understanding the change; skip trivial details
- Order the numbered list from most to least important, so the first item is what the reader should notice first
- List points as a numbered list. Each numbered item is the function/variable name or line, followed by two nested unordered sub-bullets, exactly in this shape:
  1. `{function/variable name or line}`
     - 바뀐 점: (what changed)
     - 중요한 점: (why this matters: what problem it solves or what behavior it changes)

### Technical rationale, if applicable
(Explain any notable implementation choices or patterns)

## diff
{diff}
```

`commitMessage`가 없는 경우(빈 문자열 등) `Commit message:` 줄은 생략된다.

---

## Error Handling

| 상황 | 발생 조건 |
|------|------|
| AI 미설정 | `activeAIProvider === null` |
| 저장 경로 미설정 | `savePath === null` |
| 타임아웃 (120초) | AI CLI 응답이 120초 내 완료되지 않음 |
| CLI 실행 실패 | `child_process.spawn` 실행 자체가 실패 |
| CLI 로그인/인증 필요 | provider CLI가 미인증 상태로 종료 |
| 토큰 초과 | diff 크기가 provider 토큰 한계에 근접(호출은 계속 진행) |

> 정확한 안내 메시지·컴포넌트는 [blueprint.md](./blueprint.md)의 Empty States / Error States가 유일한 출처다.

---

## Dependencies

- [F06_AISettings](../F06_ai_settings/spec.md) — `activeAIProvider` 필요
- [F07_SavePathSettings](../F07_save_path_settings/spec.md) — `savePath` 필요
- [F02_ChangedFileTree](../F02_changed_file_tree/spec.md) — [커밋 AI 정리] 버튼 진입점

---

## Related Screens

- [S02_WorkspaceScreen](../../screens/S02_history_view/blueprint.md) — 본문 `aiSummary` 패널로 통합

---

## Data Sources

| 소스 | 타입 | 설명 |
|------|------|------|
| `selectedCommit` | `Commit` | 전역 상태. 전체 diff 추출 기준 커밋 및 헤더 표시 |
| `changedFiles` | `ChangedFile[]` | 전역 상태. 전체 파일 diff 합산용 파일 목록 |
| `activeAIProvider` | `AIProviderName \| null` | 전역 상태. 사용할 AI CLI 결정 |
| `savePath` | `string \| null` | 전역 상태. 저장본 파일 위치 결정 |
| simple-git diff (전체) | `string` | Extension Host에서 커밋 내 전체 파일 diff 합산 추출 |
| 로컬 저장본 | `string` | `{savePath}/{shortHash}_{sanitizedCommitMessage}/전체_파일_정리.md` 파일 존재 시 즉시 읽어 표시. 구 형식도 폴백으로 읽음 |

---

## Outputs

| 출력 | 타입 | 설명 |
|------|------|------|
| `currentSummaryContent` | `string` | 전역 상태. AI 스트리밍 텍스트 누적 |
| 저장 파일 | `.md` | `{savePath}/{shortHash}_{sanitizedCommitMessage}/전체_파일_정리.md` 로컬 파일 생성 |

---

## Side Effects

| 효과 | 트리거 | 설명 |
|------|--------|------|
| `isLoadingSummary = true` | 저장본 확인 시작 | 저장본/설정 확인 로딩 상태 전환 |
| `isGeneratingSummary = true` | AI 호출 시작 | 로딩 상태 전환 |
| `isGeneratingSummary = false` | AI 완료 / 실패 / 타임아웃 | 로딩 상태 해제 |
| `currentSummaryContent` 스트리밍 업데이트 | `child_process.spawn` stdout | 청크 단위로 전역 상태 누적 업데이트 |
| 로컬 파일 쓰기 | AI 생성 완료 | `fs.writeFileSync`로 `전체_파일_정리.md` 저장 (경로 없으면 `fs.mkdirSync` 선행) |
| `summaryError` 업데이트 | 타임아웃 / CLI 실패 | 오류 메시지 전역 상태 설정 |
