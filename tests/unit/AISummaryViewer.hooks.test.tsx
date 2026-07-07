import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AISummaryViewer } from '../../src/webview/features/F05b/AISummaryViewer';

const baseProps = {
  content: '',
  error: null,
  isLoading: false,
  isGenerating: false,
  isGeneratingQA: false,
  hasSavedSummary: false,
  hasAIProvider: true,
  hasSavePath: true,
  savedPath: null,
  providerLabel: 'Test AI',
  qaCompletionCount: 0,
  onAskQuestion: () => {},
  onGoToSettings: () => {},
  onRegenerate: () => {},
  onRetry: () => {},
} satisfies React.ComponentProps<typeof AISummaryViewer>;

describe('AISummaryViewer hooks', () => {
  it('keeps rendering when moving from loading state to loaded content', () => {
    const { rerender } = render(
      <AISummaryViewer
        {...baseProps}
        isLoading
      />,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();

    rerender(
      <AISummaryViewer
        {...baseProps}
        content="한 줄 요약\n\n정리한 커밋."
      />,
    );

    const region = screen.getByRole('region', { name: 'ai_summary.ai_result' });
    expect(region).toBeInTheDocument();
    expect(region).toHaveTextContent('한 줄 요약');
    expect(region).toHaveTextContent('정리한 커밋.');
  });
});
