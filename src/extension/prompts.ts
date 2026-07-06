export function buildFileSummaryPrompt(filePath: string, diff: string, commitMessage?: string): string {
  return `Here is the diff for a file changed in a Git commit.
Summarize it in Markdown so the developer can review their work later.

File path: ${filePath}
${commitMessage ? `Commit message: ${commitMessage}\n` : ''}
## Conditions
- Output language: Korean
- Focus on intent and context rather than translating code line by line
- Use the commit message as a hint for intent, but verify it against the actual diff and call out any mismatch
- Avoid vague statements like "코드를 개선했습니다"; cite actual function/variable names or concrete before → after behavior
- If inference is needed, phrase it as "보임" or "추정됨"
- Follow the structure below

## Output format
### One-line summary
(Summarize the change in one sentence)

### Change purpose
(One or more of: feat / fix / refactor / perf / docs / test / chore / style — multiple allowed. Explain why, citing the diff)

### Key points
- (Cite specific function/variable names or lines)
-

### Technical rationale, if applicable
(Explain any notable implementation choices or patterns)

## diff
\`\`\`diff
${diff}
\`\`\``;
}

export function buildCommitSummaryPrompt(commitHash: string, diff: string, commitMessage?: string): string {
  return `Here is the diff for all files changed in a Git commit.
Summarize the entire commit in Markdown so the developer can review their work later.

Commit hash: ${commitHash.slice(0, 7)}
${commitMessage ? `Commit message: ${commitMessage}\n` : ''}
## Conditions
- Output language: Korean
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
(One or more of: feat / fix / refactor / perf / docs / test / chore / style — multiple allowed. Explain why, citing the diff)

### Key files and points
- Use the file-size table (--stat summary) at the top of the diff below to judge which files matter most
- List files with substantial changes individually: \`{file name}\`: (specific point, citing concrete names or paths)
- If more than 5 files changed, group minor ones (formatting, lockfiles, generated code, or small unrelated edits) into a single line like "그 외 {N}개 파일: (공통 성격 요약)"
- If 5 or fewer files changed, list all of them individually without grouping

### Technical rationale, if applicable
(Explain any notable implementation choices or patterns, referencing specific code)

## diff
\`\`\`diff
${diff}
\`\`\``;
}

export function buildSummaryQAPrompt(currentSummaryContent: string, diff: string, question: string): string {
  const summaryOnly = currentSummaryContent.split(/\n---\n\s*\n(?:(?:## Q&A\s*\n\s*\n)?### Q\.)/)[0]?.trim() ?? currentSummaryContent.trim();

  return `아래는 Git 변경 파일의 diff와 AI가 생성한 요약입니다.
사용자의 질문에 답변해주세요.

## 조건
- 출력 언어: 한국어
- diff와 요약 내용을 바탕으로 답변할 것
- 추측이 필요한 경우 "~로 보임", "~한 것으로 추정됨" 형태로 표현할 것

## 기존 요약
${summaryOnly}

## diff
\`\`\`diff
${diff}
\`\`\`

## 질문
${question}`;
}
