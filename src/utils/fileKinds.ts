export type FileKind = 'pdf' | 'word' | 'excel' | 'image' | 'text' | 'other';

export function kindLabel(kind: FileKind): string {
  switch (kind) {
    case 'pdf':
      return 'PDF';
    case 'word':
      return 'Word';
    case 'excel':
      return 'Excel';
    case 'image':
      return 'Gambar';
    case 'text':
      return 'Teks';
    default:
      return 'File';
  }
}
