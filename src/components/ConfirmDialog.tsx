import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import type { ConfirmVariant } from '../context/ConfirmContext';
import './ConfirmDialog.css';

interface Props {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useI18n();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const paragraphs = message.split(/\n+/).filter(Boolean);
  const isDanger = variant === 'danger';

  return (
    <div className="confirm-dialog-overlay" role="presentation" onClick={onCancel}>
      <div
        className={`confirm-dialog ${isDanger ? 'confirm-dialog--danger' : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`confirm-dialog-icon ${isDanger ? 'is-danger' : ''}`} aria-hidden>
          {isDanger ? <Trash2 size={22} /> : <AlertTriangle size={22} />}
        </div>

        <div className="confirm-dialog-body">
          <h2 id="confirm-dialog-title" className="confirm-dialog-title">
            {title ?? t('confirmDialog.defaultTitle')}
          </h2>
          <div id="confirm-dialog-message" className="confirm-dialog-message">
            {paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        <div className="confirm-dialog-actions">
          <button
            type="button"
            className="confirm-dialog-btn confirm-dialog-btn--cancel"
            onClick={onCancel}
          >
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`confirm-dialog-btn confirm-dialog-btn--confirm ${isDanger ? 'is-danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel ?? t('confirmDialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
