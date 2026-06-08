import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { ConfirmHost } from '../components/ConfirmHost';
import { requestConfirm } from '../utils/confirmStore';

export type ConfirmVariant = 'default' | 'danger';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const value = useMemo(() => ({ confirm: requestConfirm }), []);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmHost />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm harus dipakai di dalam ConfirmProvider');
  }
  return ctx;
}
