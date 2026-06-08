import { createPortal } from 'react-dom';
import { useSyncExternalStore } from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import {
  finishConfirm,
  getConfirmState,
  subscribeConfirm,
} from '../utils/confirmStore';

/** Hanya komponen ini yang re-render saat dialog konfirmasi dibuka */
export function ConfirmHost() {
  const snap = useSyncExternalStore(subscribeConfirm, getConfirmState, getConfirmState);
  if (!snap) return null;

  return createPortal(
    <ConfirmDialog
      key={snap.id}
      title={snap.title}
      message={snap.message}
      confirmLabel={snap.confirmLabel}
      cancelLabel={snap.cancelLabel}
      variant={snap.variant}
      onConfirm={() => finishConfirm(true)}
      onCancel={() => finishConfirm(false)}
    />,
    document.body
  );
}
