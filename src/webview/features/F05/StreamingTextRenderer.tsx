import type { FC } from 'react';

interface StreamingTextRendererProps {
  content: string;
  isStreaming: boolean;
}

export const StreamingTextRenderer: FC<StreamingTextRendererProps> = ({ content, isStreaming }) => {
  if (!content && isStreaming) {
    return (
      <div className="streaming-text-renderer streaming-text-renderer-thinking">
        <div className="streaming-thinking" aria-label="생각중">
          <span className="streaming-thinking-label">생각중</span>
          <span className="streaming-thinking-dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="streaming-text-renderer">
      <pre className="streaming-content">{content}</pre>
      {isStreaming ? <span className="streaming-cursor" aria-hidden="true" /> : null}
    </div>
  );
};
