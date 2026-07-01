import { useEffect, type FC } from 'react';
import { useTranslation } from 'react-i18next';

export type ToastType = 'success' | 'warning' | 'error';

export interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss?: () => void;
}

export interface ToastItem extends ToastProps {
  id: string;
}

export const Toast: FC<ToastProps> = ({ message, type, duration = 3000, onDismiss }) => {
  useEffect(() => {
    if (!onDismiss) {
      return;
    }

    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onDismiss]);

  const accentClassName =
    type === 'error'
      ? 'border-l-error'
      : type === 'warning'
        ? 'border-l-warning'
        : 'border-l-renamed';

  return (
    <div
      className={`max-w-[min(320px,calc(100vw-36px))] rounded-[4px] border border-line border-l-[3px] bg-elevated px-[11px] py-[7px] text-[11.5px] text-text shadow-[0_4px_18px_rgba(0,0,0,0.32)] motion-safe:animate-toast-enter ${accentClassName}`}
      role="alert"
      aria-live="assertive"
    >
      {message}
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed right-[18px] bottom-[18px] z-50 flex flex-col gap-2" aria-label={t('shared.alerts')}>
      {toasts.slice(0, 3).map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};
