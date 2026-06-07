/** Deteksi & format JSON dari clipboard (paste Ctrl+V) */

export function looksLikeJson(text: string): boolean {
  const t = text.trim();
  if (t.length < 2) return false;
  return t.startsWith('{') || t.startsWith('[');
}

/** Parse & indent 2 spasi; null jika bukan JSON valid */
export function tryFormatJson(text: string): string | null {
  const trimmed = text.trim();
  if (!looksLikeJson(trimmed)) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return null;
  }
}
