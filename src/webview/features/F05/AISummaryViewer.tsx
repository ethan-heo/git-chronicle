import { useEffect, useRef, type FC, type ReactElement, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState } from '../../shared/components';
import type { SummaryMode } from '../../types/commit';
import { QAInputArea } from '../F09/QAInputArea';
import { RegenerateButton } from './RegenerateButton';
import { StreamingTextRenderer } from './StreamingTextRenderer';

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type DisplayHeadingLevel = 2 | 3 | 4 | 5;

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
  qaCompletionCount: number;
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
  qaCompletionCount,
  summaryMode,
  onAskQuestion,
  onGoToSettings,
  onRegenerate,
  onRetry,
}) => {
  const { t } = useTranslation();
  const summaryEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (qaCompletionCount > 0) {
      summaryEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [qaCompletionCount]);

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
        <div className="ai-summary-body">
          {isGenerating ? (
            <StreamingTextRenderer content={content} isStreaming />
          ) : content ? (
            <>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => renderMarkdownHeading(1, children),
                  h2: ({ children }) => renderMarkdownHeading(2, children),
                  h3: ({ children }) => renderMarkdownHeading(3, children),
                  h4: ({ children }) => renderMarkdownHeading(4, children),
                  h5: ({ children }) => renderMarkdownHeading(5, children),
                  h6: ({ children }) => renderMarkdownHeading(6, children),
                }}
              >
                {content}
              </ReactMarkdown>
              <div ref={summaryEndRef} />
            </>
          ) : (
            <EmptyState message={summaryMode === 'commit' ? t('ai_summary.empty_commit') : t('ai_summary.empty')} />
          )}
        </div>
        {canAskQuestion ? (
          <>
            <QAInputArea isGeneratingQA={isGeneratingQA} onAskQuestion={onAskQuestion} />
          </>
        ) : null}
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

function renderMarkdownHeading(level: HeadingLevel, children: ReactNode): ReactElement {
  const displayLevel = toDisplayHeadingLevel(level);
  const Tag = `h${displayLevel}` as const;
  const headingText = extractHeadingText(children).trim();
  const isQuestionHeading = /^q\.\s/i.test(headingText);

  return (
    <Tag className={`ai-summary-heading ai-summary-heading-h${displayLevel}${isQuestionHeading ? ' ai-summary-heading-question' : ''}`}>
      {displayLevel <= 4 && !isQuestionHeading ? <span aria-hidden="true" /> : null}
      {children}
    </Tag>
  );
}

function toDisplayHeadingLevel(level: HeadingLevel): DisplayHeadingLevel {
  if (level <= 1) {
    return 2;
  }

  if (level === 2) {
    return 3;
  }

  if (level === 3) {
    return 4;
  }

  return 5;
}

function extractHeadingText(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map((child) => extractHeadingText(child)).join('');
  }

  if (children && typeof children === 'object' && 'props' in children) {
    const childProps = children.props as { children?: ReactNode };
    return extractHeadingText(childProps.children ?? '');
  }

  return '';
}
