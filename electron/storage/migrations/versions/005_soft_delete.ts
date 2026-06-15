import type { Migration } from '../types';
import { columnExists } from '../helpers';

/** Soft delete — tempat sampah untuk catatan dan kartu kanban */
export const migration005: Migration = {
  version: 5,
  name: 'soft_delete',
  up(db) {
    if (!columnExists(db, 'notes', 'deleted_at')) {
      db.exec(`ALTER TABLE notes ADD COLUMN deleted_at INTEGER`);
    }
    if (!columnExists(db, 'kanban_cards', 'deleted_at')) {
      db.exec(`ALTER TABLE kanban_cards ADD COLUMN deleted_at INTEGER`);
    }
    db.exec(`CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_kanban_cards_deleted_at ON kanban_cards(deleted_at)`);
  },
};
