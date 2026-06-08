import Table from '@tiptap/extension-table';

export type TableBorderWidth = '0' | '1' | '2' | '3';
export type TableBorderStyle = 'solid' | 'dashed' | 'dotted';

export const NoteTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderWidth: {
        default: '1',
        parseHTML: (element) => element.getAttribute('data-border-width') ?? '1',
        renderHTML: (attributes) => {
          const w = attributes.borderWidth as string | undefined;
          if (!w || w === '1') return {};
          return { 'data-border-width': w };
        },
      },
      borderStyle: {
        default: 'solid',
        parseHTML: (element) => element.getAttribute('data-border-style') ?? 'solid',
        renderHTML: (attributes) => {
          const s = attributes.borderStyle as string | undefined;
          if (!s || s === 'solid') return {};
          return { 'data-border-style': s };
        },
      },
    };
  },
});
