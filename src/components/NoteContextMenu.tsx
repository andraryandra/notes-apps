import { useEffect } from 'react';
import { Star, Trash2, Pin } from 'lucide-react';
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
}

export function NoteContextMenu({ menu, onClose, onToggleFavorite, onTogglePin, onDelete }: Props) {
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

  return (
    <div
      className="note-context-menu"
      style={{ left: menu.x, top: menu.y }}
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
    </div>
  );
}
