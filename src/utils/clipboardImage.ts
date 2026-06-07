/** Ambil file gambar dari ClipboardEvent / DataTransfer (copy gambar, screenshot, dll.) */

import { isImageFile } from './imageFiles';

export function mimeToExt(mime: string): string {
  const normalized = mime.toLowerCase();
  if (normalized === 'image/jpeg' || normalized === 'image/jpg') return 'jpg';
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/gif') return 'gif';
  if (normalized === 'image/webp') return 'webp';
  if (normalized === 'image/svg+xml') return 'svg';
  const part = normalized.split('/')[1];
  return part?.replace('+xml', '') || 'png';
}

export function getClipboardImageFile(data: DataTransfer | null): File | null {
  if (!data) return null;

  if (data.files?.length) {
    for (let i = 0; i < data.files.length; i++) {
      const file = data.files[i];
      if (isImageFile(file)) return file;
    }
  }

  if (data.items?.length) {
    for (const item of Array.from(data.items)) {
      if (item.kind !== 'file') continue;
      const file = item.getAsFile();
      if (file && isImageFile(file)) return file;
    }
    for (const item of Array.from(data.items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) return file;
      }
    }
  }

  return null;
}

/** Clipboard berisi gambar tapi File tidak tersedia (umum di Linux / screenshot) */
export function clipboardLooksLikeImageOnly(data: DataTransfer | null): boolean {
  if (!data) return false;
  const types = Array.from(data.types || []);
  const hasImage = types.some((t) => t === 'image/png' || t === 'image/jpeg' || t.startsWith('image/'));
  if (!hasImage) return false;
  const plain = data.getData('text/plain')?.trim() ?? '';
  const html = data.getData('text/html')?.trim() ?? '';
  return !plain && !html;
}

export async function fileFromDataUrl(dataUrl: string): Promise<File | null> {
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if (!blob.type.startsWith('image/')) return null;
    return new File([blob], `paste.${mimeToExt(blob.type)}`, { type: blob.type });
  } catch {
    return null;
  }
}

export async function fileFromHtmlClipboard(html: string): Promise<File | null> {
  const match = html.match(/<img[^>]+src=["'](data:image\/[^"']+)["']/i);
  if (!match?.[1]) return null;
  return fileFromDataUrl(match[1]);
}
