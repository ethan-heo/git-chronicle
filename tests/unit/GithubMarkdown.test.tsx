import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { initI18n } from '../../src/webview/i18n';
import { GithubMarkdown } from '../../src/webview/features/F12/GithubMarkdown';

const highlightedCodeSpy = vi.fn();
const mermaidBlockSpy = vi.fn();

vi.mock('../../src/webview/shared/highlighter', () => ({
  HighlightedCode: ({ cacheKey, className, code, language }: { cacheKey: string; className?: string; code: string; language?: string }) => {
    highlightedCodeSpy({ cacheKey, className, code, language });
    return (
      <pre data-testid="mock-highlighted-code" data-cache-key={cacheKey} data-language={language}>
        {code}
      </pre>
    );
  },
}));

vi.mock('../../src/webview/features/F11/MermaidBlock', () => ({
  MermaidBlock: ({ cacheKey, code }: { cacheKey: string; code: string }) => {
    mermaidBlockSpy({ cacheKey, code });
    return <div data-testid="mock-mermaid-block">{code}</div>;
  },
}));

describe('GithubMarkdown', () => {
  it('renders mermaid fences through MermaidBlock', () => {
    initI18n('ko');
    mermaidBlockSpy.mockReset();

    render(<GithubMarkdown content={'```mermaid\nflowchart TD\n  A --> B\n```'} />);

    expect(screen.getByTestId('mock-mermaid-block')).toHaveTextContent('flowchart TD A --> B');
    expect(mermaidBlockSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'flowchart TD\n  A --> B',
      }),
    );
  });

  it('renders GFM headings and lists', () => {
    render(<GithubMarkdown content={'### Heading\n\n- first\n- second'} />);

    expect(screen.getByRole('heading', { level: 3, name: 'Heading' })).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });

  it('renders raw html images and sanitizes script content', () => {
    render(<GithubMarkdown content={'<img src="https://example.com/image.png" alt="example" /><script>alert(1)</script>'} />);

    const image = screen.getByRole('img', { name: 'example' });
    expect(image).toHaveAttribute('src', 'https://example.com/image.png');
    expect(document.querySelector('script')).toBeNull();
    expect(screen.queryByText('alert(1)')).not.toBeInTheDocument();
  });

  it('renders raw html blocks like details and summary', () => {
    render(<GithubMarkdown content={'<details><summary>More</summary><p>Hidden body</p></details>'} />);

    expect(screen.getByText('More')).toBeInTheDocument();
    expect(screen.getByText('Hidden body')).toBeInTheDocument();
  });

  it('routes fenced code blocks through HighlightedCode', () => {
    highlightedCodeSpy.mockReset();

    render(<GithubMarkdown content={'```ts\nconst value = 1;\n```'} />);

    expect(screen.getByTestId('mock-highlighted-code')).toHaveTextContent('const value = 1;');
    expect(highlightedCodeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'language-ts',
        code: 'const value = 1;',
        language: 'ts',
      }),
    );
  });
});
