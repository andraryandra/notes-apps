import path from 'path';

/** Nama file di disk — {uuid}{ext}, tanpa spasi */
export function diskNameFromId(fileId: string, originalFileName: string): string {
  const ext = path.extname(originalFileName).toLowerCase().replace(/[^a-z0-9.]/g, '');
  return `${fileId}${ext}`;
}

export function originalDisplayName(filePathOrName: string): string {
  return path.basename(filePathOrName);
}
