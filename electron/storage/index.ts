import fs from 'fs';
import path from 'path';
import type { AppData } from '../../src/types';
import { normalizeAppData } from '../normalizeData';
import {
  syncFileRefsAndPurge,
  syncFileRefs,
  deleteStoredFileIfUnreferenced,
  buildStoredFileInventory,
  deleteStoredFileById,
} from '../storageFiles';
import { importAppDataToSqlite, SqliteStore } from './sqliteStore';
import type { StoragePaths } from './types';

let activeStore: SqliteStore | null = null;

export function buildStoragePaths(userData: string): StoragePaths {
  return {
    userData,
    legacyJsonFile: path.join(userData, 'notes-data.json'),
    sqliteFile: path.join(userData, 'notes.db'),
    imagesDir: path.join(userData, 'images'),
    attachmentsDir: path.join(userData, 'attachments'),
  };
}

/** Migrasi sekali dari notes-data.json lama (jika ada) */
function migrateLegacyJsonIfNeeded(paths: StoragePaths): void {
  if (fs.existsSync(paths.sqliteFile)) return;
  if (!fs.existsSync(paths.legacyJsonFile)) return;

  try {
    const raw = JSON.parse(fs.readFileSync(paths.legacyJsonFile, 'utf-8'));
    const data = normalizeAppData(raw);
    importAppDataToSqlite(paths.sqliteFile, data);
    const migrated = `${paths.legacyJsonFile}.migrated`;
    if (!fs.existsSync(migrated)) {
      fs.renameSync(paths.legacyJsonFile, migrated);
    }
  } catch {
    /* biarkan SqliteStore buat DB kosong */
  }
}

export function createDataStore(paths: StoragePaths): SqliteStore {
  migrateLegacyJsonIfNeeded(paths);
  return new SqliteStore(paths.sqliteFile);
}

export function getDataStore(paths: StoragePaths): SqliteStore {
  if (activeStore) return activeStore;
  activeStore = createDataStore(paths);
  return activeStore;
}

export function resetDataStore(): void {
  activeStore?.close();
  activeStore = null;
}

/** Hapus file WAL/SHM SQLite agar replace DB bersih */
function removeSqliteSidecars(dbPath: string): void {
  for (const suffix of ['-wal', '-shm']) {
    const sidecar = `${dbPath}${suffix}`;
    if (fs.existsSync(sidecar)) fs.unlinkSync(sidecar);
  }
}

/**
 * Ganti notes.db sepenuhnya (restore backup).
 * Bukan merge — ID dari backup dipertahankan supaya link/tag/folder tetap valid.
 */
export function replaceSqliteDatabase(targetDbPath: string, sourceDbPath: string): void {
  resetDataStore();
  removeSqliteSidecars(targetDbPath);
  if (fs.existsSync(targetDbPath)) fs.unlinkSync(targetDbPath);
  fs.copyFileSync(sourceDbPath, targetDbPath);
  removeSqliteSidecars(targetDbPath);
}

export function ensureStorageDirs(paths: StoragePaths): void {
  for (const dir of [paths.imagesDir, paths.attachmentsDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

export function getStorageDataBytes(paths: StoragePaths): number {
  if (!fs.existsSync(paths.sqliteFile)) return 0;
  return fs.statSync(paths.sqliteFile).size;
}

export function loadAllData(paths: StoragePaths): AppData {
  return getDataStore(paths).load();
}

export function loadNoteContent(paths: StoragePaths, noteId: string): { content: string } | null {
  return getDataStore(paths).loadNoteContent(noteId);
}

export function loadAllNoteContents(paths: StoragePaths): Record<string, string> {
  return getDataStore(paths).loadAllNoteContents();
}

export function saveAllData(paths: StoragePaths, data: AppData): void {
  getDataStore(paths).save(data);
}

/** Semua HTML dari DB (catatan + kanban) untuk cek referensi file */
export function loadAllContentSourcesForFileRefs(paths: StoragePaths): {
  id: string;
  title: string;
  content: string;
}[] {
  const store = getDataStore(paths);
  const noteContents = store.loadAllNoteContents();
  const data = store.load();

  const sources: { id: string; title: string; content: string }[] = [];

  for (const note of data.notes) {
    sources.push({
      id: note.id,
      title: note.title,
      content: noteContents[note.id] ?? note.content ?? '',
    });
  }

  for (const card of data.kanbanCards) {
    sources.push({
      id: card.id,
      title: card.title,
      content: card.content ?? '',
    });
  }

  return sources;
}

export function syncStoredFileRefs(paths: StoragePaths, data?: AppData): void {
  syncFileRefs(getDataStore(paths), paths, data);
}

export function purgeUnusedFilesAfterSave(paths: StoragePaths, data?: AppData): number {
  return syncFileRefsAndPurge(getDataStore(paths), paths, data);
}

export function purgeStoredFileIfUnreferenced(
  paths: StoragePaths,
  storedUrl: string
): { ok: true; deleted: boolean } | { ok: false; error: string } {
  return deleteStoredFileIfUnreferenced(getDataStore(paths), paths, storedUrl);
}

export function getStoredFileInventory(paths: StoragePaths) {
  return buildStoredFileInventory(getDataStore(paths), paths);
}

export function removeStoredFileById(
  paths: StoragePaths,
  fileId: string,
  force?: boolean
) {
  return deleteStoredFileById(getDataStore(paths), paths, fileId, force);
}

export function importLegacyJsonBackup(jsonPath: string, paths: StoragePaths): void {
  if (!fs.existsSync(jsonPath)) return;
  const data = normalizeAppData(JSON.parse(fs.readFileSync(jsonPath, 'utf-8')));
  resetDataStore();
  importAppDataToSqlite(paths.sqliteFile, data);
}

export function dirSize(dir: string): { count: number; bytes: number } {
  if (!fs.existsSync(dir)) return { count: 0, bytes: 0 };
  let count = 0;
  let bytes = 0;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (!fs.statSync(full).isFile()) continue;
    count++;
    bytes += fs.statSync(full).size;
  }
  return { count, bytes };
}

export type { IDataStore } from './types';
