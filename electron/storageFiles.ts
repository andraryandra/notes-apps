import type { AppData } from '../src/types';
import type { StoredFileInventory, StoredFileKind } from '../src/types';
import type { StoragePaths } from './storage/types';
import type { SqliteStore } from './storage/sqliteStore';
import type { ContentSource } from './storage/storedFilesRepo';
import { fileIdFromStoredUrl } from './storedUrl';

export type { StoredFileKind };

/** Grace period — jangan hapus file baru sebelum refs sempat tersinkron */
const PURGE_GRACE_MS = 3 * 60 * 1000;

function buildContentSources(store: SqliteStore, data?: AppData): ContentSource[] {
  const dbData = data ?? store.load();
  const noteContents = data ? null : store.loadAllNoteContents();
  const sources: ContentSource[] = [];

  for (const note of dbData.notes) {
    const fromMemory =
      note.contentLoaded !== false && note.content ? note.content : null;
    const content =
      fromMemory ?? (noteContents ? noteContents[note.id] : null) ?? note.content ?? '';
    sources.push({
      id: note.id,
      title: note.title,
      content,
      sourceType: 'note',
    });
  }
  for (const card of dbData.kanbanCards) {
    sources.push({
      id: card.id,
      title: card.title,
      content: card.content ?? '',
      sourceType: 'kanban',
    });
  }
  return sources;
}

export function syncFileRefs(store: SqliteStore, paths: StoragePaths, data?: AppData): void {
  const sources = buildContentSources(store, data);
  store.files.syncRefsFromSources(sources, paths.imagesDir, paths.attachmentsDir);
}

export function syncFileRefsAndPurge(
  store: SqliteStore,
  paths: StoragePaths,
  data?: AppData
): number {
  syncFileRefs(store, paths, data);
  return store.files.purgeUnreferenced(
    paths.imagesDir,
    paths.attachmentsDir,
    PURGE_GRACE_MS
  );
}

export function buildStoredFileInventory(
  store: SqliteStore,
  paths: StoragePaths
): StoredFileInventory {
  const data = store.load();
  const titleMap = new Map<string, string>();
  for (const note of data.notes) {
    titleMap.set(note.id, note.title.trim() || 'Tanpa judul');
  }
  for (const card of data.kanbanCards) {
    titleMap.set(card.id, card.title.trim() || 'Tanpa judul');
  }
  return store.files.buildInventory(paths.imagesDir, paths.attachmentsDir, titleMap);
}

export function deleteStoredFileIfUnreferenced(
  store: SqliteStore,
  paths: StoragePaths,
  storedUrl: string
): { ok: true; deleted: boolean } | { ok: false; error: string } {
  syncFileRefs(store, paths);
  const fileId = fileIdFromStoredUrl(storedUrl);
  const row = fileId
    ? store.files.getById(fileId)
    : store.files.resolveRowFromUrl(storedUrl);

  if (!row) return { ok: false, error: 'File tidak ditemukan di database' };

  const { deleted } = store.files.deleteByIdIfUnreferenced(
    row.id,
    paths.imagesDir,
    paths.attachmentsDir
  );
  if (!deleted && store.files.refCount(row.id) > 0) {
    return { ok: true, deleted: false };
  }
  if (!deleted) return { ok: false, error: 'File tidak ditemukan di disk' };
  return { ok: true, deleted: true };
}

export function deleteStoredFileById(
  store: SqliteStore,
  paths: StoragePaths,
  fileId: string,
  force?: boolean
): { ok: true } | { ok: false; error: string; usedInNotes?: string[] } {
  const row = store.files.getById(fileId);
  if (!row) return { ok: false, error: 'File tidak ditemukan' };

  const refs = store.files.refCount(fileId);
  if (refs > 0 && !force) {
    return {
      ok: false,
      error: 'Masih dipakai di catatan',
      usedInNotes: store.files.usedInSources(fileId),
    };
  }

  const ok = store.files.deleteById(fileId, paths.imagesDir, paths.attachmentsDir);
  if (!ok) return { ok: false, error: 'Gagal menghapus file' };
  return { ok: true };
}

export function ensureStoredFilesMigrated(
  store: SqliteStore,
  paths: StoragePaths,
  mimeFromName: (name: string) => string,
  fileKindFromName: (name: string) => string
): void {
  store.files.migrateOrphanDiskFiles(
    paths.imagesDir,
    paths.attachmentsDir,
    mimeFromName,
    fileKindFromName
  );
}
