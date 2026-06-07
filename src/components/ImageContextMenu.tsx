import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Trash2, Type, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { WIDTH_PRESETS, ALIGN_PRESETS, type ImageAlign } from '../extensions/NoteImage';
import { scheduleStoredFileCleanup } from '../utils/scheduleStoredFileCleanup';
import './ImageContextMenu.css';

interface MenuState {
  x: number;
  y: number;
}

interface Props {
  editor: Editor;
}

export function ImageContextMenu({ editor }: Props) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [captionDraft, setCaptionDraft] = useState('');
  const [showCaptionInput, setShowCaptionInput] = useState(false);

  useEffect(() => {
    const onContextMenu = (payload: {
      x: number;
      y: number;
      deleteNode: () => void;
      updateAttributes: (attrs: Record<string, unknown>) => void;
      node: { attrs: { caption?: string; width?: string } };
    }) => {
      setMenu({ x: payload.x, y: payload.y });
      setCaptionDraft(payload.node.attrs.caption || '');
      setShowCaptionInput(false);
    };

    editor.on('imageContextMenu', onContextMenu);
    return () => {
      editor.off('imageContextMenu', onContextMenu);
    };
  }, [editor]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  if (!menu) return null;

  const attrs = editor.getAttributes('image');

  const applyWidth = (w: string) => {
    editor.chain().focus().updateAttributes('image', { width: w }).run();
    setMenu(null);
  };

  const applyAlign = (a: ImageAlign) => {
    editor.chain().focus().updateAttributes('image', { align: a }).run();
    setMenu(null);
  };

  const applyCaption = () => {
    editor.chain().focus().updateAttributes('image', { caption: captionDraft.trim() }).run();
    setMenu(null);
  };

  const deleteImage = () => {
    const storedSrc = (attrs.storedSrc as string | undefined) || undefined;
    const fileId = (attrs.fileId as string | undefined) || undefined;
    const fallbackSrc = (attrs.src as string | undefined) || undefined;
    const cleanupUrl =
      storedSrc || (fileId ? `notes-image://${fileId}` : undefined) || fallbackSrc;
    editor.chain().focus().deleteNode('image').run();
    scheduleStoredFileCleanup(cleanupUrl);
    setMenu(null);
  };

  return (
    <div
      className="image-context-menu"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="image-context-section">
        <span className="image-context-label">Posisi</span>
        <div className="image-context-sizes">
          {ALIGN_PRESETS.map((a) => (
            <button
              key={a}
              type="button"
              className={`image-context-align ${attrs.align === a ? 'active' : ''}`}
              title={a === 'left' ? 'Kiri' : a === 'center' ? 'Tengah' : 'Kanan'}
              onClick={() => applyAlign(a)}
            >
              {a === 'left' && <AlignLeft size={14} />}
              {a === 'center' && <AlignCenter size={14} />}
              {a === 'right' && <AlignRight size={14} />}
            </button>
          ))}
        </div>
      </div>

      <div className="image-context-section">
        <span className="image-context-label">Ukuran</span>
        <div className="image-context-sizes">
          {WIDTH_PRESETS.map((w) => (
            <button
              key={w}
              type="button"
              className={attrs.width === w ? 'active' : ''}
              onClick={() => applyWidth(w)}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {!showCaptionInput ? (
        <button
          type="button"
          className="image-context-item"
          onClick={() => setShowCaptionInput(true)}
        >
          <Type size={14} />
          {attrs.caption ? 'Ubah keterangan' : 'Tambah keterangan'}
        </button>
      ) : (
        <div className="image-context-caption-form">
          <input
            type="text"
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            placeholder="Mis. Gambar 1.1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyCaption();
              if (e.key === 'Escape') setMenu(null);
            }}
          />
          <button type="button" className="image-context-apply" onClick={applyCaption}>
            Simpan
          </button>
        </div>
      )}

      <button type="button" className="image-context-item danger" onClick={deleteImage}>
        <Trash2 size={14} />
        Hapus gambar
      </button>
    </div>
  );
}
