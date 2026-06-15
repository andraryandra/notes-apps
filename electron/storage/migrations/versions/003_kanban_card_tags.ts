import type { Migration } from '../types';
import { columnExists } from '../helpers';

/** Tag pada kartu kanban + gabung due_at ke scheduled_at */
export const migration003: Migration = {
  version: 3,
  name: 'kanban_card_tags',
  up(db) {
    if (!columnExists(db, 'kanban_cards', 'tag_ids')) {
      db.exec(`ALTER TABLE kanban_cards ADD COLUMN tag_ids TEXT NOT NULL DEFAULT '[]'`);
    }
    db.exec(`
      UPDATE kanban_cards
      SET scheduled_at = due_at
      WHERE scheduled_at IS NULL AND due_at IS NOT NULL
    `);
  },
};
