/** Ubah data URL ke Blob tanpa fetch (hindari CSP / Failed to fetch di Electron) */
export function dataUrlToBlob(dataUrl: string, mimeType: string): Blob {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) {
    throw new Error('Data URL tidak valid');
  }
  const base64 = dataUrl.slice(comma + 1);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export function revokePreviewUrl(url: string | null) {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
