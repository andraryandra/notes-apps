import type { Migration } from '../types';
import { columnExists } from '../helpers';

/** Kolom pin — catatan selalu di atas daftar (beda dari favorit) */
export const migration002: Migration = {
  version: 2,
  name: 'notes_pinned',
  up(db) {
    if (!columnExists(db, 'notes', 'pinned')) {
      db.exec(`ALTER TABLE notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0`);
    }
    db.exec(`CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(pinned)`);
  },
};
