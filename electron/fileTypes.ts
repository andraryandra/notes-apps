export type FileKind = 'pdf' | 'word' | 'excel' | 'image' | 'text' | 'other';

const EXT_KIND: Record<string, FileKind> = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  odt: 'word',
  rtf: 'word',
  xls: 'excel',
  xlsx: 'excel',
  xlsm: 'excel',
  csv: 'excel',
  ods: 'excel',
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  gif: 'image',
  webp: 'image',
  svg: 'image',
  bmp: 'image',
  txt: 'text',
  md: 'text',
  json: 'text',
  xml: 'text',
  html: 'text',
  htm: 'text',
};

const MIME_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  txt: 'text/plain',
  md: 'text/markdown',
  json: 'application/json',
};

export function getExt(fileName: string): string {
  const i = fileName.lastIndexOf('.');
  return i >= 0 ? fileName.slice(i + 1).toLowerCase() : '';
}

export function getFileKind(fileName: string): FileKind {
  return EXT_KIND[getExt(fileName)] ?? 'other';
}

export function getMime(fileName: string): string {
  const ext = getExt(fileName);
  return MIME_MAP[ext] || 'application/octet-stream';
}

export const ATTACHMENT_FILTER = {
  name: 'Dokumen & file',
  extensions: [
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
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'svg',
    'zip',
    'rar',
    '7z',
  ],
};
