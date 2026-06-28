import type { ButtonHTMLAttributes, FC } from 'react';
import { useTranslation } from 'react-i18next';

type BackButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export const BackButton: FC<BackButtonProps> = ({
  'aria-label': ariaLabel = '이전 화면으로 이동',
  className,
  type = 'button',
  ...buttonProps
}) => {
  const { t } = useTranslation();

  return (
    <button
      {...buttonProps}
      className={['back-button', className].filter(Boolean).join(' ')}
      type={type}
      aria-label={ariaLabel}
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M10 3 5 8l5 5" />
      </svg>
      <span>{t('shared.back_button')}</span>
    </button>
  );
};
