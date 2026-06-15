import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { motionEnter, motionExit, isCyberpunkTheme } from '../utils/motion';
import type { AppTheme } from '../config/appearance';
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

function currentTheme(): AppTheme {
  const raw = document.documentElement.getAttribute('data-theme');
  return (raw as AppTheme) || 'dark';
}

function ToastBubble({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dismissing = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    motionEnter('toast', el);
    if (isCyberpunkTheme(currentTheme())) {
      el.style.boxShadow = 'var(--cyber-glow), var(--shadow)';
    }
  }, []);

  useEffect(() => {
    const duration = toast.variant === 'error' ? TOAST_DURATION_MS + 800 : TOAST_DURATION_MS;
    const timer = window.setTimeout(() => {
      if (dismissing.current) return;
      dismissing.current = true;
      const el = ref.current;
      if (el) {
        motionExit('toast', el, () => onDismiss(toast.id));
      } else {
        onDismiss(toast.id);
      }
    }, duration);
    return () => window.clearTimeout(timer);
  }, [toast.id, toast.variant, onDismiss]);

  return (
    <div
      ref={ref}
      className={`toast toast-${toast.variant} motion-from-hidden`}
      role={toast.variant === 'error' ? 'alert' : 'status'}
    >
      {toast.variant === 'error' ? (
        <AlertCircle size={18} className="toast-icon" aria-hidden />
      ) : (
        <CheckCircle2 size={18} className="toast-icon" aria-hidden />
      )}
      <span className="toast-text">{toast.message}</span>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, variant: 'success' }]);
    },
    []
  );

  const showError = useCallback(
    (message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, message, variant: 'error' }]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showSuccess, showError }}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <ToastBubble key={t.id} toast={t} onDismiss={dismiss} />
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
