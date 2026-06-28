import type { FC } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  if (!hasAIProvider) {
    return <EmptyState message={t('ai_summary.no_ai')} ctaLabel={t('ai_summary.go_to_settings')} onCtaClick={onGoToSettings} />;
  }

  if (!hasSavePath) {
    return <EmptyState message={t('ai_summary.no_save_path')} ctaLabel={t('ai_summary.go_to_settings')} onCtaClick={onGoToSettings} />;
  }

  if (isLoading) {
    return <LoadingState label={t('ai_summary.loading')} size="sm" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  const showRegenerate = hasSavedSummary && (Boolean(content) || isGenerating);
  const showSavedPath = hasSavedSummary && Boolean(savedPath);

  return (
    <section className="ai-summary-viewer" role="region" aria-label={t('ai_summary.ai_result')} aria-live={isGenerating ? 'polite' : undefined}>
      <div className="ai-summary-action-bar">
        <div className="ai-summary-source-group">
          <span className="ai-summary-source-tag">{formatSourceTag(t, hasSavedSummary, isGenerating, providerLabel, savedPath)}</span>
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
          <EmptyState message={summaryMode === 'commit' ? t('ai_summary.empty_commit') : t('ai_summary.empty')} />
        )}
      </div>
    </section>
  );
};

function formatSourceTag(
  t: (key: string, vars?: Record<string, string | number>) => string,
  hasSavedSummary: boolean,
  isGenerating: boolean,
  providerLabel: string | null,
  savedPath: string | null,
): string {
  const provider = providerLabel ?? 'AI';

  if (isGenerating) {
    return t('ai_summary.source_generating', { provider });
  }

  if (hasSavedSummary && savedPath) {
    return t('ai_summary.source_saved_loaded', { provider });
  }

  if (hasSavedSummary) {
    return t('ai_summary.source_saved', { provider });
  }

  return t('ai_summary.source_ready', { provider });
}
