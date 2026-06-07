import type { Editor } from '@tiptap/core';
import { getImageFilesFromDataTransfer, isImageFile } from './imageFiles';
import { persistAndInsertImage } from './imageInsert';
import { saveAttachmentFromFile } from './attachmentInsert';
import { insertContentAtDrop } from './editorDropInsert';

const ATTACHMENT_EXT = new Set([
  'pdf',
  'doc',
  'docx',
  'odt',
  'rtf',
  'xls',
  'xlsx',
  'xlsm',
  'csv',
  'ods',
  'txt',
  'md',
  'json',
  'xml',
  'html',
  'htm',
  'zip',
  'rar',
  '7z',
]);

const ATTACHMENT_MIME_PREFIXES = [
  'application/pdf',
  'application/msword',
  'application/vnd.',
  'application/vnd.openxmlformats',
  'text/',
];

export function isAttachmentFile(file: File): boolean {
  if (isImageFile(file)) return false;
  const name = file.name.toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop()! : '';
  if (ATTACHMENT_EXT.has(ext)) return true;
  if (file.type && ATTACHMENT_MIME_PREFIXES.some((p) => file.type.startsWith(p))) return true;
  return Boolean(file.type && !file.type.startsWith('image/'));
}

export function getAttachmentFilesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data?.files?.length) return [];
  return Array.from(data.files).filter(isAttachmentFile);
}

/** Tangani drag-drop file (gambar + PDF/Word/Excel/dll.) ke editor */
export async function processEditorFileDrop(
  editor: Editor,
  dataTransfer: DataTransfer | null,
  dropEvent?: DragEvent
): Promise<boolean> {
  if (!dataTransfer?.files?.length || !window.electronAPI) return false;

  const imageFiles = getImageFilesFromDataTransfer(dataTransfer);
  const attachmentFiles = getAttachmentFilesFromDataTransfer(dataTransfer);

  if (imageFiles.length === 0 && attachmentFiles.length === 0) return false;

  if (imageFiles[0]) {
    await persistAndInsertImage(editor, { file: imageFiles[0] }, dropEvent);
  }

  const attachmentNodes: Record<string, unknown>[] = [];
  for (const file of attachmentFiles) {
    const meta = await saveAttachmentFromFile(file);
    if (meta) {
      attachmentNodes.push({
        type: 'noteAttachment',
        attrs: {
          fileId: meta.fileId,
          storedUrl: meta.storedUrl,
          fileName: meta.fileName,
          fileKind: meta.fileKind,
          mimeType: meta.mimeType,
          size: meta.size,
        },
      });
    }
  }

  if (attachmentNodes.length) {
    if (dropEvent) {
      insertContentAtDrop(editor, dropEvent, attachmentNodes);
    } else {
      for (const node of attachmentNodes) {
        editor.chain().focus().insertContent(node).run();
      }
    }
  }

  return true;
}
