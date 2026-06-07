import { BubbleMenu, type Editor } from '@tiptap/react';
import { isNodeSelection, isTextSelection } from '@tiptap/core';
import { ClipboardCopy, ClipboardPaste, Trash2, ImagePlus, Paperclip } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { useEditorQuickActions } from '../hooks/useEditorQuickActions';
import './EditorSelectionBubble.css';

interface Props {
  editor: Editor;
  onInsertImage: () => void;
  onInsertFile: () => void;
}

export function EditorSelectionBubble({ editor, onInsertImage, onInsertFile }: Props) {
  const { t } = useI18n();
  const { copy, paste, deleteSelection } = useEditorQuickActions(editor);

  return (
    <BubbleMenu
      editor={editor}
      className="editor-selection-bubble"
      tippyOptions={{
        duration: 120,
        placement: 'top',
        zIndex: 10060,
        maxWidth: 'none',
      }}
      updateDelay={80}
      shouldShow={({ editor: ed, from, to }) => {
        if (from === to) return false;
        const { selection } = ed.state;
        if (isNodeSelection(selection)) return false;
        if (!isTextSelection(selection)) return false;
        if (ed.isActive('image') || ed.isActive('noteAttachment')) return false;
        return true;
      }}
    >
      <div className="editor-selection-bubble-inner" onMouseDown={(e) => e.preventDefault()}>
        <button type="button" onClick={() => void copy()} title={t('richEditor.selectionCopy')}>
          <ClipboardCopy size={16} />
          <span>{t('richEditor.selectionCopyShort')}</span>
        </button>
        <button type="button" onClick={() => void paste()} title={t('richEditor.selectionPaste')}>
          <ClipboardPaste size={16} />
          <span>{t('richEditor.selectionPasteShort')}</span>
        </button>
        <button
          type="button"
          className="is-danger"
          onClick={deleteSelection}
          title={t('richEditor.selectionDelete')}
        >
          <Trash2 size={16} />
          <span>{t('richEditor.selectionDeleteShort')}</span>
        </button>
        <span className="editor-selection-bubble-divider" aria-hidden />
        <button type="button" onClick={onInsertImage} title={t('richEditor.uploadImage')}>
          <ImagePlus size={16} />
        </button>
        <button type="button" onClick={onInsertFile} title={t('richEditor.importFile')}>
          <Paperclip size={16} />
        </button>
      </div>
    </BubbleMenu>
  );
}
