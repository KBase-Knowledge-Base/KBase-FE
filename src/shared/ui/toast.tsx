import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastItem = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    const duration = toast.durationMs ?? 4000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-semantic-success shrink-0" />,
            error: <AlertCircle className="w-5 h-5 text-semantic-danger shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-semantic-warning shrink-0" />,
            info: <Info className="w-5 h-5 text-accent shrink-0" />,
          };

          const borders = {
            success: 'border-semantic-success-border bg-white',
            error: 'border-semantic-danger-border bg-white',
            warning: 'border-semantic-warning-border bg-white',
            info: 'border-accent-light bg-white',
          };

          return (
            <div
              key={toast.id}
              role="alert"
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-card border shadow-lg duration-200 animate-in slide-in-from-bottom-2',
                borders[toast.type]
              )}
            >
              {icons[toast.type]}
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-ink leading-tight">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-ink-muted mt-0.5 leading-snug">{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-ink-muted hover:text-ink p-1 rounded hover:bg-surface-subtle"
                aria-label="Đóng thông báo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
