import { useCallback } from 'react';
import type { Editor } from '@tiptap/react';
import { useI18n } from '../i18n/useI18n';
import { useToast } from './useToast';
import { getEditorSelectionPlainText } from '../utils/editorPlainText';
import { sanitizePastedHtml } from '../utils/pasteHtml';

export function useEditorQuickActions(editor: Editor | null) {
  const { t } = useI18n();
  const { showSuccess } = useToast();

  const hasSelection = Boolean(editor && !editor.state.selection.empty);

  const copy = useCallback(async () => {
    if (!editor) return false;
    const text = getEditorSelectionPlainText(editor, {
      image: t('richEditor.plainImage'),
      attachment: t('richEditor.plainAttachment'),
    });
    if (!text) return false;
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(t('richEditor.selectionCopied'));
      return true;
    } catch {
      showSuccess(t('richEditor.copyFailed'));
      return false;
    }
  }, [editor, showSuccess, t]);

  const paste = useCallback(async () => {
    if (!editor) return false;
    try {
      let pasted = false;
      if (navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const html = await (await item.getType('text/html')).text();
            if (html.trim()) {
              editor.chain().focus().insertContent(sanitizePastedHtml(html)).run();
              pasted = true;
              break;
            }
          }
        }
      }
      if (!pasted) {
        const text = await navigator.clipboard.readText();
        if (text) {
          editor.chain().focus().insertContent(text).run();
          pasted = true;
        }
      }
      if (pasted) showSuccess(t('richEditor.selectionPasted'));
      else showSuccess(t('richEditor.selectionPasteEmpty'));
      return pasted;
    } catch {
      showSuccess(t('richEditor.selectionPasteFailed'));
      return false;
    }
  }, [editor, showSuccess, t]);

  const cut = useCallback(async () => {
    if (!editor || editor.state.selection.empty) return;
    const ok = await copy();
    if (ok) editor.chain().focus().deleteSelection().run();
  }, [copy, editor]);

  const deleteSelection = useCallback(() => {
    if (!editor || editor.state.selection.empty) return;
    editor.chain().focus().deleteSelection().run();
  }, [editor]);

  const selectAll = useCallback(() => {
    editor?.chain().focus().selectAll().run();
  }, [editor]);

  return {
    hasSelection,
    copy,
    paste,
    cut,
    deleteSelection,
    selectAll,
  };
}
