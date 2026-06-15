import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import './SidebarFlyout.css';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function SidebarFlyout({ open, title, onClose, children }: Props) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="sidebar-flyout-backdrop"
        aria-label={t('sidebar.closePanel')}
        onClick={onClose}
      />
      <aside className="sidebar-flyout" aria-label={title}>
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
