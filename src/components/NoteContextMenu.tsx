import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, Trash2, Pin, FolderInput, Copy } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import './NoteContextMenu.css';

export interface NoteContextMenuState {
  x: number;
  y: number;
  noteId: string;
  favorite: boolean;
  pinned: boolean;
}

interface Props {
  menu: NoteContextMenuState | null;
  onClose: () => void;
  onToggleFavorite: (noteId: string) => void;
  onTogglePin: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onDuplicate?: (noteId: string) => void;
  onMoveToFolder?: (noteId: string) => void;
}

const MENU_W = 200;
const MENU_H = 208;

function clampPosition(x: number, y: number) {
  const pad = 8;
  return {
    x: Math.max(pad, Math.min(x, window.innerWidth - MENU_W - pad)),
    y: Math.max(pad, Math.min(y, window.innerHeight - MENU_H - pad)),
  };
}

export function NoteContextMenu({
  menu,
  onClose,
  onToggleFavorite,
  onTogglePin,
  onDelete,
  onDuplicate,
  onMoveToFolder,
}: Props) {
  const { t } = useI18n();

  useEffect(() => {
    if (!menu) return;
    const close = () => onClose();
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu, onClose]);

  if (!menu) return null;

  const pos = clampPosition(menu.x, menu.y);

  return createPortal(
    <div
      className="note-context-menu"
      style={{ left: pos.x, top: pos.y }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        type="button"
        onClick={() => {
          onTogglePin(menu.noteId);
          onClose();
        }}
      >
        <Pin size={16} fill={menu.pinned ? 'currentColor' : 'none'} />
        {menu.pinned ? t('noteContextMenu.unpin') : t('noteContextMenu.pin')}
      </button>
      <button
        type="button"
        onClick={() => {
          onToggleFavorite(menu.noteId);
          onClose();
        }}
      >
        <Star size={16} fill={menu.favorite ? 'currentColor' : 'none'} />
        {menu.favorite ? t('noteContextMenu.removeFavorite') : t('noteContextMenu.addFavorite')}
      </button>
      {onMoveToFolder && (
        <button
          type="button"
          onClick={() => {
            onMoveToFolder(menu.noteId);
            onClose();
          }}
        >
          <FolderInput size={16} />
          {t('noteContextMenu.moveToFolder')}
        </button>
      )}
      {onDuplicate && (
        <button
          type="button"
          onClick={() => {
            onDuplicate(menu.noteId);
            onClose();
          }}
        >
          <Copy size={16} />
          {t('noteContextMenu.duplicate')}
        </button>
      )}
      <button
        type="button"
        className="note-context-menu-danger"
        onClick={() => {
          onDelete(menu.noteId);
          onClose();
        }}
      >
        <Trash2 size={16} />
        {t('noteContextMenu.delete')}
      </button>
    </div>,
    document.body
  );
}
