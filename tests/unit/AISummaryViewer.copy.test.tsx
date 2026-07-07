import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initI18n } from '../../src/webview/i18n';
import { AISummaryViewer } from '../../src/webview/features/F05b/AISummaryViewer';
import { getMarkdownSliceFromSelection, writeMarkdownSelectionToClipboardData } from '../../src/webview/features/F05b/useMarkdownSourceCopy';

const SUMMARY_CONTENT = `### Summary

This keeps **raw markdown** intact.

- first item
- second item
`;

const CODE_BLOCK_CONTENT = '```ts\nconst value = 12345;\n```';
const TABLE_CONTENT = `| Name | Score |
| --- | --- |
| Alice | 10 |
| Bob | 20 |
`;

function findTextNode(node: Node | null, text: string): Text | null {
  if (!node) {
    return null;
  }

  if (node.nodeType === Node.TEXT_NODE && node.textContent?.includes(text)) {
    return node as Text;
  }

  for (const child of node.childNodes) {
    const match = findTextNode(child, text);

    if (match) {
      return match;
    }
  }

  return null;
}

describe('AISummaryViewer source copy', () => {
  beforeEach(() => {
    initI18n('ko');
    window.getSelection()?.removeAllRanges();
  });

  it('extracts the original markdown slice for a multi-span selection', () => {
    render(
      <AISummaryViewer
        content={SUMMARY_CONTENT}
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

    const paragraph = screen.getByText(/This keeps/).closest('p');
    expect(paragraph).not.toBeNull();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(paragraph as HTMLParagraphElement);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const markdownContainer = document.querySelector<HTMLElement>('.ai-summary-markdown');
    expect(markdownContainer).not.toBeNull();

    expect(getMarkdownSliceFromSelection(markdownContainer as HTMLElement, SUMMARY_CONTENT, selection)).toBe(
      'This keeps **raw markdown** intact.',
    );
  });

  it('falls back when the selection extends outside the markdown container', () => {
    render(
      <div>
        <AISummaryViewer
          content={SUMMARY_CONTENT}
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
        />
        <p data-testid="outside-copy-target">outside</p>
      </div>,
    );

    const markdownContainer = document.querySelector<HTMLElement>('.ai-summary-markdown');
    const heading = screen.getByText('Summary');
    const outside = screen.getByTestId('outside-copy-target');
    const selection = window.getSelection();
    const range = document.createRange();

    range.setStart(heading.firstChild as Node, 0);
    range.setEnd(outside.firstChild as Node, outside.textContent?.length ?? 0);
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(getMarkdownSliceFromSelection(markdownContainer as HTMLElement, SUMMARY_CONTENT, selection)).toBeNull();
  });

  it('includes markdown block syntax when the full heading and paragraph are selected', () => {
    render(
      <AISummaryViewer
        content={SUMMARY_CONTENT}
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

    const heading = screen.getByText('Summary');
    const paragraph = screen.getByText(/This keeps/).closest('p');
    const selection = window.getSelection();
    const range = document.createRange();

    expect(paragraph).not.toBeNull();

    range.setStart(heading.firstChild as Node, 0);
    range.setEnd(paragraph as Node, paragraph?.childNodes.length ?? 0);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const markdownContainer = document.querySelector<HTMLElement>('.ai-summary-markdown');
    expect(markdownContainer).not.toBeNull();

    expect(getMarkdownSliceFromSelection(markdownContainer as HTMLElement, SUMMARY_CONTENT, selection)).toBe(
      '### Summary\n\nThis keeps **raw markdown** intact.',
    );
  });

  it('preserves the first bullet marker when copying an entire list block', () => {
    render(
      <AISummaryViewer
        content={SUMMARY_CONTENT}
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

    const markdownContainer = document.querySelector<HTMLElement>('.ai-summary-markdown');
    const list = document.querySelector('ul');

    expect(markdownContainer).not.toBeNull();
    expect(list).not.toBeNull();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(list as HTMLUListElement);
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(getMarkdownSliceFromSelection(markdownContainer as HTMLElement, SUMMARY_CONTENT, selection)).toBe(
      '- first item\n- second item',
    );
  });

  it('preserves markdown table syntax when copying an entire table block', () => {
    render(
      <AISummaryViewer
        content={TABLE_CONTENT}
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

    const markdownContainer = document.querySelector<HTMLElement>('.ai-summary-markdown');
    const table = document.querySelector('table');

    expect(markdownContainer).not.toBeNull();
    expect(table).not.toBeNull();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(table as HTMLTableElement);
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(getMarkdownSliceFromSelection(markdownContainer as HTMLElement, TABLE_CONTENT, selection)).toBe(
      '| Name | Score |\n| --- | --- |\n| Alice | 10 |\n| Bob | 20 |',
    );
  });

  it('writes markdown slices to both plain text and markdown clipboard formats', () => {
    const values = new Map<string, string>();
    const clipboardData = {
      setData: (type: string, value: string) => {
        values.set(type, value);
      },
    } as DataTransfer;

    writeMarkdownSelectionToClipboardData(clipboardData, '**raw**');

    expect(values.get('text/plain')).toBe('**raw**');
    expect(values.get('text/markdown')).toBe('**raw**');
    expect(values.get('text')).toBe('**raw**');
  });

  it('keeps markdown copy interception after streaming completes with unchanged content', () => {
    const setData = vi.fn();
    const clipboardData = { setData } as unknown as DataTransfer;
    const { rerender } = render(
      <AISummaryViewer
        content={SUMMARY_CONTENT}
        error={null}
        isLoading={false}
        isGenerating
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

    rerender(
      <AISummaryViewer
        content={SUMMARY_CONTENT}
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

    const paragraph = screen.getByText(/This keeps/).closest('p');
    expect(paragraph).not.toBeNull();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(paragraph as HTMLParagraphElement);
    selection?.removeAllRanges();
    selection?.addRange(range);

    const copyEvent = new Event('copy', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(copyEvent, 'clipboardData', {
      value: clipboardData,
    });

    document.dispatchEvent(copyEvent);

    expect(copyEvent.defaultPrevented).toBe(true);
    expect(setData).toHaveBeenCalledWith('text/plain', 'This keeps **raw markdown** intact.');
    expect(setData).toHaveBeenCalledWith('text/markdown', 'This keeps **raw markdown** intact.');
  });

  it('copies fenced code blocks with the copy button and keeps it hidden until hover', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText,
      },
    });

    render(
      <AISummaryViewer
        content={'```ts\nconst value = 1;\n```'}
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

    const codeBlock = document.querySelector<HTMLElement>('.ai-summary-code-block');
    expect(codeBlock).not.toBeNull();

    const copyButton = screen.getByRole('button', { name: '마크다운으로 복사' });
    expect(copyButton.className).toContain('opacity-0');
    expect(copyButton.className).toContain('ai-summary-copy-button');

    fireEvent.click(copyButton);

    expect(writeText).toHaveBeenCalledWith('```ts\nconst value = 1;\n```');
  });

  it('falls back to the whole fenced code block when selecting inside rendered code text', () => {
    render(
      <AISummaryViewer
        content={CODE_BLOCK_CONTENT}
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

    const markdownContainer = document.querySelector<HTMLElement>('.ai-summary-markdown');
    const codeElement = document.querySelector('pre code');
    const textNode = findTextNode(codeElement, 'const value = 12345;');

    expect(markdownContainer).not.toBeNull();
    expect(textNode?.textContent).toContain('12345');

    const selection = window.getSelection();
    const range = document.createRange();
    const textContent = textNode?.textContent ?? '';
    const wordStart = textContent.indexOf('value');
    const wordEnd = wordStart + 'value'.length;

    range.setStart(textNode as Text, wordStart);
    range.setEnd(textNode as Text, wordEnd);
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(getMarkdownSliceFromSelection(markdownContainer as HTMLElement, CODE_BLOCK_CONTENT, selection)).toBe(CODE_BLOCK_CONTENT);
  });

  it('includes fences when the full fenced code block is selected', () => {
    render(
      <AISummaryViewer
        content={CODE_BLOCK_CONTENT}
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

    const markdownContainer = document.querySelector<HTMLElement>('.ai-summary-markdown');
    const preElement = document.querySelector('pre');
    expect(markdownContainer).not.toBeNull();
    expect(preElement).not.toBeNull();

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(preElement as HTMLPreElement);
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(getMarkdownSliceFromSelection(markdownContainer as HTMLElement, CODE_BLOCK_CONTENT, selection)).toBe(CODE_BLOCK_CONTENT);
  });
});
