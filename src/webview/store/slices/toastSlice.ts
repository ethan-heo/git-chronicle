import type { StateCreator } from 'zustand';
import type { ToastItem, ToastType } from '../../shared/components/Toast';
import type { AppState } from '../appStore';

export interface ToastSlice {
  toasts: ToastItem[];
  pushToast: (message: string, type: ToastType) => void;
  dismissToast: (id: string) => void;
}

export const createToastSlice: StateCreator<AppState, [], [], ToastSlice> = (set) => ({
  toasts: [],

  pushToast: (message, type) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
});
