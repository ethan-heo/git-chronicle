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

  return (
    <div className={`toast toast-${type}`} role="alert" aria-live="assertive">
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
    <div className="toast-container" aria-label={t('shared.alerts')}>
      {toasts.slice(0, 3).map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};
