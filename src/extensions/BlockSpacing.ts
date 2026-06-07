import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

/** Blok yang perlu baris teks kosong setelah / di antara blok lain */
const ISOLATED_BLOCKS = new Set([
  'codeBlock',
  'image',
  'horizontalRule',
  'noteAttachment',
]);

/**
 * Sisipkan paragraf kosong di antara blok (mis. JSON lalu gambar)
 * agar bisa klik dan mengetik di tengah.
 */
export const BlockSpacing = Extension.create({
  name: 'blockSpacing',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blockSpacing'),
        appendTransaction: (_transactions, _oldState, newState) => {
          const { doc, schema } = newState;
          const paragraph = schema.nodes.paragraph;
          if (!paragraph) return null;

          const insertAt: number[] = [];
          let pos = 0;

          for (let i = 0; i < doc.childCount; i++) {
            const node = doc.child(i);
            if (i > 0) {
              const prev = doc.child(i - 1);
              if (ISOLATED_BLOCKS.has(prev.type.name) && node.type.name !== 'paragraph') {
                insertAt.push(pos);
              }
            }
            pos += node.nodeSize;
          }

          const last = doc.lastChild;
          if (last && ISOLATED_BLOCKS.has(last.type.name)) {
            insertAt.push(doc.content.size);
          }

          if (insertAt.length === 0) return null;

          let tr = newState.tr;
          for (let i = insertAt.length - 1; i >= 0; i--) {
            tr = tr.insert(insertAt[i], paragraph.create());
          }
          return tr;
        },
      }),
    ];
  },
});
