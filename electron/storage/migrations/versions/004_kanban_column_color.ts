import type { Migration } from '../types';
import { columnExists } from '../helpers';

/** Warna kustom per kolom kanban */
export const migration004: Migration = {
  version: 4,
  name: 'kanban_column_color',
  up(db) {
    if (!columnExists(db, 'kanban_columns', 'color')) {
      db.exec(`ALTER TABLE kanban_columns ADD COLUMN color TEXT NOT NULL DEFAULT '#8b5cf6'`);
    }
  },
};
