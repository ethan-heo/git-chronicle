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
  const baseClassName =
    'inline-flex items-center justify-center gap-1.5 rounded-sm border border-transparent bg-accent px-3.5 py-1.5 text-[12.5px] font-medium text-on-accent transition-colors duration-100 ease-in-out hover:bg-accent-hi disabled:cursor-not-allowed disabled:opacity-45 aria-[busy=true]:cursor-progress aria-[busy=true]:opacity-85';

  return (
    <button
      {...buttonProps}
      className={[baseClassName, className].filter(Boolean).join(' ')}
      type={type}
      disabled={isUnavailable}
      aria-disabled={isUnavailable}
      aria-busy={isLoading || undefined}
    >
      {isLoading ? (
        <span
          className="size-3 rounded-full border-2 border-[color-mix(in_srgb,var(--color-on-accent)_45%,transparent)] border-t-on-accent motion-safe:animate-spin"
          aria-hidden="true"
        />
      ) : null}
      <span>{children}</span>
    </button>
  );
};
