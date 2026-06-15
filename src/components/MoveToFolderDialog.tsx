import { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n/useI18n';
import type { Folder } from '../types';
import { FolderPicker } from './FolderPicker';
import { useAnimePresence } from '../hooks/useAnimePresence';
import { motionEnter, motionExit } from '../utils/motion';
import './MoveToFolderDialog.css';

interface Props {
  open: boolean;
  folders: Folder[];
  noteCount: number;
  onConfirm: (folderId: string | null) => void;
  onClose: () => void;
}

export function MoveToFolderDialog({ open, folders, noteCount, onConfirm, onClose }: Props) {
  const { t } = useI18n();
  const [draftFolderId, setDraftFolderId] = useState<string | null>(null);
  const { mounted, ref: dialogRef } = useAnimePresence<HTMLDivElement>(open, 'dialog');
  const overlayRef = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  useEffect(() => {
    if (open && overlayRef.current) motionEnter('fade', overlayRef.current);
  }, [open]);

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
      motionExit('fade', overlay, cb);
    });
  };

  if (!mounted) return null;

  return (
    <div
      ref={overlayRef}
      className="modal-overlay motion-from-hidden"
      onClick={() => closeWithAnim(onClose)}
    >
      <div
        ref={dialogRef}
        className="move-folder-dialog motion-from-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{t('moveToFolder.title')}</h3>
        <p className="move-folder-desc">
          {noteCount === 1
            ? t('moveToFolder.descOne')
            : t('moveToFolder.descMany', { count: noteCount })}
        </p>
        <FolderPicker
          key={String(noteCount)}
          folders={folders}
          value={draftFolderId}
          onChange={setDraftFolderId}
          popoverMinWidth={340}
        />
        <div className="move-folder-actions">
          <button type="button" className="move-folder-cancel" onClick={() => closeWithAnim(onClose)}>
            {t('moveToFolder.cancel')}
          </button>
          <button
            type="button"
            className="move-folder-apply"
            onClick={() => {
              closeWithAnim(() => {
                onConfirm(draftFolderId);
                onClose();
              });
            }}
          >
            {t('moveToFolder.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
