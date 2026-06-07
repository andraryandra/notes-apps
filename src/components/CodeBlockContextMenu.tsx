import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Trash2 } from 'lucide-react';
import './CodeBlockContextMenu.css';

interface MenuState {
  x: number;
  y: number;
}

interface Props {
  editor: Editor;
}

export function CodeBlockContextMenu({ editor }: Props) {
  const [menu, setMenu] = useState<MenuState | null>(null);

  useEffect(() => {
    const onMenu = (payload: { x: number; y: number }) => {
      setMenu({ x: payload.x, y: payload.y });
    };
    editor.on('codeBlockContextMenu', onMenu);
    return () => {
      editor.off('codeBlockContextMenu', onMenu);
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

  const deleteBlock = () => {
    editor.chain().focus().deleteNode('codeBlock').run();
    setMenu(null);
  };

  const focusBelow = () => {
    const { doc } = editor.state;
    const end = doc.content.size;
    editor.chain().focus().setTextSelection(end).run();
    setMenu(null);
  };

  return (
    <div
      className="code-block-context-menu"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button type="button" className="code-block-context-item" onClick={focusBelow}>
        Tulis di bawah blok
      </button>
      <button type="button" className="code-block-context-item danger" onClick={deleteBlock}>
        <Trash2 size={14} />
        Hapus blok kode
      </button>
    </div>
  );
}
