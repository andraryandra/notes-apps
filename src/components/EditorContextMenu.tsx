import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';
import {
  ClipboardCopy,
  ClipboardPaste,
  Scissors,
  Trash2,
  ImagePlus,
  Paperclip,
  TextSelect,
} from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { useEditorQuickActions } from '../hooks/useEditorQuickActions';
import './EditorContextMenu.css';

interface MenuState {
  x: number;
  y: number;
}

interface Props {
  editor: Editor;
  onInsertImage: () => void;
  onInsertFile: () => void;
}

function shouldSkipContextMenu(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      '.note-image-figure, .note-image-wrapper, .notes-code-block, [data-note-attachment], .image-context-menu, .code-block-context-menu'
    )
  );
}

export function EditorContextMenu({ editor, onInsertImage, onInsertFile }: Props) {
  const { t } = useI18n();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const { hasSelection, copy, paste, cut, deleteSelection, selectAll } = useEditorQuickActions(editor);

  useEffect(() => {
    const dom = editor.view.dom;
    const onContextMenu = (e: MouseEvent) => {
      if (shouldSkipContextMenu(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      setMenu({ x: e.clientX, y: e.clientY });
    };
    dom.addEventListener('contextmenu', onContextMenu);
    return () => dom.removeEventListener('contextmenu', onContextMenu);
  }, [editor]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: Event) => {
      const target = e.target;
      if (target instanceof Element && target.closest('.editor-context-menu')) return;
      setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    window.addEventListener('mousedown', close, true);
    window.addEventListener('scroll', close, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', close, true);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const run = useCallback((fn: () => void | Promise<unknown>) => {
    setMenu(null);
    void fn();
  }, []);

  if (!menu) return null;

  const menuEl = (
    <div
      className="editor-context-menu"
      style={{ left: menu.x, top: menu.y }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {hasSelection && (
        <>
          <button type="button" onClick={() => run(() => cut())}>
            <Scissors size={15} />
            {t('richEditor.selectionCut')}
          </button>
          <button type="button" onClick={() => run(() => copy())}>
            <ClipboardCopy size={15} />
            {t('richEditor.selectionCopy')}
          </button>
        </>
      )}
      <button type="button" onClick={() => run(() => paste())}>
        <ClipboardPaste size={15} />
        {t('richEditor.selectionPaste')}
      </button>
      {hasSelection && (
        <button type="button" className="is-danger" onClick={() => run(deleteSelection)}>
          <Trash2 size={15} />
          {t('richEditor.selectionDelete')}
        </button>
      )}
      <button type="button" onClick={() => run(selectAll)}>
        <TextSelect size={15} />
        {t('richEditor.selectionSelectAll')}
      </button>
      <div className="editor-context-menu-divider" role="separator" />
      <button type="button" onClick={() => run(onInsertImage)}>
        <ImagePlus size={15} />
        {t('richEditor.uploadImage')}
      </button>
      <button type="button" onClick={() => run(onInsertFile)}>
        <Paperclip size={15} />
        {t('richEditor.importFile')}
      </button>
    </div>
  );

  return createPortal(menuEl, document.body);
}
