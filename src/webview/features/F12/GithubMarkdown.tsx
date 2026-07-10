import { useId, type FC } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HighlightedCode } from '../../shared/highlighter';

interface GithubMarkdownProps {
  content: string;
}

export const GithubMarkdown: FC<GithubMarkdownProps> = ({ content }) => {
  const cacheKeyPrefix = useId();
  let codeBlockIndex = 0;

  return (
    <div className="github-markdown text-sm text-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children }) {
            const match = /language-(\w+)/.exec(className ?? '');
            const language = match?.[1];
            const code = String(children).replace(/\n$/, '');

            if (!language) {
              return <code className={className}>{children}</code>;
            }

            const cacheKey = `${cacheKeyPrefix}-code-${codeBlockIndex}`;
            codeBlockIndex += 1;

            return <HighlightedCode cacheKey={cacheKey} className={className} code={code} language={language} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
