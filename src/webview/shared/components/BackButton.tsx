import type { ButtonHTMLAttributes, FC } from 'react';

type BackButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>;

export const BackButton: FC<BackButtonProps> = ({
  'aria-label': ariaLabel = '이전 화면으로 이동',
  className,
  type = 'button',
  ...buttonProps
}) => {
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
      <span>뒤로</span>
    </button>
  );
};
