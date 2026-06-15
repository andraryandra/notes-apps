/** Konstanta penyimpanan & infinite scroll */

export const SCROLL_BATCH_SIZES = [15, 25, 50] as const;

export type ScrollBatchSize = (typeof SCROLL_BATCH_SIZES)[number];

export const DEFAULT_SCROLL_BATCH_SIZE: ScrollBatchSize = 25;

export function isScrollBatchSize(value: unknown): value is ScrollBatchSize {
  return typeof value === 'number' && (SCROLL_BATCH_SIZES as readonly number[]).includes(value);
}

export const SQLITE_DB_NAME = 'notes.db';

export interface NoteTemplate {
  id: string;
  titleKey: string;
  title: string;
  content: string;
}

const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'blank',
    titleKey: 'noteTemplates.blank',
    title: 'Catatan tanpa judul',
    content: '',
  },
  {
    id: 'meeting',
    titleKey: 'noteTemplates.meeting',
    title: 'Catatan rapat',
    content:
      '<h2>Agenda</h2><ul><li></li></ul><h2>Catatan</h2><p></p><h2>Tindak lanjut</h2><ul><li></li></ul>',
  },
  {
    id: 'journal',
    titleKey: 'noteTemplates.journal',
    title: 'Jurnal harian',
    content: '<h2>Hari ini</h2><p>Apa yang berjalan baik?</p><p>Apa yang bisa diperbaiki?</p>',
  },
  {
    id: 'research',
    titleKey: 'noteTemplates.research',
    title: 'Catatan riset',
    content:
      '<h2>Hipotesis</h2><p></p><h2>Metode</h2><p></p><h2>Temuan</h2><p></p><h2>Kesimpulan</h2><p></p>',
  },
];

export function listNoteTemplates(): NoteTemplate[] {
  return NOTE_TEMPLATES;
}

export function getNoteTemplate(id: string): NoteTemplate {
  return NOTE_TEMPLATES.find((t) => t.id === id) ?? NOTE_TEMPLATES[0];
}
