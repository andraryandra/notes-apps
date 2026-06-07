import type { Editor } from '@tiptap/core';
import type { AttachmentMeta } from '../types';
import { insertContentAtDrop } from './editorDropInsert';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1]! : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Simpan file lampiran dari drag/drop atau File picker */
export async function saveAttachmentFromFile(file: File): Promise<AttachmentMeta | null> {
  if (!window.electronAPI) return null;

  try {
    const filePath = window.electronAPI.getPathForFile(file);
    if (filePath) {
      const meta = await window.electronAPI.copyAttachmentFromPath(filePath);
      if (meta) return meta;
    }
  } catch {
    /* fallback buffer */
  }

  try {
    const base64 = await fileToBase64(file);
    return await window.electronAPI.saveAttachmentBuffer(base64, file.name || 'file');
  } catch {
    return null;
  }
}

export function insertAttachmentMeta(
  editor: Editor,
  meta: AttachmentMeta,
  dropEvent?: DragEvent
): void {
  const content = {
    type: 'noteAttachment',
    attrs: {
      fileId: meta.fileId,
      storedUrl: meta.storedUrl,
      fileName: meta.fileName,
      fileKind: meta.fileKind,
      mimeType: meta.mimeType,
      size: meta.size,
    },
  };

  if (dropEvent) {
    insertContentAtDrop(editor, dropEvent, content);
    return;
  }

  editor.chain().focus().insertContent(content).run();
}

export async function persistAndInsertAttachment(
  editor: Editor,
  filePath: string
): Promise<boolean> {
  if (!window.electronAPI) return false;
  const meta = await window.electronAPI.copyAttachmentFromPath(filePath);
  if (!meta) return false;
  insertAttachmentMeta(editor, meta);
  return true;
}

export async function insertAttachmentFromPick(editor: Editor): Promise<boolean> {
  if (!window.electronAPI) return false;
  const metas = await window.electronAPI.pickAttachments();
  if (!metas.length) return false;

  for (const meta of metas) {
    insertAttachmentMeta(editor, meta);
  }
  return true;
}
