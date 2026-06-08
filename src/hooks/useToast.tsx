import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import '../components/Toast.css';

interface ToastItem {
  id: string;
  message: string;
  variant: 'success' | 'error';
}

interface ToastContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, variant: 'success' }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss]
  );

  const showError = useCallback(
    (message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, variant: 'error' }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS + 800);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.variant}`}
            role={t.variant === 'error' ? 'alert' : 'status'}
          >
            {t.variant === 'error' ? (
              <AlertCircle size={18} className="toast-icon" aria-hidden />
            ) : (
              <CheckCircle2 size={18} className="toast-icon" aria-hidden />
            )}
            <span className="toast-text">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast harus dipakai di dalam ToastProvider');
  }
  return ctx;
}
