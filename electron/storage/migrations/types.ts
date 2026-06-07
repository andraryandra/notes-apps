import type Database from 'better-sqlite3';

export interface Migration {
  /** Nomor urut — harus unik dan monoton naik */
  version: number;
  /** Nama singkat snake_case, mis. `notes_pinned` */
  name: string;
  up: (db: Database.Database) => void;
}
