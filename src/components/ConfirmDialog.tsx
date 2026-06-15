import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import type { ConfirmVariant } from '../context/ConfirmContext';
import { motionEnter, motionExit } from '../utils/motion';
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
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (overlayRef.current) motionEnter('fade', overlayRef.current);
    if (dialogRef.current) motionEnter('dialog', dialogRef.current);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => confirmRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const closeWithAnim = (cb: () => void) => {
    if (closing.current) return;
    closing.current = true;
    const dialog = dialogRef.current;
    const overlay = overlayRef.current;
    if (!dialog || !overlay) {
      cb();
      return;
    }
    motionExit('dialog', dialog, () => {
      motionExit('fade', overlay, () => {
        setVisible(false);
        cb();
      });
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeWithAnim(onCancel);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  if (!visible) return null;

  const paragraphs = message.split(/\n+/).filter(Boolean);
  const isDanger = variant === 'danger';

  return (
    <div
      ref={overlayRef}
      className="confirm-dialog-overlay motion-from-hidden"
      role="presentation"
      onClick={() => closeWithAnim(onCancel)}
    >
      <div
        ref={dialogRef}
        className={`confirm-dialog motion-from-hidden ${isDanger ? 'confirm-dialog--danger' : ''}`}
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
            onClick={() => closeWithAnim(onCancel)}
          >
            {cancelLabel ?? t('common.cancel')}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`confirm-dialog-btn confirm-dialog-btn--confirm ${isDanger ? 'is-danger' : ''}`}
            onClick={() => closeWithAnim(onConfirm)}
          >
            {confirmLabel ?? t('confirmDialog.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
