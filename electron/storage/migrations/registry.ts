import type { Migration } from './types';
import { migration001 } from './versions/001_initial';
import { migration002 } from './versions/002_notes_pinned';

/** Daftar migrasi berurutan — impor dari versions/; tambah file baru di akhir */
export const MIGRATIONS: Migration[] = [migration001, migration002];

export const LATEST_MIGRATION_VERSION = MIGRATIONS[MIGRATIONS.length - 1]?.version ?? 0;
