import { afterEach, describe, expect, it, vi } from 'vitest';

describe('aiSlice', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, 'acquireVsCodeApi');
  });

  it('keeps the summary view cache in sync when Q&A completes', async () => {
    const { useAppStore } = await import('../../src/webview/store/appStore');
    const targetKey = 'abc123::__commit__';
    const appendedContent = '\n\n---\n\n### Q. Why?\n\nBecause.\n';

    useAppStore.getState().completeAISummary({
      content: '# Summary',
      savedPath: '.git-author/abc123.ai.md',
      noteRelativePath: 'abc123.ai.md',
      provider: 'claude',
      commitHash: 'abc123',
      targetKey,
    });

    useAppStore.getState().startAIQA();
    useAppStore.getState().completeAIQA({ appendedContent });

    const state = useAppStore.getState();

    expect(state.currentSummaryContent).toBe(`# Summary${appendedContent}`);
    expect(state.summaryViewCache[targetKey]).toMatchObject({
      content: `# Summary${appendedContent}`,
      savedPath: '.git-author/abc123.ai.md',
      noteRelativePath: 'abc123.ai.md',
      provider: 'claude',
      hasSavedSummary: true,
    });
    expect(state.isGeneratingQA).toBe(false);
    expect(state.qaError).toBeNull();
  });
});
