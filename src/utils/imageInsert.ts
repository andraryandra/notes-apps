import type { Editor } from '@tiptap/react';
import { mimeToExt } from './clipboardImage';
import { isImageFile, readFileAsDataUrl } from './imageFiles';
import { fileIdFromStoredUrl } from './storedUrl';
import { insertContentAtDrop } from './editorDropInsert';

function extFromName(name: string): string {
  const m = name.match(/\.(\w+)$/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'png';
}

function getApi() {
  if (typeof window === 'undefined' || !window.electronAPI) {
    throw new Error('electronAPI tidak tersedia — jalankan dengan npm run dev (Electron)');
  }
  return window.electronAPI;
}

export interface InsertImageRange {
  from: number;
  to: number;
}

/** Tangkap posisi kursor/seleksi — panggil sinkron saat event paste, sebelum await */
export function captureInsertRange(editor: Editor): InsertImageRange {
  const { from, to } = editor.state.selection;
  return { from, to };
}

function insertImageAtRange(
  editor: Editor,
  imageContent: Record<string, unknown>,
  range: InsertImageRange
): boolean {
  const max = editor.state.doc.content.size;
  let from = Math.max(0, Math.min(range.from, max));
  const to = Math.max(from, Math.min(range.to, max));

  let chain = editor.chain().focus();
  if (to > from) {
    chain = chain.deleteRange({ from, to });
  }

  const ok = chain.insertContentAt(from, imageContent).scrollIntoView().run();
  if (!ok) return false;

  let imagePos: number | null = null;
  editor.state.doc.nodesBetween(
    from,
    Math.min(from + 64, editor.state.doc.content.size),
    (node, pos) => {
      if (node.type.name === 'image' && imagePos === null) {
        imagePos = pos;
        return false;
      }
    }
  );

  if (imagePos != null) {
    editor.chain().focus().setNodeSelection(imagePos).scrollIntoView().run();
    requestAnimationFrame(() => {
      const dom = editor.view.nodeDOM(imagePos!);
      if (dom instanceof HTMLElement) {
        dom.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    });
  }

  return true;
}

/** Simpan gambar ke disk lalu sisipkan ke editor TipTap */
export async function persistAndInsertImage(
  editor: Editor | null,
  source: { file?: File; filePath?: string; storedUrl?: string },
  dropEvent?: DragEvent,
  insertRange?: InsertImageRange
): Promise<boolean> {
  if (!editor) return false;

  const savedRange: InsertImageRange = insertRange ?? captureInsertRange(editor);

  try {
    const api = getApi();
    let storedUrl: string | null = source.storedUrl ?? null;

    if (!storedUrl && source.filePath) {
      storedUrl = await api.copyImageFromPath(source.filePath);
    }

    if (!storedUrl && source.file) {
      const file = source.file;
      let filePath = source.filePath;
      if (!filePath) {
        try {
          filePath = api.getPathForFile(file);
        } catch {
          filePath = (file as File & { path?: string }).path;
        }
      }

      if (filePath) {
        storedUrl = await api.copyImageFromPath(filePath);
      } else if (isImageFile(file)) {
        const base64 = await readFileAsDataUrl(file);
        const ext = file.type ? mimeToExt(file.type) : extFromName(file.name);
        storedUrl = await api.saveImageBuffer(base64, ext);
      }
    }

    if (!storedUrl) {
      console.warn('[imageInsert] Tidak ada URL gambar setelah simpan');
      return false;
    }

    const displaySrc = (await api.resolveImage(storedUrl)) || storedUrl;
    const fileId = fileIdFromStoredUrl(storedUrl);

    const imageContent = {
      type: 'image',
      attrs: {
        src: displaySrc,
        storedSrc: storedUrl,
        fileId,
        width: '100%',
        caption: '',
      },
    };

    if (dropEvent) {
      return insertContentAtDrop(editor, dropEvent, imageContent);
    }

    return insertImageAtRange(editor, imageContent, savedRange);
  } catch (err) {
    console.error('[imageInsert] Gagal menyisipkan gambar:', err);
    return false;
  }
}
