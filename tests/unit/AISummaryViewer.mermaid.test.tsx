import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initI18n } from '../../src/webview/i18n';
import { AISummaryViewer } from '../../src/webview/features/F05b/AISummaryViewer';
import { getMarkdownSliceFromSelection } from '../../src/webview/features/F05b/useMarkdownSourceCopy';
import mermaid from 'mermaid';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn(async (id: string, code: string) => ({
      svg: `<svg data-testid="mermaid-svg" data-id="${id}"><text>${code}</text></svg>`,
    })),
  },
}));

const MERMAID_CONTENT = `### Diagram

\`\`\`mermaid
flowchart TD
  A --> B
\`\`\`
`;

describe('AISummaryViewer mermaid preview', () => {
  beforeEach(() => {
    initI18n('ko');
    window.getSelection()?.removeAllRanges();
    vi.restoreAllMocks();
  });

  it('renders mermaid code fences as diagrams', async () => {
    render(
      <AISummaryViewer
        content={MERMAID_CONTENT}
        error={null}
        isLoading={false}
        isGenerating={false}
        isGeneratingQA={false}
        hasSavedSummary={false}
        hasAIProvider
        hasSavePath
        savedPath={null}
        providerLabel="Codex"
        qaCompletionCount={0}
        onAskQuestion={() => {}}
        onGoToSettings={() => {}}
        onRegenerate={() => {}}
        onRetry={() => {}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mermaid-svg')).toBeInTheDocument();
    });

    expect(mermaid.render).toHaveBeenCalledWith(expect.any(String), 'flowchart TD\n  A --> B');
  });

  it('copies the raw mermaid markdown block from the preview copy button', async () => {
    const writeText = vi.fn(async () => {});
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(
      <AISummaryViewer
        content={MERMAID_CONTENT}
        error={null}
        isLoading={false}
        isGenerating={false}
        isGeneratingQA={false}
        hasSavedSummary={false}
        hasAIProvider
        hasSavePath
        savedPath={null}
        providerLabel="Codex"
        qaCompletionCount={0}
        onAskQuestion={() => {}}
        onGoToSettings={() => {}}
        onRegenerate={() => {}}
        onRetry={() => {}}
      />,
    );

    const button = await screen.findByRole('button', { name: '마크다운으로 복사' });
    fireEvent.click(button);

    expect(writeText).toHaveBeenCalledWith('```mermaid\nflowchart TD\n  A --> B\n```');
  });

  it('falls back to whole raw mermaid block when copying from the preview selection', async () => {
    render(
      <AISummaryViewer
        content={MERMAID_CONTENT}
        error={null}
        isLoading={false}
        isGenerating={false}
        isGeneratingQA={false}
        hasSavedSummary={false}
        hasAIProvider
        hasSavePath
        savedPath={null}
        providerLabel="Codex"
        qaCompletionCount={0}
        onAskQuestion={() => {}}
        onGoToSettings={() => {}}
        onRegenerate={() => {}}
        onRetry={() => {}}
      />,
    );

    await screen.findByTestId('mermaid-svg');
    const mermaidBlock = document.querySelector<HTMLElement>('.ai-summary-mermaid-block');
    expect(mermaidBlock).not.toBeNull();

    const textNode = document.querySelector('[data-testid="mermaid-svg"] text')?.firstChild;
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
});
