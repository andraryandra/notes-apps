import type Database from 'better-sqlite3';
import {
  bootstrapLegacyMigrations,
  ensureMigrationsTable,
  getAppliedVersion,
  recordMigration,
} from './helpers';
import { MIGRATIONS } from './registry';

export { LATEST_MIGRATION_VERSION, MIGRATIONS } from './registry';
export type { Migration } from './types';

/**
 * Jalankan migrasi DB yang belum di-apply.
 * Aman untuk DB baru maupun production yang sudah ada (bootstrap legacy).
 */
export function runMigrations(db: Database.Database): void {
  ensureMigrationsTable(db);

  let applied = getAppliedVersion(db);
  if (applied == null) {
    applied = bootstrapLegacyMigrations(db, MIGRATIONS);
  }

  const pending = MIGRATIONS.filter((m) => m.version > applied!);
  if (pending.length === 0) return;

  const tx = db.transaction(() => {
    for (const migration of pending) {
      migration.up(db);
      recordMigration(db, migration);
    }
  });
  tx();
}
