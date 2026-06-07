/** Deteksi file gambar — di Linux type sering kosong saat drag-drop */

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i;

export function isImageFile(file: File): boolean {
  if (file.type?.startsWith('image/')) return true;
  if (file.name && IMAGE_EXT.test(file.name)) return true;
  const path = (file as File & { path?: string }).path;
  if (path && IMAGE_EXT.test(path)) return true;
  return false;
}

export function getImageFilesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data) return [];
  const out: File[] = [];
  if (data.files?.length) {
    for (let i = 0; i < data.files.length; i++) {
      const file = data.files[i];
      if (isImageFile(file)) out.push(file);
    }
  }
  if (out.length === 0 && data.items?.length) {
    for (const item of Array.from(data.items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file && isImageFile(file)) out.push(file);
      }
    }
  }
  return out;
}

export function clipboardHasImageType(data: DataTransfer | null): boolean {
  if (!data) return false;
  return Array.from(data.types || []).some(
    (t) => t.startsWith('image/') || t === 'image/png' || t === 'image/jpeg'
  );
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
