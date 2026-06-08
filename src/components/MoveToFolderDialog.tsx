import { useState } from 'react';
import { useI18n } from '../i18n/useI18n';
import type { Folder } from '../types';
import { FolderPicker } from './FolderPicker';
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

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="move-folder-dialog" onClick={(e) => e.stopPropagation()}>
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
          <button type="button" className="move-folder-cancel" onClick={onClose}>
            {t('moveToFolder.cancel')}
          </button>
          <button
            type="button"
            className="move-folder-apply"
            onClick={() => {
              onConfirm(draftFolderId);
              onClose();
            }}
          >
            {t('moveToFolder.apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
