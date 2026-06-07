import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/** Dragover untuk file — drop ditangani di RichEditor (onDropCapture) */
export const FilePasteDrop = Extension.create({
  name: 'filePasteDrop',
  priority: 1100,

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('filePasteDrop'),
        props: {
          handleDOMEvents: {
            dragover: (_view, event) => {
              const dt = (event as DragEvent).dataTransfer;
              if (!dt?.types?.includes('Files')) return false;
              event.preventDefault();
              dt.dropEffect = 'copy';
              return true;
            },
            dragenter: (_view, event) => {
              const dt = (event as DragEvent).dataTransfer;
              if (!dt?.types?.includes('Files')) return false;
              event.preventDefault();
              return true;
            },
          },
        },
      }),
    ];
  },
});
