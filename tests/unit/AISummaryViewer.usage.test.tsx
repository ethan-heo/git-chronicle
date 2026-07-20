import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AISummaryViewer } from '../../src/webview/features/F05b/AISummaryViewer';

const baseProps = {
  content: '### 한 줄 요약\n\n정리한 커밋.',
  usage: null,
  error: null,
  isLoading: false,
  isGenerating: false,
  isGeneratingQA: false,
  hasSavedSummary: true,
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

describe('AISummaryViewer usage badge', () => {
  it('shows usage before the action buttons when generation is complete', () => {
    render(
      <AISummaryViewer
        {...baseProps}
        usage={{ inputTokens: 1234, outputTokens: 567, costUsd: 0.0123 }}
      />,
    );

    expect(screen.getByText('ai_summary.usage_in · ai_summary.usage_out · ai_summary.usage_cost')).toBeInTheDocument();
  });

  it('hides usage while generation is still in progress', () => {
    render(
      <AISummaryViewer
        {...baseProps}
        isGenerating
        usage={{ inputTokens: 1234, outputTokens: 567, costUsd: null }}
      />,
    );

    expect(screen.queryByLabelText('ai_summary.usage_badge_aria')).not.toBeInTheDocument();
  });
});
