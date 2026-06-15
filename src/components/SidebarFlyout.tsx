import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { useAnimePresence } from '../hooks/useAnimePresence';
import { motionEnter, motionExit } from '../utils/motion';
import './SidebarFlyout.css';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function SidebarFlyout({ open, title, onClose, children }: Props) {
  const { t } = useI18n();
  const { mounted, ref: panelRef } = useAnimePresence<HTMLElement>(open, 'flyoutPanel');
  const backdropRef = useRef<HTMLButtonElement>(null);
  const exitStarted = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!mounted || !backdrop) return;

    if (open) {
      exitStarted.current = false;
      motionEnter('fade', backdrop);
      return;
    }

    if (!exitStarted.current) {
      exitStarted.current = true;
      motionExit('fade', backdrop, () => {});
    }
  }, [open, mounted]);

  if (!mounted) return null;

  return (
    <>
      <button
        ref={backdropRef}
        type="button"
        className="sidebar-flyout-backdrop motion-from-hidden"
        aria-label={t('sidebar.closePanel')}
        onClick={onClose}
      />
      <aside ref={panelRef} className="sidebar-flyout motion-from-hidden" aria-label={title}>
        <header className="sidebar-flyout-header">
          <h2>{title}</h2>
          <button type="button" className="sidebar-flyout-close" onClick={onClose} aria-label={t('sidebar.closePanel')}>
            <X size={18} />
          </button>
        </header>
        <div className="sidebar-flyout-body">{children}</div>
      </aside>
    </>
  );
}
