import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/core';
import { getClipboardImageFile, fileFromHtmlClipboard } from '../utils/clipboardImage';
import { clipboardHasImageType } from '../utils/imageFiles';
import { shouldPasteAsImageOnly } from '../utils/pasteHtml';
import { captureInsertRange, persistAndInsertImage } from '../utils/imageInsert';

export type ImagePasteDropOptions = {
  /** Dipanggil saat extension butuh instance editor terbaru */
  getEditor: () => Editor | null;
};

/**
 * TipTap plugin: paste gambar di level ProseMirror.
 * Satu handler — hindari duplikasi dengan onPasteCapture di RichEditor.
 */
export const ImagePasteDrop = Extension.create<ImagePasteDropOptions>({
  name: 'imagePasteDrop',
  priority: 1200,

  addOptions() {
    return {
      getEditor: () => null,
    };
  },

  addProseMirrorPlugins() {
    const getEditor = this.options.getEditor;
    let pasteBusy = false;

    const handleImagePaste = (event: ClipboardEvent): boolean => {
      const editor = getEditor();
      const data = event.clipboardData;
      if (!editor || !data) return false;

      if (!shouldPasteAsImageOnly(data)) return false;
      if (pasteBusy) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }

      const insertRange = captureInsertRange(editor);

      const file = getClipboardImageFile(data);
      if (file) {
        event.preventDefault();
        event.stopPropagation();
        pasteBusy = true;
        void persistAndInsertImage(editor, { file }, undefined, insertRange).finally(() => {
          pasteBusy = false;
        });
        return true;
      }

      if (clipboardHasImageType(data)) {
        event.preventDefault();
        event.stopPropagation();
        pasteBusy = true;
        void window.electronAPI
          ?.readClipboardImage()
          .then((stored) => {
            if (stored) {
              return persistAndInsertImage(editor, { storedUrl: stored }, undefined, insertRange);
            }
            return false;
          })
          .finally(() => {
            pasteBusy = false;
          });
        return true;
      }

      const html = data.getData('text/html');
      if (html?.includes('data:image/')) {
        event.preventDefault();
        event.stopPropagation();
        pasteBusy = true;
        void fileFromHtmlClipboard(html)
          .then((htmlFile) => {
            if (htmlFile) {
              return persistAndInsertImage(editor, { file: htmlFile }, undefined, insertRange);
            }
            return false;
          })
          .finally(() => {
            pasteBusy = false;
          });
        return true;
      }

      return false;
    };

    return [
      new Plugin({
        key: new PluginKey('imagePasteDrop'),
        props: {
          handlePaste: (_view, event) => handleImagePaste(event),
        },
      }),
    ];
  },
});
