import type { Migration } from '../types';

/** Skema awal SQLite — catatan, folder, tag, todo, kanban, file tersimpan */
export const migration001: Migration = {
  version: 1,
  name: 'initial',
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        parent_id TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        folder_id TEXT,
        tag_ids TEXT NOT NULL DEFAULT '[]',
        favorite INTEGER NOT NULL DEFAULT 0,
        scheduled_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notes_favorite ON notes(favorite);

      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        done INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL,
        note_id TEXT,
        due_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS kanban_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS kanban_columns (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_kanban_columns_group ON kanban_columns(group_id);

      CREATE TABLE IF NOT EXISTS kanban_cards (
        id TEXT PRIMARY KEY,
        group_id TEXT NOT NULL,
        column_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        due_at INTEGER,
        scheduled_at INTEGER,
        linked_note_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_kanban_cards_group ON kanban_cards(group_id);
      CREATE INDEX IF NOT EXISTS idx_kanban_cards_updated ON kanban_cards(updated_at DESC);

      CREATE TABLE IF NOT EXISTS stored_files (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL CHECK(kind IN ('image', 'attachment')),
        disk_name TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
        file_kind TEXT NOT NULL DEFAULT 'other',
        size INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_stored_files_disk ON stored_files(kind, disk_name);

      CREATE TABLE IF NOT EXISTS stored_file_refs (
        file_id TEXT NOT NULL REFERENCES stored_files(id) ON DELETE CASCADE,
        source_type TEXT NOT NULL CHECK(source_type IN ('note', 'kanban')),
        source_id TEXT NOT NULL,
        PRIMARY KEY (file_id, source_type, source_id)
      );
      CREATE INDEX IF NOT EXISTS idx_stored_file_refs_file ON stored_file_refs(file_id);
    `);
  },
};
