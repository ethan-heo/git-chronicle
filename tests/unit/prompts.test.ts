import { describe, expect, it } from 'vitest';
import { buildCommitSummaryPrompt, buildFileSummaryPrompt, buildSummaryQAPrompt } from '../../src/extension/prompts';

describe('prompts language handling', () => {
  it('defaults to Korean output when no language is passed', () => {
    const prompt = buildCommitSummaryPrompt('abcdef1234567', 'diff content');

    expect(prompt).toContain('Output language: Korean');
    expect(prompt).toContain('바뀐 점');
    expect(prompt).toContain('### 주의할 점 및 영향 범위');
  });

  it('switches the commit prompt to English labels when language is "en"', () => {
    const prompt = buildCommitSummaryPrompt('abcdef1234567', 'diff content', 'fix: bug', 'en');

    expect(prompt).toContain('Output language: English');
    expect(prompt).toContain('What changed');
    expect(prompt).toContain('Why it matters');
    expect(prompt).toContain('### Cautions and impact scope');
    expect(prompt).not.toContain('바뀐 점');
    expect(prompt).not.toContain('중요한 점');
  });

  it('switches the file prompt to English labels when language is "en"', () => {
    const prompt = buildFileSummaryPrompt('src/App.tsx', 'diff content', undefined, 'en');

    expect(prompt).toContain('Output language: English');
    expect(prompt).toContain('What changed');
    expect(prompt).toContain('### Cautions and impact scope');
  });

  it('keeps instruction text in English regardless of output language', () => {
    const koPrompt = buildFileSummaryPrompt('src/App.tsx', 'diff content', undefined, 'ko');
    const enPrompt = buildFileSummaryPrompt('src/App.tsx', 'diff content', undefined, 'en');

    for (const prompt of [koPrompt, enPrompt]) {
      expect(prompt).toContain('## Conditions');
      expect(prompt).toContain('## Output format');
      expect(prompt).toContain('Write for someone new to this project');
    }
  });

  it('defaults the Q&A prompt to Korean and switches to English on request', () => {
    const koPrompt = buildSummaryQAPrompt('### One-line summary\nSummary', 'diff content', 'What changed?');
    const enPrompt = buildSummaryQAPrompt('### One-line summary\nSummary', 'diff content', 'What changed?', 'en');

    expect(koPrompt).toContain('Output language: Korean');
    expect(enPrompt).toContain('Output language: English');
    expect(enPrompt).toContain('## Existing summary');
    expect(enPrompt).toContain('## Question');
  });
});
