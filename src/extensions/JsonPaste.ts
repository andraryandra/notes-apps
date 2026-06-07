import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/core';
import { tryFormatJson } from '../utils/pasteJson';
import { clipboardHasRichHtml, shouldPasteAsImageOnly } from '../utils/pasteHtml';
import { getClipboardImageFile } from '../utils/clipboardImage';

export type JsonPasteOptions = {
  getEditor: () => Editor | null;
};

/** Paste JSON → blok kode terformat (indent 2 spasi) */
export const JsonPaste = Extension.create<JsonPasteOptions>({
  name: 'jsonPaste',

  addOptions() {
    return { getEditor: () => null };
  },

  addProseMirrorPlugins() {
    const getEditor = this.options.getEditor;

    const handleJsonPaste = (event: ClipboardEvent): boolean => {
      const editor = getEditor();
      const data = event.clipboardData;
      if (!editor || !data) return false;

      if (clipboardHasRichHtml(data)) return false;
      if (shouldPasteAsImageOnly(data) && getClipboardImageFile(data)) return false;

      const plain = data.getData('text/plain');
      if (!plain?.trim()) return false;

      const formatted = tryFormatJson(plain);
      if (!formatted) return false;

      event.preventDefault();
      event.stopPropagation();

      editor
        .chain()
        .focus()
        .insertContent([
          {
            type: 'codeBlock',
            attrs: { language: 'json' },
            content: [{ type: 'text', text: formatted }],
          },
          { type: 'paragraph' },
        ])
        .focus('end')
        .run();

      return true;
    };

    return [
      new Plugin({
        key: new PluginKey('jsonPaste'),
        props: {
          handlePaste: (_view, event) => handleJsonPaste(event),
          handleDOMEvents: {
            paste: (_view, event) => handleJsonPaste(event as ClipboardEvent),
          },
        },
      }),
    ];
  },
});
