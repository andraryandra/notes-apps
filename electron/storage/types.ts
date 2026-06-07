import type { AppData } from '../../src/types';

export interface IDataStore {
  readonly backend: 'sqlite';
  load(): AppData;
  loadNoteContent(noteId: string): { content: string } | null;
  loadAllNoteContents(): Record<string, string>;
  save(data: AppData): void;
  getDataPath(): string;
  close(): void;
}

export interface StoragePaths {
  userData: string;
  /** File JSON lama — hanya untuk migrasi */
  legacyJsonFile: string;
  sqliteFile: string;
  imagesDir: string;
  attachmentsDir: string;
}
