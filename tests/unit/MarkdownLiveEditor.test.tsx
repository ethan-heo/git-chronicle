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

  it('renders GFM tables as a widget with alignment when the cursor leaves the block', async () => {
    initI18n('ko');

    render(
      <MarkdownLiveEditor
        value={'| Name | Score | Role |\n|:---|---:|:---:|\n| Alpha | `10` | [Dev](https://openai.com) |\nAfter'}
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
      expect(document.querySelector('.cm-md-table')).not.toBeNull();
    });

    const headers = Array.from(document.querySelectorAll<HTMLTableCellElement>('.cm-md-table th'));
    expect(headers).toHaveLength(3);
    expect(headers[0]?.style.textAlign).toBe('left');
    expect(headers[1]?.style.textAlign).toBe('right');
    expect(headers[2]?.style.textAlign).toBe('center');

    const codeCell = screen.getByText('10');
    expect(codeCell.className).toContain('cm-md-inline-code');

    const linkCell = document.querySelector<HTMLElement>('[data-markdown-link="https://openai.com"]');
    expect(linkCell).not.toBeNull();
    expect(linkCell).toHaveTextContent('Dev');
    expect(screen.getByText('After')).toBeInTheDocument();
  });

  it('enters a folded table from below at the last row, not the header', async () => {
    initI18n('ko');

    render(
      <MarkdownLiveEditor
        value={'Before\n| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |\n| 5 | 6 |\nAfter'}
        onChange={() => {}}
        placeholder="마크다운으로 메모를 남겨보세요."
      />,
    );

    const view = getEditorView();
    const lastRowLine = view.state.doc.line(6);
    const afterLine = view.state.doc.line(7);

    act(() => {
      view.dispatch({ selection: { anchor: afterLine.from } });
      view.focus();
    });

    await waitFor(() => {
      expect(document.querySelector('.cm-md-table')).not.toBeNull();
    });

    fireEvent.keyDown(view.contentDOM, { key: 'ArrowUp', code: 'ArrowUp' });

    const pos = view.state.selection.main.head;
    const line = view.state.doc.lineAt(pos);
    expect(line.number).toBe(lastRowLine.number);
  });

  it('moves the cursor to the adjacent row instead of jumping to the header when already inside an unfolded table', async () => {
    initI18n('ko');

    render(
      <MarkdownLiveEditor
        value={'Before\n| A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |\n| 5 | 6 |\nAfter'}
        onChange={() => {}}
        placeholder="마크다운으로 메모를 남겨보세요."
      />,
    );

    const view = getEditorView();
    const headerLine = view.state.doc.line(2);
    const lastRowLine = view.state.doc.line(6);

    act(() => {
      view.dispatch({ selection: { anchor: lastRowLine.from } });
    });

    await waitFor(() => {
      expect(document.querySelector('.cm-md-table')).toBeNull();
    });

    const dispatchSpy = vi.spyOn(view, 'dispatch');
    fireEvent.keyDown(view.contentDOM, { key: 'ArrowUp', code: 'ArrowUp' });

    const jumpedStraightToHeader = dispatchSpy.mock.calls.some((call) => {
      const spec = call[0] as { selection?: { anchor?: number } };
      return spec?.selection?.anchor === headerLine.from;
    });
    expect(jumpedStraightToHeader).toBe(false);
  });

  it('walks every line in order with ArrowUp when a table sits earlier in the document', async () => {
    initI18n('ko');

    const value = [
      '### 84d3f0ddd fix: 예약금액 설정 시 number 변환이 아닌 parseInt 변환으로 수정한다',
      '>',
      '> 예약금이 항상 정수로 표현되도록 처리',
      '',
      '**Number vs parseInt**',
      '- 소수점 처리',
      '  | 입력값 | `Number()` | `parseInt()` |',
      '  |--------|-----------|-------------|',
      '  | `"123.45"` | `123.45` | `123` |',
      '  | `"123"` | `123` | `123` |',
      '  | `"123.99"` | `123.99` | `123` |',
      '',
      '- 부분 문자열 처리',
      '  - Number("123abc") -> NaN',
      '  - parseInt("123abc") -> 123',
      '- 기수(radix) 파라미터 사용 유무',
      '  - parseInt("123", 기수)',
      '',
      '',
      '### 접근 권한을 Server Side, Clident Side 에서 막는 것이 어떤 차이가 있을까?',
    ].join('\n');

    render(<MarkdownLiveEditor value={value} onChange={() => {}} placeholder="마크다운으로 메모를 남겨보세요." />);

    const view = getEditorView();
    const totalLines = view.state.doc.lines;

    act(() => {
      view.dispatch({ selection: { anchor: view.state.doc.length } });
      view.focus();
    });

    await waitFor(() => {
      expect(document.querySelector('.cm-md-table')).not.toBeNull();
    });

    const visitedLines = [totalLines];
    for (let step = 0; step < totalLines - 1; step += 1) {
      fireEvent.keyDown(view.contentDOM, { key: 'ArrowUp', code: 'ArrowUp' });
      const pos = view.state.selection.main.head;
      visitedLines.push(view.state.doc.lineAt(pos).number);
    }

    expect(visitedLines).toEqual(
      Array.from({ length: totalLines }, (_, index) => totalLines - index),
    );
  });

  it('keeps malformed tables as raw markdown text', async () => {
    initI18n('ko');

    render(
      <MarkdownLiveEditor
        value={'| Name | Score |\n|---|\n| Alpha | 10 |'}
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
      expect(screen.getByText('|---|')).toBeInTheDocument();
    });
    expect(document.querySelector('.cm-md-table')).toBeNull();
  });
});

function getEditorView(): EditorView {
  const host = screen.getByTestId('markdown-live-editor-host') as HTMLDivElement & { __cmView?: EditorView };
  if (!host.__cmView) {
    throw new Error('EditorView is not attached to the host.');
  }

  return host.__cmView;
}
