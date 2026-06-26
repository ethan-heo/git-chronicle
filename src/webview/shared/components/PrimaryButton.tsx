import type { ButtonHTMLAttributes, FC, ReactNode } from 'react';

interface PrimaryButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled'> {
  children: ReactNode;
  disabled?: boolean;
  isLoading?: boolean;
}

export const PrimaryButton: FC<PrimaryButtonProps> = ({
  children,
  disabled = false,
  isLoading = false,
  className,
  type = 'button',
  ...buttonProps
}) => {
  const isUnavailable = disabled || isLoading;

  return (
    <button
      {...buttonProps}
      className={['primary-button', className].filter(Boolean).join(' ')}
      type={type}
      disabled={isUnavailable}
      aria-disabled={isUnavailable}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? <span className="primary-button-spinner" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
};
