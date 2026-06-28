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
