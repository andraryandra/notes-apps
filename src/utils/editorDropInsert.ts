import type { Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

const SNAP_BLOCK_TYPES = new Set(['noteAttachment', 'image', 'codeBlock']);

/** Posisi sisip aman — tidak mengganti blok atom (attachment, gambar, dll.) */
export function resolveDropInsertPos(editor: Editor, event: DragEvent): number {
  const { view, state } = editor;
  const found = view.posAtCoords({ left: event.clientX, top: event.clientY });

  if (!found) {
    return state.doc.content.size;
  }

  let pos = found.pos;
  const $pos = state.doc.resolve(pos);

  for (let depth = $pos.depth; depth >= 0; depth--) {
    const node = $pos.node(depth);
    if (!node.isBlock || !SNAP_BLOCK_TYPES.has(node.type.name)) continue;

    const nodePos = depth === 0 ? 0 : $pos.before(depth);
    const dom = view.nodeDOM(nodePos);

    if (dom instanceof HTMLElement) {
      const rect = dom.getBoundingClientRect();
      const insertBefore = event.clientY < rect.top + rect.height / 2;
      return insertBefore ? nodePos : nodePos + node.nodeSize;
    }

    return nodePos + node.nodeSize;
  }

  return pos;
}

/** Koordinat garis indikator drop (relatif ke editor-content-wrap) */
export function resolveDropMarker(
  editor: Editor,
  event: DragEvent,
  container: HTMLElement
): { top: number; left: number; width: number } | null {
  const pos = resolveDropInsertPos(editor, event);
  const coords = editor.view.coordsAtPos(pos);
  const wrap = container.getBoundingClientRect();

  return {
    top: coords.top - wrap.top + container.scrollTop,
    left: 12,
    width: Math.max(0, wrap.width - 24),
  };
}

function focusTextAt(editor: Editor, pos: number): void {
  const max = editor.state.doc.content.size;
  const safe = Math.max(0, Math.min(pos, max));
  const tr = editor.state.tr.setSelection(TextSelection.create(editor.state.doc, safe));
  editor.view.dispatch(tr);
  editor.view.focus();
}

/** Fokus editor di posisi terdekat koordinat klik (area kosong di bawah konten) */
export function focusAtClientCoords(editor: Editor, x: number, y: number): boolean {
  const found = editor.view.posAtCoords({ left: x, top: y });
  if (!found) {
    editor.chain().focus('end').run();
    return false;
  }
  focusTextAt(editor, found.pos);
  return true;
}

export function insertContentAtDrop(
  editor: Editor,
  event: DragEvent,
  content: Record<string, unknown> | Record<string, unknown>[]
): boolean {
  const pos = resolveDropInsertPos(editor, event);
  focusTextAt(editor, pos);
  return editor.chain().insertContentAt(pos, content).run();
}
