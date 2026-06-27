import type { FC } from 'react';

interface StreamingTextRendererProps {
  content: string;
  isStreaming: boolean;
}

export const StreamingTextRenderer: FC<StreamingTextRendererProps> = ({ content, isStreaming }) => {
  return (
    <div className="streaming-text-renderer">
      <pre className="streaming-content">{content || 'AI 정리를 생성하는 중입니다...'}</pre>
      {isStreaming ? <span className="streaming-cursor" aria-hidden="true" /> : null}
    </div>
  );
};
