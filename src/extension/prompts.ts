export function buildFileSummaryPrompt(filePath: string, diff: string): string {
  return `Here is the diff for a file changed in a Git commit.
Summarize it in Markdown so the developer can review their work later.

File path: ${filePath}

## Conditions
- Output language: Korean
- Focus on intent and context rather than translating code line by line
- If inference is needed, phrase it as "보임" or "추정됨"
- Follow the structure below

## Output format
### One-line summary
(Summarize the change in one sentence)

### Change purpose
(Choose from bug fix / feature / refactor / performance improvement and explain why)

### Key points
-
-

### Technical rationale, if applicable
(Explain any notable implementation choices or patterns)

## diff
\`\`\`diff
${diff}
\`\`\``;
}

export function buildCommitSummaryPrompt(commitHash: string, diff: string): string {
  return `Here is the diff for all files changed in a Git commit.
Summarize the entire commit in Markdown so the developer can review their work later.

Commit hash: ${commitHash.slice(0, 7)}

## Conditions
- Output language: Korean
- Focus on what the commit achieved overall rather than listing each file
- Focus on intent and context rather than translating code line by line
- If inference is needed, phrase it as "보임" or "추정됨"
- Follow the structure below

## Output format
### One-line summary
(Summarize the work in one sentence)

### Change purpose
(Choose from bug fix / feature / refactor / performance improvement and explain why)

### Key files and points
- \`{file name}\`: (Summarize the key change in this file)
- ...

### Technical rationale, if applicable
(Explain any notable implementation choices or patterns)

## diff
\`\`\`diff
${diff}
\`\`\``;
}

export function buildSummaryQAPrompt(currentSummaryContent: string, diff: string, question: string): string {
  const summaryOnly = currentSummaryContent.split(/\n---\n\s*\n## Q&A/)[0]?.trim() ?? currentSummaryContent.trim();

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
