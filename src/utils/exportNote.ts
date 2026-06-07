import type { NoteExportFormat, NoteExportResult } from '../types';
import { htmlToPlainText } from './editorPlainText';

export { htmlToPlainText, getEditorPlainText, getEditorSelectionPlainText } from './editorPlainText';
export type { EditorPlainTextLabels } from './editorPlainText';

export async function copyNotePlain(title: string, plainBody: string): Promise<void> {
  const body = plainBody.trim();
  const text = title ? `${title}\n\n${body}` : body;
  await navigator.clipboard.writeText(text);
}

export async function copyNotePlainFromHtml(title: string, html: string): Promise<void> {
  await copyNotePlain(title, htmlToPlainText(html));
}

export async function copyNoteHtml(title: string, html: string): Promise<void> {
  const doc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>${html}</body></html>`;
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([doc], { type: 'text/html' }),
      'text/plain': new Blob([htmlToPlainText(html)], { type: 'text/plain' }),
    }),
  ]);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function exportNoteFile(
  title: string,
  content: string,
  format: NoteExportFormat
): Promise<NoteExportResult> {
  if (!window.electronAPI) {
    return { ok: false, error: 'Ekspor hanya tersedia di aplikasi desktop' };
  }
  const plainText = title ? `${title}\n\n${htmlToPlainText(content)}` : htmlToPlainText(content);
  return window.electronAPI.exportNote({ title, content, plainText, format });
}

/** Urutkan: pin di atas, lalu terbaru diubah */
export function sortNotesForList<T extends { pinned?: boolean; updatedAt: number }>(notes: T[]): T[] {
  return [...notes].sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return b.updatedAt - a.updatedAt;
  });
}
