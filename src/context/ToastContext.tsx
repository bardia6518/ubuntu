import { createContext, useCallback, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

interface ToastContextValue {
  showToast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const kindStyles: Record<ToastKind, string> = {
  success: 'border-primary-200 bg-primary-50 text-primary-800 dark:border-primary-800/50 dark:bg-primary-950/60 dark:text-primary-200',
  error: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800/50 dark:bg-rose-950/60 dark:text-rose-200',
  info: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800/50 dark:bg-sky-950/60 dark:text-sky-200',
};

const kindIcons: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6 sm:left-6 sm:translate-x-0">
        {toasts.map((toast) => {
          const Icon = kindIcons[toast.kind];
          return (
            <div
              key={toast.id}
              className={`animate-slide-up flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-popover backdrop-blur ${kindStyles[toast.kind]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <p className="flex-1 text-sm leading-6">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 rounded-md p-0.5 opacity-60 transition hover:opacity-100"
                aria-label="بستن"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
