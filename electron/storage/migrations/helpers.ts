import type Database from 'better-sqlite3';
import type { Migration } from './types';

export function tableExists(db: Database.Database, table: string): boolean {
  const row = db
    .prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(table);
  return row != null;
}

export function columnExists(db: Database.Database, table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

export function ensureMigrationsTable(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);
}

export function getAppliedVersion(db: Database.Database): number | null {
  const row = db.prepare('SELECT MAX(version) AS v FROM _schema_migrations').get() as
    | { v: number | null }
    | undefined;
  if (row?.v == null) return null;
  return row.v;
}

export function recordMigration(db: Database.Database, migration: Migration): void {
  db.prepare(
    'INSERT OR IGNORE INTO _schema_migrations (version, name, applied_at) VALUES (?, ?, ?)'
  ).run(migration.version, migration.name, Date.now());
}

/**
 * DB lama sebelum sistem migrasi: pastikan skema awal (IF NOT EXISTS),
 * infer versi dari struktur, catat migrasi yang sudah ter-apply.
 */
export function bootstrapLegacyMigrations(db: Database.Database, migrations: Migration[]): number {
  if (!tableExists(db, 'notes')) return 0;

  const initial = migrations.find((m) => m.version === 1);
  initial?.up(db);

  const inferred = columnExists(db, 'notes', 'pinned') ? 2 : 1;

  for (const m of migrations) {
    if (m.version <= inferred) recordMigration(db, m);
  }
  return inferred;
}
