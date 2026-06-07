import type { TranslateFn } from '../i18n/translator';

/** Nama grup default saat bootstrap / migrasi — diterjemahkan di UI, tidak diubah di disk. */
export const DEFAULT_KANBAN_GROUP_NAME = 'Grup utama';
export const LEGACY_KANBAN_GROUP_NAME = 'Papan utama';

const DEFAULT_GROUP_NAMES = new Set([DEFAULT_KANBAN_GROUP_NAME, LEGACY_KANBAN_GROUP_NAME]);

const LEGACY_COLUMN_KEYS: Record<string, string> = {
  Belum: 'kanban.colTodo',
  Sedang: 'kanban.colDoing',
  Selesai: 'kanban.colDone',
};

export function isDefaultKanbanGroupName(name: string): boolean {
  return DEFAULT_GROUP_NAMES.has(name);
}

export function getKanbanGroupDisplayName(name: string, t: TranslateFn): string {
  if (isDefaultKanbanGroupName(name)) return t('kanban.defaultGroup');
  return name;
}

export function getKanbanColumnDisplayName(name: string, t: TranslateFn): string {
  const legacyKey = LEGACY_COLUMN_KEYS[name];
  if (legacyKey) return t(legacyKey);

  const idMatch = name.match(/^Kolom (\d+)$/);
  if (idMatch) return t('kanban.columnDefault', { n: idMatch[1] });

  const enMatch = name.match(/^Column (\d+)$/i);
  if (enMatch) return t('kanban.columnDefault', { n: enMatch[1] });

  return name;
}
