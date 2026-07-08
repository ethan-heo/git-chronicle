import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initI18n } from '../../src/webview/i18n';
import { AISummaryViewer } from '../../src/webview/features/F05b/AISummaryViewer';
import { getMarkdownSliceFromSelection } from '../../src/webview/features/F05b/useMarkdownSourceCopy';

const mermaidBlockPropsSpy = vi.fn();

vi.mock('../../src/webview/features/F11/MermaidBlock', () => ({
  MermaidBlock: ({ cacheKey, code }: { cacheKey: string; code: string }) => {
    mermaidBlockPropsSpy({ cacheKey, code });
    return <div data-testid="mock-mermaid-block">{code}</div>;
  },
}));

const MERMAID_CONTENT = `### Diagram

\`\`\`mermaid
flowchart TD
  A --> B
\`\`\`
`;

const baseProps = {
  content: MERMAID_CONTENT,
  error: null,
  isLoading: false,
  isGenerating: false,
  isGeneratingQA: false,
  hasSavedSummary: false,
  hasAIProvider: true,
  hasSavePath: true,
  savedPath: null,
  providerLabel: 'Codex',
  qaCompletionCount: 0,
  onAskQuestion: () => {},
  onGoToSettings: () => {},
  onRegenerate: () => {},
  onRetry: () => {},
} satisfies React.ComponentProps<typeof AISummaryViewer>;

describe('AISummaryViewer mermaid preview', () => {
  beforeEach(() => {
    initI18n('ko');
    window.getSelection()?.removeAllRanges();
    vi.restoreAllMocks();
    mermaidBlockPropsSpy.mockReset();
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('renders mermaid code fences as diagrams', async () => {
    render(<AISummaryViewer {...baseProps} />);

    expect(await screen.findByTestId('mock-mermaid-block')).toHaveTextContent('flowchart TD A --> B');
  });

  it('copies the raw mermaid markdown block from the preview copy button', async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(
      <AISummaryViewer {...baseProps} />,
    );

    const button = await screen.findByRole('button', { name: '마크다운으로 복사' });
    fireEvent.click(button);

    expect(writeText).toHaveBeenCalledWith('```mermaid\nflowchart TD\n  A --> B\n```');
    await waitFor(() => {
      expect(screen.getByTestId('mock-mermaid-block')).toBeInTheDocument();
    });
  });

  it('falls back to whole raw mermaid block when copying from the preview selection', async () => {
    render(
      <AISummaryViewer {...baseProps} />,
    );

    await screen.findByTestId('mock-mermaid-block');
    const mermaidBlock = document.querySelector<HTMLElement>('.ai-summary-mermaid-block');
    expect(mermaidBlock).not.toBeNull();

    const textNode = document.querySelector('[data-testid="mock-mermaid-block"]')?.firstChild;
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(textNode as Node, 0);
    range.setEnd(textNode as Node, 'flowchart TD'.length);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const markdownContainer = document.querySelector<HTMLElement>('.ai-summary-markdown');
    expect(markdownContainer).not.toBeNull();

    expect(getMarkdownSliceFromSelection(markdownContainer as HTMLElement, MERMAID_CONTENT, selection)).toBe(
      '```mermaid\nflowchart TD\n  A --> B\n```',
    );
  });

  it('keeps the same Mermaid cache key when rerendered with unchanged content', () => {
    const { rerender } = render(<AISummaryViewer {...baseProps} qaCompletionCount={0} />);

    const firstCall = mermaidBlockPropsSpy.mock.calls.at(-1)?.[0] as { cacheKey: string } | undefined;
    expect(firstCall?.cacheKey).toBe('ai-summary-mermaid-offset-13');

    rerender(<AISummaryViewer {...baseProps} qaCompletionCount={1} />);

    const secondCall = mermaidBlockPropsSpy.mock.calls.at(-1)?.[0] as { cacheKey: string } | undefined;
    expect(secondCall?.cacheKey).toBe('ai-summary-mermaid-offset-13');
  });
});
