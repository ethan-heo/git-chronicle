import type { ButtonHTMLAttributes, FC } from 'react';
import { useTranslation } from 'react-i18next';

export const CopyMarkdownButton: FC<ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...props }) => {
  const { t } = useTranslation();

  return (
    <button
      {...props}
      type="button"
      aria-label={props['aria-label'] ?? t('shared.copy_markdown')}
      title={props.title ?? t('shared.copy_markdown')}
      className={[
        'inline-flex size-7 items-center justify-center rounded-sm bg-elevated p-0 text-muted opacity-0 transition hover:bg-hover hover:text-text',
        className,
      ].filter(Boolean).join(' ')}
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
        <rect x="5.25" y="3.25" width="7.5" height="9.5" rx="1.2" />
        <path d="M10.25 3.25V2.5a1.25 1.25 0 0 0-1.25-1.25h-5.5A1.25 1.25 0 0 0 2.25 2.5v8A1.25 1.25 0 0 0 3.5 11.75h1" />
      </svg>
    </button>
  );
};
