import { useState, type FC, type KeyboardEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState } from '../../shared/components';
import type { SummaryMode } from '../../types/commit';
import { RegenerateButton } from './RegenerateButton';
import { StreamingTextRenderer } from './StreamingTextRenderer';

interface AISummaryViewerProps {
  content: string;
  error: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  isGeneratingQA: boolean;
  hasSavedSummary: boolean;
  hasAIProvider: boolean;
  hasSavePath: boolean;
  savedPath: string | null;
  providerLabel: string | null;
  qaError: string | null;
  qaStreamingResponse: string;
  summaryMode: SummaryMode;
  onAskQuestion: (question: string) => void;
  onGoToSettings: () => void;
  onRegenerate: () => void;
  onRetry: () => void;
}

export const AISummaryViewer: FC<AISummaryViewerProps> = ({
  content,
  error,
  isLoading,
  isGenerating,
  isGeneratingQA,
  hasSavedSummary,
  hasAIProvider,
  hasSavePath,
  savedPath,
  providerLabel,
  qaError,
  qaStreamingResponse,
  summaryMode,
  onAskQuestion,
  onGoToSettings,
  onRegenerate,
  onRetry,
}) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  if (!hasAIProvider) {
    return <EmptyState message={t('ai_summary.no_ai')} ctaLabel={t('ai_summary.go_to_settings')} onCtaClick={onGoToSettings} />;
  }

  if (!hasSavePath) {
    return <EmptyState message={t('ai_summary.no_save_path')} ctaLabel={t('ai_summary.go_to_settings')} onCtaClick={onGoToSettings} />;
  }

  if (isLoading) {
    return (
      <section className="ai-summary-loading-state" role="status" aria-live="polite" aria-busy="true" aria-label={t('ai_summary.loading')}>
        <div className="ai-summary-loading-hero">
          <span className="ai-summary-loading-orb" aria-hidden="true" />
          <div className="ai-summary-loading-copy">
            <strong>{t('ai_summary.loading_title')}</strong>
            <p>{t('ai_summary.loading')}</p>
          </div>
        </div>
        <div className="ai-summary-loading-preview" aria-hidden="true">
          <span className="ai-summary-loading-pill ai-summary-loading-shimmer" />
          <span className="ai-summary-loading-line ai-summary-loading-line-lg ai-summary-loading-shimmer" />
          <span className="ai-summary-loading-line ai-summary-loading-shimmer" />
          <span className="ai-summary-loading-line ai-summary-loading-line-sm ai-summary-loading-shimmer" />
          <div className="ai-summary-loading-section">
            <span className="ai-summary-loading-line ai-summary-loading-line-md ai-summary-loading-shimmer" />
            <span className="ai-summary-loading-line ai-summary-loading-shimmer" />
            <span className="ai-summary-loading-line ai-summary-loading-line-lg ai-summary-loading-shimmer" />
          </div>
          <div className="ai-summary-loading-section">
            <span className="ai-summary-loading-line ai-summary-loading-line-sm ai-summary-loading-shimmer" />
            <span className="ai-summary-loading-line ai-summary-loading-line-md ai-summary-loading-shimmer" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  const showRegenerate = hasSavedSummary && (Boolean(content) || isGenerating);
  const showSavedPath = hasSavedSummary && Boolean(savedPath);
  const canAskQuestion = !isGenerating && Boolean(content);

  const submitQuestion = (): void => {
    const trimmed = question.trim();
    if (!trimmed || isGeneratingQA) {
      return;
    }

    onAskQuestion(trimmed);
    setQuestion('');
  };

  const handleQuestionKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitQuestion();
    }
  };

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
      {canAskQuestion ? (
        <div className="ai-summary-qa-panel">
          <textarea
            id="ai-summary-question"
            className="ai-summary-qa-textarea"
            placeholder={t('ai_summary.qa_placeholder')}
            value={question}
            disabled={isGeneratingQA}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleQuestionKeyDown}
          />
          {qaStreamingResponse ? (
            <div className="ai-summary-qa-stream" aria-live="polite">
              <p>{qaStreamingResponse}</p>
            </div>
          ) : null}
          {qaError ? <p className="ai-summary-qa-error">{qaError}</p> : null}
          <div className="ai-summary-qa-actions">
            <button type="button" className="ai-summary-qa-button" disabled={isGeneratingQA || !question.trim()} onClick={submitQuestion}>
              {isGeneratingQA ? t('ai_summary.qa_loading') : t('ai_summary.qa_submit')}
            </button>
          </div>
        </div>
      ) : null}
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
