import { isValidElement, useId, useMemo, type FC, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { HighlightedCode } from '../../shared/highlighter';
import { MermaidBlock } from '../F11/MermaidBlock';
import './GithubMarkdown.css';

interface GithubMarkdownProps {
  content: string;
}

export const GithubMarkdown: FC<GithubMarkdownProps> = ({ content }) => {
  const cacheKeyPrefix = useId();
  const markdownComponents = useMemo(() => {
    let mermaidBlockIndex = 0;
    let highlightedCodeBlockIndex = 0;

    return {
      pre({ children }: { children?: ReactNode }) {
        if (containsMermaidBlock(children)) {
          return <>{children}</>;
        }

        return <pre>{children}</pre>;
      },
      code({ className, children }: { className?: string; children?: ReactNode }) {
        const match = /language-(\w+)/.exec(className ?? '');
        const language = match?.[1];
        const code = String(children).replace(/\n$/, '');

        if (language === 'mermaid') {
          const cacheKey = `${cacheKeyPrefix}-mermaid-${mermaidBlockIndex}`;
          mermaidBlockIndex += 1;
          return <MermaidBlock cacheKey={cacheKey} code={code} />;
        }

        if (!language) {
          return <code className={className}>{children}</code>;
        }

        const cacheKey = `${cacheKeyPrefix}-code-${highlightedCodeBlockIndex}`;
        highlightedCodeBlockIndex += 1;

        return <HighlightedCode cacheKey={cacheKey} className={className} code={code} language={language} />;
      },
    };
  }, [cacheKeyPrefix]);

  return (
    <div className="github-markdown text-sm text-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, defaultSchema]]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

function containsMermaidBlock(children: ReactNode): boolean {
  if (Array.isArray(children)) {
    return children.some((child) => containsMermaidBlock(child));
  }

  if (!isValidElement(children)) {
    return false;
  }

  if (children.type === MermaidBlock) {
    return true;
  }

  return containsMermaidBlock((children.props as { children?: ReactNode }).children);
}
