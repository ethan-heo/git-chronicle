import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import './StreamingTextRenderer.css';

interface StreamingTextRendererProps {
  content: string;
  isStreaming: boolean;
}

export const StreamingTextRenderer: FC<StreamingTextRendererProps> = ({ content, isStreaming }) => {
  const { t } = useTranslation();

  if (!content && isStreaming) {
    return (
      <div className="flex min-h-[180px] items-center gap-[3px]">
        <div className="inline-flex items-center gap-2 text-[13px] leading-[1.4] text-[color-mix(in_srgb,var(--color-text)_82%,var(--color-muted))]" aria-label={t('ai_summary.thinking')}>
          <span className="streaming-thinking-label">{t('ai_summary.thinking')}</span>
          <span className="streaming-thinking-dots inline-flex items-center gap-1" aria-hidden="true">
            <span className="size-[5px] rounded-full bg-current opacity-[0.22]" />
            <span className="size-[5px] rounded-full bg-current opacity-[0.22]" />
            <span className="size-[5px] rounded-full bg-current opacity-[0.22]" />
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[180px] items-end gap-[3px]">
      <pre className="m-0 whitespace-pre-wrap break-words font-sans text-base leading-[1.62] text-text">{content}</pre>
      {isStreaming ? <span className="streaming-cursor mb-1 inline-block h-[15px] w-[7px] bg-link" aria-hidden="true" /> : null}
    </div>
  );
};
