import { isValidElement, useEffect, useMemo, useRef, type FC, type ReactNode, type RefObject } from 'react';
import ReactMarkdown from 'react-markdown';
import { rehypeAnnotateSourceOffsets } from './rehypeAnnotateSourceOffsets';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { EmptyState, ErrorState } from '../../shared/components';
import { HighlightedCode } from '../../shared/highlighter';
import { QAInputArea } from '../F09/QAInputArea';
import { CopyMarkdownButton } from '../F11';
import { MermaidBlock } from '../F11/MermaidBlock';
import { useAppStore } from '../../store/appStore';
import { RegenerateButton } from './RegenerateButton';
import { StreamingTextRenderer } from './StreamingTextRenderer';
import { useMarkdownSourceCopy } from './useMarkdownSourceCopy';
import './AISummaryViewer.css';

interface AISummaryViewerProps {
  content: string;
  error: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  isGeneratingQA: boolean;
  hasSavedSummary: boolean;
  hasAIProvider: boolean;
  hasSavePath: boolean;
  noteRelativePath?: string | null;
  savedPath: string | null;
  providerLabel: string | null;
  qaCompletionCount: number;
  headerLeading?: ReactNode;
  headerTrailing?: ReactNode;
  onAskQuestion: (question: string) => void;
  onGoToSettings: () => void;
  onRegenerate: () => void;
  onRetry: () => void;
  onSave?: () => void;
  saveButtonRef?: RefObject<HTMLButtonElement | null>;
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
  qaCompletionCount,
  headerLeading,
  headerTrailing,
  onAskQuestion,
  onGoToSettings,
  onRegenerate,
  onRetry,
  onSave = () => {},
  saveButtonRef,
}) => {
  const { t } = useTranslation();
  const summaryEndRef = useRef<HTMLDivElement | null>(null);
  const markdownContainerRef = useMarkdownSourceCopy(content);

  const showRegenerate = Boolean(content) || isGenerating;
  const canAskQuestion = !isGenerating && Boolean(content) && hasSavedSummary;
  const markdownComponents = useMemo(() => {
    let mermaidBlockIndex = 0;
    let highlightedCodeBlockIndex = 0;

    return {
      pre({
        children,
        node,
      }: {
        children?: ReactNode;
        node?: { position?: { start?: { offset?: number | null }; end?: { offset?: number | null } } };
      }) {
        const rawMarkdown = sliceFromPosition(content, node?.position);

        if (containsMermaidBlock(children) || rawMarkdown?.startsWith('```mermaid')) {
          return <>{children}</>;
        }

        const blockStart = node?.position?.start?.offset;
        const blockEnd = node?.position?.end?.offset;

        return (
          <div
            className="ai-summary-code-block relative"
            data-md-block-start={typeof blockStart === 'number' ? String(blockStart) : undefined}
            data-md-block-end={typeof blockEnd === 'number' ? String(blockEnd) : undefined}
          >
            {rawMarkdown ? (
              <CopyMarkdownButton
                className="ai-summary-copy-button absolute top-2 right-2 z-[1]"
                onClick={() => {
                  void navigator.clipboard.writeText(rawMarkdown).then(() => {
                    useAppStore.getState().pushToast(t('toast.code_block_markdown_copied'), 'success');
                  });
                }}
              />
            ) : null}
            <pre
              data-md-block-start={typeof blockStart === 'number' ? String(blockStart) : undefined}
              data-md-block-end={typeof blockEnd === 'number' ? String(blockEnd) : undefined}
            >
              {children}
            </pre>
          </div>
        );
      },
      code({ className, children, node, ...props }: { className?: string; children?: ReactNode; node?: { position?: { start?: { offset?: number | null }; end?: { offset?: number | null } } } }) {
        const match = /language-(\w+)/.exec(className ?? '');
        const language = match?.[1];
        const codeContent = String(children).replace(/\n$/, '');
        const blockStart = node?.position?.start?.offset;
        const blockEnd = node?.position?.end?.offset;

        if (language === 'mermaid') {
          const mermaidCacheKey = getStableMermaidCacheKey(blockStart, mermaidBlockIndex);
          if (typeof blockStart !== 'number') {
            mermaidBlockIndex += 1;
          }
          const rawMarkdown = sliceFromPosition(content, node?.position) ?? `\`\`\`mermaid\n${codeContent}\n\`\`\``;

          return (
            <div
              className="ai-summary-mermaid-block relative"
              data-md-block-start={typeof blockStart === 'number' ? String(blockStart) : undefined}
              data-md-block-end={typeof blockEnd === 'number' ? String(blockEnd) : undefined}
            >
              <CopyMarkdownButton
                className="ai-summary-copy-button absolute top-2 right-2 z-[1]"
                onClick={() => {
                  void navigator.clipboard.writeText(rawMarkdown).then(() => {
                    useAppStore.getState().pushToast(t('toast.mermaid_markdown_copied'), 'success');
                  });
                }}
              />
              <MermaidBlock cacheKey={mermaidCacheKey} code={codeContent} />
            </div>
          );
        }

        if (language) {
          const highlightedCacheKey = getStableHighlightedCodeCacheKey(blockStart, highlightedCodeBlockIndex);
          if (typeof blockStart !== 'number') {
            highlightedCodeBlockIndex += 1;
          }

          return <HighlightedCode cacheKey={highlightedCacheKey} className={className} code={codeContent} language={language} />;
        }

        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
    };
  }, [content, t]);

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
        <div className="flex items-center gap-3.5">
          <span className="ai-summary-loading-orb" aria-hidden="true" />
          <div className="flex min-w-0 flex-col gap-[3px]">
            <strong className="text-sm font-bold text-text">{t('ai_summary.loading_title')}</strong>
            <p className="m-0 text-sm text-muted">{t('ai_summary.loading')}</p>
          </div>
        </div>
        <div
          className="flex flex-col gap-3 rounded-[14px] border border-[color-mix(in_srgb,var(--color-line)_82%,transparent)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-panel)_88%,transparent),color-mix(in_srgb,var(--color-surface)_92%,transparent))] p-[18px] shadow-[0_18px_44px_rgba(0,0,0,0.12)]"
          aria-hidden="true"
        >
          <span className="ai-summary-loading-shimmer block h-[22px] w-[120px] rounded-full bg-[color-mix(in_srgb,var(--color-elevated)_86%,white_14%)]" />
          <span className="ai-summary-loading-shimmer block h-2.5 w-[78%] rounded-full bg-[color-mix(in_srgb,var(--color-elevated)_86%,white_14%)]" />
          <span className="ai-summary-loading-shimmer block h-2.5 w-full rounded-full bg-[color-mix(in_srgb,var(--color-elevated)_86%,white_14%)]" />
          <span className="ai-summary-loading-shimmer block h-2.5 w-[42%] rounded-full bg-[color-mix(in_srgb,var(--color-elevated)_86%,white_14%)]" />
          <div className="flex flex-col gap-2.5 pt-0.5">
            <span className="ai-summary-loading-shimmer block h-2.5 w-[58%] rounded-full bg-[color-mix(in_srgb,var(--color-elevated)_86%,white_14%)]" />
            <span className="ai-summary-loading-shimmer block h-2.5 w-full rounded-full bg-[color-mix(in_srgb,var(--color-elevated)_86%,white_14%)]" />
            <span className="ai-summary-loading-shimmer block h-2.5 w-[78%] rounded-full bg-[color-mix(in_srgb,var(--color-elevated)_86%,white_14%)]" />
          </div>
          <div className="flex flex-col gap-2.5 pt-0.5">
            <span className="ai-summary-loading-shimmer block h-2.5 w-[42%] rounded-full bg-[color-mix(in_srgb,var(--color-elevated)_86%,white_14%)]" />
            <span className="ai-summary-loading-shimmer block h-2.5 w-[58%] rounded-full bg-[color-mix(in_srgb,var(--color-elevated)_86%,white_14%)]" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col" role="region" aria-label={t('ai_summary.ai_result')} aria-live={isGenerating ? 'polite' : undefined}>
      <div className="flex h-10 items-center justify-between gap-2 border-b border-line bg-panel px-1">
        <div className="flex min-w-0 items-center gap-2">
          {headerLeading ? <div className="shrink-0">{headerLeading}</div> : null}
        </div>
        <div className="flex items-center gap-1">
          {!hasSavedSummary && content ? (
            <button
              ref={saveButtonRef}
              type="button"
              className="inline-flex h-8 items-center justify-center rounded-md px-1.5 text-muted transition-colors hover:bg-hover hover:text-text"
              aria-label={t('ai_summary.save')}
              title={t('ai_summary.save')}
              onClick={onSave}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 2.5h4.5L13 6v7.5H5z" />
                <path d="M9.5 2.5V6H13" />
                <path d="M7 9h4M7 11h4" />
              </svg>
            </button>
          ) : null}
          {showRegenerate ? <RegenerateButton disabled={isGenerating} onClick={onRegenerate} /> : null}
          {headerTrailing ? <div className="shrink-0">{headerTrailing}</div> : null}
        </div>
      </div>

      <div className="ai-summary-content ai-summary-content-commit flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-auto px-7 pt-5 pb-16 sm:px-8">
          {isGenerating ? (
            <StreamingTextRenderer content={content} isStreaming />
          ) : content ? (
            <>
              <div ref={markdownContainerRef} className="group relative ai-summary-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[[rehypeAnnotateSourceOffsets, content]]}
                  components={markdownComponents}
                >
                  {content}
                </ReactMarkdown>
              </div>
              <div ref={summaryEndRef} />
            </>
          ) : (
            <EmptyState message={t('ai_summary.empty_commit')} />
          )}
        </div>
        {content ? <QAInputArea isEnabled={canAskQuestion} isGeneratingQA={isGeneratingQA} onAskQuestion={onAskQuestion} /> : null}
      </div>
    </section>
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

  const className = (children.props as { className?: string }).className ?? '';
  if (typeof className === 'string' && className.includes('ai-summary-mermaid-block')) {
    return true;
  }

  return containsMermaidBlock((children.props as { children?: ReactNode }).children);
}

function getStableMermaidCacheKey(blockStart: number | null | undefined, fallbackIndex: number): string {
  if (typeof blockStart === 'number') {
    return `ai-summary-mermaid-offset-${blockStart}`;
  }

  return `ai-summary-mermaid-fallback-${fallbackIndex}`;
}

function getStableHighlightedCodeCacheKey(blockStart: number | null | undefined, fallbackIndex: number): string {
  if (typeof blockStart === 'number') {
    return `ai-summary-code-offset-${blockStart}`;
  }

  return `ai-summary-code-fallback-${fallbackIndex}`;
}

function sliceFromPosition(
  content: string,
  position?: { start?: { offset?: number | null }; end?: { offset?: number | null } },
): string | null {
  const start = position?.start?.offset;
  const end = position?.end?.offset;

  if (typeof start !== 'number' || typeof end !== 'number' || end < start) {
    return null;
  }

  return content.slice(start, end);
}
