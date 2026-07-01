import type { ButtonHTMLAttributes, FC } from 'react';
import { useTranslation } from 'react-i18next';

type BackButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export const BackButton: FC<BackButtonProps> = ({
  'aria-label': ariaLabel,
  className,
  type = 'button',
  ...buttonProps
}) => {
  const { t } = useTranslation();
  const resolvedAriaLabel = ariaLabel ?? t('shared.back_button');

  return (
    <button
      {...buttonProps}
      className={[
        'inline-flex items-center justify-center gap-1 rounded-sm border-none bg-transparent px-2 py-[5px] text-[12.5px] text-muted transition-colors duration-100 ease-in-out hover:bg-hover hover:text-text',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      type={type}
      aria-label={resolvedAriaLabel}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M10 3 5 8l5 5" />
      </svg>
      <span>{t('shared.back_button')}</span>
    </button>
  );
};
