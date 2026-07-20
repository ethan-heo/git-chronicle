import type { SummaryLanguage } from './summaryFileService';

interface PromptLanguageStrings {
  outputLanguage: string;
  vagueExample: string;
  oneLineSummaryHeading: string;
  changePurposeHeading: string;
  changePurposeOptions: string;
  keyPointsHeading: string;
  keyFilesAndPointsHeading: string;
  changedLabel: string;
  matterLabel: string;
  cautionsHeading: string;
  technicalRationaleHeading: string;
  inferenceHedge: string;
  otherFilesExample: string;
  fileImportanceExamples: string;
}

function getPromptLanguageStrings(language: SummaryLanguage): PromptLanguageStrings {
  if (language === 'en') {
    return {
      outputLanguage: 'English',
      vagueExample: 'the code was improved',
      oneLineSummaryHeading: 'One-line summary',
      changePurposeHeading: 'Change purpose',
      changePurposeOptions: 'feature addition / bug fix / refactoring / performance improvement / documentation / test coverage / maintenance (build, config, etc.) / style cleanup',
      keyPointsHeading: 'Key points',
      keyFilesAndPointsHeading: 'Key files and points',
      changedLabel: 'What changed',
      matterLabel: 'Why it matters',
      cautionsHeading: 'Cautions and impact scope',
      technicalRationaleHeading: 'Technical rationale, if applicable',
      inferenceHedge: '"appears to be" or "is likely"',
      otherFilesExample: 'N. Other {N} files: (shared characteristic summary)',
      fileImportanceExamples: '"it contains the core logic", "it is the starting point of this change", "it changes a common type referenced by other files"',
    };
  }

  return {
    outputLanguage: 'Korean',
    vagueExample: '코드를 개선했습니다',
    oneLineSummaryHeading: '한 줄 요약',
    changePurposeHeading: '변경 목적',
    changePurposeOptions: '기능 추가 / 버그 수정 / 리팩터링 / 성능 개선 / 문서화 / 테스트 보강 / 유지보수(빌드·설정 등) / 스타일 정리',
    keyPointsHeading: '핵심 포인트',
    keyFilesAndPointsHeading: '핵심 파일과 포인트',
    changedLabel: '바뀐 점',
    matterLabel: '중요한 점',
    cautionsHeading: '주의할 점 및 영향 범위',
    technicalRationaleHeading: '기술적 근거 (해당 시)',
    inferenceHedge: '"보임" 또는 "추정됨"',
    otherFilesExample: 'N. 그 외 {N}개 파일: (공통 성격 요약)',
    fileImportanceExamples: '"핵심 로직이 있어서", "이 변경의 시작점이라서", "다른 파일이 참조하는 공통 타입이 바뀌어서"',
  };
}

export function buildFileSummaryPrompt(
  filePath: string,
  diff: string,
  commitMessage?: string,
  language: SummaryLanguage = 'ko',
): string {
  const s = getPromptLanguageStrings(language);

  return `Here is the diff for a file changed in a Git commit.
Summarize it in Markdown so the developer can review their work later.

File path: ${filePath}
${commitMessage ? `Commit message: ${commitMessage}\n` : ''}
## Conditions
- Output language: ${s.outputLanguage}
- Write for someone new to this project: avoid unexplained jargon, and when a technical term is unavoidable, add a short plain-language gloss in parentheses on first use
- Focus on intent and context rather than translating code line by line
- Use the commit message only as background context for why this file was touched — not as grounds for classifying Change purpose or selecting Key points, which must be judged from this file's own diff. If the commit message's overall intent doesn't match what this file's diff actually shows, call out the mismatch
- Avoid vague statements like "${s.vagueExample}"; cite actual function/variable names or concrete before → after behavior
- Keep any caution/impact-scope analysis strictly scoped to what can be inferred from this file's own diff. Do not claim cross-file impact unless this file itself clearly signals it
- If this file's change involves a non-trivial internal flow, state transition, or call/dependency relationship (e.g. control flow restructuring, a new state machine, a changed call chain), include a small Mermaid diagram (\`\`\`mermaid fenced block) inside whichever section below best explains it (commonly the points list or the implementation-rationale note) — in addition to the prose explanation. Skip diagrams entirely for trivial changes (formatting, renames, single-line fixes, config tweaks, dependency bumps)
- If more than one relationship needs a diagram (e.g. a before/after comparison, or two unrelated flows), use a separate \`\`\`mermaid fenced block for each one instead of combining them into a single diagram with multiple subgraphs — one diagram per concern
- Inside any Mermaid node or edge label, always wrap the label text in double quotes if it contains code syntax or special characters such as parentheses, brackets, quotes, colons, or pipes (e.g. write \`C["Number(query[0]) 변환"]\`, not \`C[Number(query[0]) 변환]\`) — unquoted labels with those characters break Mermaid's parser
- If inference is needed, phrase it with a hedge like ${s.inferenceHedge}
- Follow the structure below

## Output format
### ${s.oneLineSummaryHeading}
(Summarize the change in one sentence)

### ${s.changePurposeHeading}
(One or more of: ${s.changePurposeOptions} — multiple allowed, described in plain language, not developer shorthand like "feat"/"fix". Explain why, citing the diff)

### ${s.keyPointsHeading}
- Select only the points that truly matter for understanding the change; skip trivial details
- Order the numbered list from most to least important, so the first item is what the reader should notice first
- List points as a numbered list. Each numbered item is the function/variable name or line, followed by two nested unordered sub-bullets, exactly in this shape:
  1. \`{function/variable name or line}\`
     - ${s.changedLabel}: (what changed)
     - ${s.matterLabel}: (why this matters: what problem it solves or what behavior it changes)

### ${s.cautionsHeading}
(Optional. Note any cautions, likely callers/exports/tests/configs that may need follow-up, or places that could be affected based only on this file's diff. If nothing notable stands out, omit this section)

### ${s.technicalRationaleHeading}
(Explain any notable implementation choices or patterns)

## diff
\`\`\`diff
${diff}
\`\`\``;
}

export function buildCommitSummaryPrompt(
  commitHash: string,
  diff: string,
  commitMessage?: string,
  language: SummaryLanguage = 'ko',
): string {
  const s = getPromptLanguageStrings(language);

  return `Here is the diff for all files changed in a Git commit.
Summarize the entire commit in Markdown so the developer can review their work later.

Commit hash: ${commitHash.slice(0, 7)}
${commitMessage ? `Commit message: ${commitMessage}\n` : ''}
## Conditions
- Output language: ${s.outputLanguage}
- Write for someone new to this project: avoid unexplained jargon, and when a technical term is unavoidable, add a short plain-language gloss in parentheses on first use
- Focus on what the commit achieved overall rather than listing each file
- Focus on intent and context rather than translating code line by line
- Use the commit message as a hint for intent, but verify it against the actual diff and call out any mismatch
- Avoid vague statements like "${s.vagueExample}"; cite actual function/variable names, file paths, or concrete before → after behavior
- If the diff contains a line like "[diff omitted: reason]", do not invent omitted details. Mention that file under the final "other files" group with the omission reason when relevant
- If the commit introduces a non-trivial flow, call sequence, or structural relationship between files/functions (e.g. a new data flow, an architecture change, a before → after control-flow shift), include a small Mermaid diagram (\`\`\`mermaid fenced block) inside whichever section below best explains it (commonly the per-file breakdown or the implementation-rationale note) — in addition to the prose explanation. Skip diagrams entirely for trivial changes (formatting, renames, single-line fixes, config tweaks, dependency bumps)
- If more than one relationship needs a diagram (e.g. a before/after comparison, or two unrelated flows across different files), use a separate \`\`\`mermaid fenced block for each one instead of combining them into a single diagram with multiple subgraphs — one diagram per concern
- Inside any Mermaid node or edge label, always wrap the label text in double quotes if it contains code syntax or special characters such as parentheses, brackets, quotes, colons, or pipes (e.g. write \`C["Number(query[0]) 변환"]\`, not \`C[Number(query[0]) 변환]\`) — unquoted labels with those characters break Mermaid's parser
- If inference is needed, phrase it with a hedge like ${s.inferenceHedge}
- Follow the structure below

## Output format
### ${s.oneLineSummaryHeading}
(Summarize the work in one sentence)

### ${s.changePurposeHeading}
(One or more of: ${s.changePurposeOptions} — multiple allowed, described in plain language, not developer shorthand like "feat"/"fix". Explain why, citing the diff)

### ${s.keyFilesAndPointsHeading}
- Use the file-size table (--stat summary) at the top of the diff below to judge which files matter most
- Order the numbered list from most to least important, so the file that most drives the commit's purpose comes first
- List files with substantial changes as a numbered list. Each numbered item is the file name, followed by two nested unordered sub-bullets, exactly in this shape:
  1. \`{file name}\`
     - ${s.changedLabel}: (what changed, citing concrete names or paths)
     - ${s.matterLabel}: (why this file matters: its role in the commit's purpose, e.g. ${s.fileImportanceExamples})
- If more than 5 files changed, group minor ones (formatting, lockfiles, generated code, or small unrelated edits) into one final numbered item without sub-bullets, e.g. "${s.otherFilesExample}"
- When omitted diff markers appear, include each omitted file name and omission reason (lockfile / build-artifact / generated / oversized) in that final grouped item instead of guessing the hidden contents
- If 5 or fewer files changed, list all of them individually without grouping

### ${s.cautionsHeading}
(Optional. Note any breaking-change risk, affected modules/callers/configs, migration or follow-up work, or suspicious mixed concerns that deserve extra review. If nothing notable stands out, omit this section)

### ${s.technicalRationaleHeading}
(Explain any notable implementation choices or patterns, referencing specific code)

## diff
\`\`\`diff
${diff}
\`\`\``;
}

export function buildSummaryQAPrompt(
  currentSummaryContent: string,
  diff: string,
  question: string,
  language: SummaryLanguage = 'ko',
): string {
  const summaryOnly =
    currentSummaryContent.split(/\n---\n\s*\n(?:(?:## Q&A\s*\n\s*\n)?### Q\.)/)[0]?.trim() ??
    currentSummaryContent.trim();
  const s = getPromptLanguageStrings(language);

  return `Here is the diff for a Git change and an AI-generated summary of it.
Answer the user's question.

## Conditions
- Output language: ${s.outputLanguage}
- Answer based on the diff and the existing summary
- If inference is needed, phrase it with a hedge like ${s.inferenceHedge}

## Existing summary
${summaryOnly}

## diff
\`\`\`diff
${diff}
\`\`\`

## Question
${question}`;
}
