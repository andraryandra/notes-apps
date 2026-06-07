import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AttachmentCardView } from '../components/AttachmentCardView';
import type { FileKind } from '../utils/fileKinds';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteAttachment: {
      insertAttachment: (attrs: {
        fileId: string;
        storedUrl: string;
        fileName: string;
        fileKind: FileKind;
        mimeType: string;
        size: number;
      }) => ReturnType;
    };
  }
}

export const NoteAttachment = Node.create({
  name: 'noteAttachment',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      storedUrl: { default: null },
      fileId: { default: null },
      fileName: { default: 'file' },
      fileKind: { default: 'other' as FileKind },
      mimeType: { default: 'application/octet-stream' },
      size: { default: 0 },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-note-attachment]',
        getAttrs: (node) => {
          const el = node as HTMLElement;
          return {
            storedUrl: el.getAttribute('data-stored-url'),
            fileId: el.getAttribute('data-file-id'),
            fileName: el.getAttribute('data-file-name') || 'file',
            fileKind: (el.getAttribute('data-file-kind') || 'other') as FileKind,
            mimeType: el.getAttribute('data-mime-type') || '',
            size: parseInt(el.getAttribute('data-size') || '0', 10),
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    return [
      'div',
      mergeAttributes({
        'data-note-attachment': '',
        'data-stored-url': node.attrs.storedUrl,
        'data-file-id': node.attrs.fileId,
        'data-file-name': node.attrs.fileName,
        'data-file-kind': node.attrs.fileKind,
        'data-mime-type': node.attrs.mimeType,
        'data-size': String(node.attrs.size),
        class: 'note-attachment-block',
      }),
      node.attrs.fileName,
    ];
  },

  addCommands() {
    return {
      insertAttachment:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(AttachmentCardView);
  },
});
