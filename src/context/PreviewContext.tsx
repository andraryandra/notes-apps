import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { PreviewModal, type PreviewPayload } from '../components/PreviewModal';

interface PreviewContextValue {
  openPreview: (payload: PreviewPayload) => void;
  openImagePreview: (src: string, title?: string) => void;
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<PreviewPayload | null>(null);

  const openPreview = useCallback((p: PreviewPayload) => setPayload(p), []);

  const openImagePreview = useCallback(
    (src: string, title = 'Gambar') => {
      setPayload({ mode: 'image', title, src });
    },
    []
  );

  return (
    <PreviewContext.Provider value={{ openPreview, openImagePreview }}>
      {children}
      {payload && <PreviewModal payload={payload} onClose={() => setPayload(null)} />}
    </PreviewContext.Provider>
  );
}

export function usePreview(): PreviewContextValue {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error('usePreview harus dipakai di dalam PreviewProvider');
  return ctx;
}
