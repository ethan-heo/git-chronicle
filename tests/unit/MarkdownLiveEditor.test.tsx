import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { EditorView } from '@codemirror/view';
import { MarkdownLiveEditor } from '../../src/webview/features/F11';
import { initI18n } from '../../src/webview/i18n';

vi.mock('../../src/webview/features/F11/MermaidBlock', () => {
  const renderedDiagramCache = new Map<string, string>();

  return {
    renderedDiagramCache,
    prewarmMermaidDiagram: vi.fn(async (cacheKey: string, code: string) => {
      renderedDiagramCache.set(cacheKey, `<div data-testid="mock-mermaid-svg">${code}</div>`);
    }),
    MermaidBlock: ({ code }: { code: string }) => <div data-testid="mock-mermaid-widget">{code}</div>,
  };
});

vi.mock('../../src/webview/shared/highlighter/shikiHighlighter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/webview/shared/highlighter/shikiHighlighter')>();

  return {
    ...actual,
    getMarkdownHighlighter: vi.fn(async () => ({
      codeToTokens: async (code: string, options: { lang: string }) => {
        if (options.lang === 'diff') {
          return {
            tokens: code.split('\n').map((line) => [
              {
                content: line,
                color: line.startsWith('+') ? '#00ff00' : line.startsWith('-') ? '#ff0000' : '#ffffff',
              },
            ]),
          };
        }

        return {
          tokens: code.split('\n').map((line) => [{ content: line, color: '#ffffff' }]),
        };
      },
    })),
  };
});

describe('MarkdownLiveEditor', () => {
  it('hides heading syntax when the cursor is on another line', async () => {
    initI18n('ko');

    render(
      <MarkdownLiveEditor
        value={'# Title\nbody'}
        onChange={() => {}}
        placeholder="마크다운으로 메모를 남겨보세요."
      />,
    );

    const view = getEditorView();
    act(() => {
      view.dispatch({
        selection: { anchor: view.state.doc.length },
      });
    });

    await waitFor(() => {
      const heading = document.querySelector<HTMLElement>('.cm-md-heading-1');
      expect(heading).not.toBeNull();
      expect(heading).not.toHaveTextContent('#');
    });
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('opens rendered links only on Cmd/Ctrl click outside the active line', async () => {
    initI18n('ko');
    const onOpenUrl = vi.fn();

    render(
      <MarkdownLiveEditor
        value={'[OpenAI](https://openai.com)\nbody'}
        onChange={() => {}}
        onOpenUrl={onOpenUrl}
        placeholder="마크다운으로 메모를 남겨보세요."
      />,
    );

    const view = getEditorView();
    act(() => {
      view.dispatch({
        selection: { anchor: view.state.doc.length },
      });
    });

    const link = await waitFor(() => {
      const element = document.querySelector<HTMLElement>('[data-markdown-link="https://openai.com"]');
      expect(element).not.toBeNull();
      return element as HTMLElement;
    });

    fireEvent.mouseDown(link, { metaKey: true });

    expect(onOpenUrl).toHaveBeenCalledWith('https://openai.com');
  });

  it('renders mermaid blocks as a widget when the cursor leaves the block', async () => {
    initI18n('ko');

    render(
      <MarkdownLiveEditor
        value={'```mermaid\nflowchart TD\n  A --> B\n```\nAfter'}
        onChange={() => {}}
        placeholder="마크다운으로 메모를 남겨보세요."
      />,
    );

    const view = getEditorView();
    act(() => {
      view.dispatch({
        selection: { anchor: view.state.doc.length },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('mock-mermaid-svg')).toHaveTextContent('flowchart TD');
    });
    expect(screen.getByTestId('mock-mermaid-svg')).toHaveTextContent('A --> B');
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('applies Shiki highlighting to diff fenced code blocks', async () => {
    initI18n('ko');

    render(
      <MarkdownLiveEditor
        value={'```diff\n- old line\n+ new line\n```\nAfter'}
        onChange={() => {}}
        placeholder="마크다운으로 메모를 남겨보세요."
      />,
    );

    const view = getEditorView();
    act(() => {
      view.dispatch({
        selection: { anchor: view.state.doc.length },
      });
    });

    await waitFor(() => {
      const removed = screen.getByText('- old line');
      const added = screen.getByText('+ new line');
      expect(removed.getAttribute('style')).toContain('rgb(255, 0, 0)');
      expect(added.getAttribute('style')).toContain('rgb(0, 255, 0)');
    });
  });
});

function getEditorView(): EditorView {
  const host = screen.getByTestId('markdown-live-editor-host') as HTMLDivElement & { __cmView?: EditorView };
  if (!host.__cmView) {
    throw new Error('EditorView is not attached to the host.');
  }

  return host.__cmView;
}
