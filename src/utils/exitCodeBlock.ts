import type { Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

/** Keluar dari code block → paragraf baru di bawah (atau fokus ke paragraf yang sudah ada) */
export function exitBelowCodeBlock(editor: Editor): boolean {
  if (!editor.isActive('codeBlock')) return false;

  const { $from } = editor.state.selection;
  if ($from.parent.type.name !== 'codeBlock') return false;

  const posAfter = $from.after();
  const next = editor.state.doc.nodeAt(posAfter);

  if (next?.type.name === 'paragraph') {
    const inside = posAfter + 1;
    return editor.chain().focus().setTextSelection(inside).run();
  }

  return editor
    .chain()
    .insertContentAt(posAfter, { type: 'paragraph' })
    .focus()
    .setTextSelection(posAfter + 1)
    .run();
}

/** ArrowDown di akhir code block saat node berikutnya bukan paragraf */
export function arrowDownFromCodeBlock(editor: Editor): boolean {
  if (!editor.isActive('codeBlock')) return false;

  const { $from, empty } = editor.state.selection;
  if (!empty || $from.parent.type.name !== 'codeBlock') return false;

  const atEnd = $from.parentOffset >= $from.parent.content.size - 1;
  if (!atEnd) return false;

  const posAfter = $from.after();
  const next = editor.state.doc.nodeAt(posAfter);

  if (!next) {
    return editor.commands.exitCode();
  }

  if (next.type.name === 'paragraph') {
    return editor
      .chain()
      .command(({ tr, dispatch }) => {
        if (dispatch) {
          tr.setSelection(TextSelection.near(tr.doc.resolve(posAfter + 1)));
        }
        return true;
      })
      .run();
  }

  return exitBelowCodeBlock(editor);
}
