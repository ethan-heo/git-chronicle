import type { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import { EmptyState, ErrorState, LoadingState } from '../../shared/components';
import type { SummaryMode } from '../../types/commit';
import { RegenerateButton } from './RegenerateButton';
import { StreamingTextRenderer } from './StreamingTextRenderer';

interface AISummaryViewerProps {
  content: string;
  error: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  hasSavedSummary: boolean;
  hasAIProvider: boolean;
  hasSavePath: boolean;
  savedPath: string | null;
  providerLabel: string | null;
  summaryMode: SummaryMode;
  onGoToSettings: () => void;
  onRegenerate: () => void;
  onRetry: () => void;
}

export const AISummaryViewer: FC<AISummaryViewerProps> = ({
  content,
  error,
  isLoading,
  isGenerating,
  hasSavedSummary,
  hasAIProvider,
  hasSavePath,
  savedPath,
  providerLabel,
  summaryMode,
  onGoToSettings,
  onRegenerate,
  onRetry,
}) => {
  if (!hasAIProvider) {
    return <EmptyState message="AI가 설정되지 않았습니다" ctaLabel="설정으로 이동" onCtaClick={onGoToSettings} />;
  }

  if (!hasSavePath) {
    return <EmptyState message="저장 경로를 먼저 설정해주세요" ctaLabel="설정으로 이동" onCtaClick={onGoToSettings} />;
  }

  if (isLoading) {
    return <LoadingState label="AI 정리를 불러오는 중..." size="sm" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  const showRegenerate = hasSavedSummary && (Boolean(content) || isGenerating);
  const showSavedPath = hasSavedSummary && Boolean(savedPath);

  return (
    <section className="ai-summary-viewer" role="region" aria-label="AI 정리 결과" aria-live={isGenerating ? 'polite' : undefined}>
      <div className="ai-summary-action-bar">
        <div className="ai-summary-source-group">
          <span className="ai-summary-source-tag">{formatSourceTag(hasSavedSummary, isGenerating, providerLabel, savedPath)}</span>
          {showSavedPath ? (
            <span className="ai-summary-saved-path" title={savedPath ?? undefined}>
              {savedPath}
            </span>
          ) : null}
        </div>
        {showRegenerate ? <RegenerateButton disabled={isGenerating} onClick={onRegenerate} /> : null}
      </div>

      <div className="ai-summary-content">
        {isGenerating ? (
          <StreamingTextRenderer content={content} isStreaming />
        ) : content ? (
          <ReactMarkdown
            components={{
              h3: ({ children }) => (
                <h3>
                  <span aria-hidden="true" />
                  {children}
                </h3>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        ) : (
          <EmptyState message={summaryMode === 'commit' ? '커밋 AI 정리가 없습니다' : 'AI 정리가 없습니다'} />
        )}
      </div>
    </section>
  );
};

function formatSourceTag(hasSavedSummary: boolean, isGenerating: boolean, providerLabel: string | null, savedPath: string | null): string {
  const provider = providerLabel ?? 'AI';

  if (isGenerating) {
    return `${provider} 응답 생성 중`;
  }

  if (hasSavedSummary && savedPath) {
    return `저장본을 불러왔습니다 · ${provider}`;
  }

  if (hasSavedSummary) {
    return `저장 완료 · ${provider}`;
  }

  return `${provider} 준비됨`;
}
