import type { Migration } from './types';
import { migration001 } from './versions/001_initial';
import { migration002 } from './versions/002_notes_pinned';
import { migration003 } from './versions/003_kanban_card_tags';
import { migration004 } from './versions/004_kanban_column_color';

/** Daftar migrasi berurutan — impor dari versions/; tambah file baru di akhir */
export const MIGRATIONS: Migration[] = [migration001, migration002, migration003, migration004];

export const LATEST_MIGRATION_VERSION = MIGRATIONS[MIGRATIONS.length - 1]?.version ?? 0;
