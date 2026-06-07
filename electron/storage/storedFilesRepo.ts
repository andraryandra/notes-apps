import type Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import type { StoredFileInventory, StoredFileKind } from '../../src/types';
import { fileIdFromStoredUrl, fileNameFromStoredUrl } from '../storedUrl';
import { diskNameFromId } from '../storedFileName';

export interface StoredFileRow {
  id: string;
  kind: StoredFileKind;
  diskName: string;
  originalName: string;
  mimeType: string;
  fileKind: string;
  size: number;
  createdAt: number;
}

export interface ContentSource {
  id: string;
  title: string;
  content: string;
  sourceType: 'note' | 'kanban';
}

const FILE_ID_ATTR = /data-file-id="([^"]+)"/g;
const FILE_ID_IN_URL =
  /notes-(?:file|image):\/\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi;

/** Kumpulkan ID file dari HTML catatan */
export function collectReferencedFileIds(html: string): Set<string> {
  const ids = new Set<string>();
  for (const m of html.matchAll(FILE_ID_ATTR)) {
    if (m[1]) ids.add(m[1]);
  }
  for (const m of html.matchAll(FILE_ID_IN_URL)) {
    if (m[1]) ids.add(m[1]);
  }
  return ids;
}

/** Legacy: URL berisi nama disk, bukan UUID */
function collectLegacyDiskRefs(html: string): { url: string; kind: StoredFileKind }[] {
  const out: { url: string; kind: StoredFileKind }[] = [];
  for (const m of html.matchAll(/data-stored-src="([^"]+)"/g)) {
    if (m[1] && !fileIdFromStoredUrl(m[1])) out.push({ url: m[1], kind: 'image' });
  }
  for (const m of html.matchAll(/data-stored-url="([^"]+)"/g)) {
    if (m[1] && !fileIdFromStoredUrl(m[1])) out.push({ url: m[1], kind: 'attachment' });
  }
  return out;
}

export class StoredFilesRepo {
  constructor(private readonly db: Database.Database) {}

  /** @deprecated Skema dikelola lewat electron/storage/migrations — tetap ada untuk compat */
  ensureSchema(): void {
    /* no-op: runMigrations() sudah membuat stored_files & stored_file_refs */
  }

  insert(row: {
    id?: string;
    kind: StoredFileKind;
    diskName: string;
    originalName: string;
    mimeType: string;
    fileKind: string;
    size: number;
  }): StoredFileRow {
    const id = row.id ?? randomUUID();
    const createdAt = Date.now();
    this.db
      .prepare(
        `INSERT INTO stored_files (id, kind, disk_name, original_name, mime_type, file_kind, size, created_at)
         VALUES (@id, @kind, @diskName, @originalName, @mimeType, @fileKind, @size, @createdAt)`
      )
      .run({ ...row, id, createdAt });
    return { ...row, id, createdAt };
  }

  getById(id: string): StoredFileRow | null {
    const row = this.db
      .prepare(
        `SELECT id, kind, disk_name AS diskName, original_name AS originalName,
                mime_type AS mimeType, file_kind AS fileKind, size, created_at AS createdAt
         FROM stored_files WHERE id = ?`
      )
      .get(id) as StoredFileRow | undefined;
    return row ?? null;
  }

  getByDiskName(diskName: string, kind: StoredFileKind): StoredFileRow | null {
    const row = this.db
      .prepare(
        `SELECT id, kind, disk_name AS diskName, original_name AS originalName,
                mime_type AS mimeType, file_kind AS fileKind, size, created_at AS createdAt
         FROM stored_files WHERE disk_name = ? AND kind = ?`
      )
      .get(diskName, kind) as StoredFileRow | undefined;
    return row ?? null;
  }

  resolveRowFromUrl(storedUrl: string): StoredFileRow | null {
    const id = fileIdFromStoredUrl(storedUrl);
    if (id) return this.getById(id);

    const diskName = fileNameFromStoredUrl(storedUrl);
    if (!diskName) return null;
    const kind: StoredFileKind = storedUrl.startsWith('notes-image:') ? 'image' : 'attachment';
    return this.getByDiskName(path.basename(diskName), kind);
  }

  /** Cari file di disk by ID (nama: {uuid}.ext) */
  findDiskPathByFileId(
    fileId: string,
    kind: StoredFileKind,
    imagesDir: string,
    attachmentsDir: string
  ): string | null {
    const dir = kind === 'image' ? imagesDir : attachmentsDir;
    if (!dir || !fs.existsSync(dir)) return null;
    for (const name of fs.readdirSync(dir)) {
      if (name === fileId || name.startsWith(`${fileId}.`)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isFile()) return full;
      }
    }
    return null;
  }

  /** Pulihkan baris DB jika file masih ada di disk */
  recoverRowFromDiskId(
    fileId: string,
    kind: StoredFileKind,
    imagesDir: string,
    attachmentsDir: string,
    mimeFromName: (name: string) => string = () => 'application/octet-stream',
    fileKindFromName: (name: string) => string = () => 'other'
  ): StoredFileRow | null {
    const existing = this.getById(fileId);
    if (existing) return existing;

    const full = this.findDiskPathByFileId(fileId, kind, imagesDir, attachmentsDir);
    if (!full) return null;

    const diskName = path.basename(full);
    const stat = fs.statSync(full);
    return this.insert({
      id: fileId,
      kind,
      diskName,
      originalName: diskName,
      mimeType: mimeFromName(diskName),
      fileKind: fileKindFromName(diskName),
      size: stat.size,
    });
  }

  diskPath(row: StoredFileRow, imagesDir: string, attachmentsDir: string): string {
    const base = row.kind === 'image' ? imagesDir : attachmentsDir;
    return path.join(base, row.diskName);
  }

  /** Sinkronkan tabel referensi dari semua HTML catatan/kanban */
  syncRefsFromSources(
    sources: ContentSource[],
    imagesDir: string,
    attachmentsDir: string
  ): void {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM stored_file_refs').run();

      const ins = this.db.prepare(
        `INSERT OR IGNORE INTO stored_file_refs (file_id, source_type, source_id)
         VALUES (?, ?, ?)`
      );

      for (const source of sources) {
        const html = source.content || '';
        const ids = collectReferencedFileIds(html);

        for (const legacy of collectLegacyDiskRefs(html)) {
          const diskName = path.basename(fileNameFromStoredUrl(legacy.url));
          if (!diskName) continue;
          const row = this.getByDiskName(diskName, legacy.kind);
          if (row) ids.add(row.id);
        }

        for (const fileId of ids) {
          if (!this.getById(fileId)) {
            const kind: StoredFileKind = html.includes(`notes-image://${fileId}`)
              ? 'image'
              : 'attachment';
            this.recoverRowFromDiskId(fileId, kind, imagesDir, attachmentsDir);
          }
          if (!this.getById(fileId)) continue;
          ins.run(fileId, source.sourceType, source.id);
        }
      }
    });
    tx();
  }

  refCount(fileId: string): number {
    const row = this.db
      .prepare('SELECT COUNT(*) AS c FROM stored_file_refs WHERE file_id = ?')
      .get(fileId) as { c: number };
    return row.c;
  }

  usedInSources(fileId: string): string[] {
    return (
      this.db
        .prepare(
          `SELECT r.source_type, r.source_id
           FROM stored_file_refs r WHERE r.file_id = ?`
        )
        .all(fileId) as { source_type: string; source_id: string }[]
    ).map((r) => r.source_id);
  }

  deleteRowAndDisk(
    row: StoredFileRow,
    imagesDir: string,
    attachmentsDir: string
  ): boolean {
    const full = this.diskPath(row, imagesDir, attachmentsDir);
    if (fs.existsSync(full)) fs.unlinkSync(full);
    this.db.prepare('DELETE FROM stored_files WHERE id = ?').run(row.id);
    return true;
  }

  deleteByIdIfUnreferenced(
    fileId: string,
    imagesDir: string,
    attachmentsDir: string
  ): { deleted: boolean } {
    const row = this.getById(fileId);
    if (!row) return { deleted: false };
    if (this.refCount(fileId) > 0) return { deleted: false };
    this.deleteRowAndDisk(row, imagesDir, attachmentsDir);
    return { deleted: true };
  }

  deleteById(fileId: string, imagesDir: string, attachmentsDir: string): boolean {
    const row = this.getById(fileId);
    if (!row) return false;
    this.db.prepare('DELETE FROM stored_file_refs WHERE file_id = ?').run(fileId);
    return this.deleteRowAndDisk(row, imagesDir, attachmentsDir);
  }

  purgeUnreferenced(
    imagesDir: string,
    attachmentsDir: string,
    graceMs = 0
  ): number {
    const cutoff = Date.now() - graceMs;
    const orphans = this.db
      .prepare(
        `SELECT f.id, f.created_at AS createdAt FROM stored_files f
         LEFT JOIN stored_file_refs r ON r.file_id = f.id
         WHERE r.file_id IS NULL`
      )
      .all() as { id: string; createdAt: number }[];

    let deleted = 0;
    for (const { id, createdAt } of orphans) {
      if (graceMs > 0 && createdAt > cutoff) continue;
      const row = this.getById(id);
      if (!row) continue;
      this.deleteRowAndDisk(row, imagesDir, attachmentsDir);
      deleted++;
    }
    return deleted;
  }

  /** Daftar file di disk yang belum ada di DB — daftarkan otomatis */
  migrateOrphanDiskFiles(
    imagesDir: string,
    attachmentsDir: string,
    mimeFromName: (name: string) => string,
    fileKindFromName: (name: string) => string
  ): number {
    let added = 0;

    const registerDir = (dir: string, kind: StoredFileKind) => {
      if (!fs.existsSync(dir)) return;
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (!fs.statSync(full).isFile()) continue;
        if (this.getByDiskName(name, kind)) continue;

        const stat = fs.statSync(full);
        const dot = name.indexOf('.');
        const baseId = dot > 0 ? name.slice(0, dot) : name;
        const isUuid = /^[0-9a-f-]{36}$/i.test(baseId);

        this.insert({
          id: isUuid ? baseId : undefined,
          kind,
          diskName: name,
          originalName: name,
          mimeType: mimeFromName(name),
          fileKind: fileKindFromName(name),
          size: stat.size,
        });
        added++;
      }
    };

    registerDir(imagesDir, 'image');
    registerDir(attachmentsDir, 'attachment');
    return added;
  }

  buildInventory(
    imagesDir: string,
    attachmentsDir: string,
    sourceTitles: Map<string, string>
  ): StoredFileInventory {
    const rows = this.db
      .prepare(
        `SELECT f.id, f.kind, f.disk_name AS diskName, f.original_name AS originalName,
                f.size, f.created_at AS createdAt,
                (SELECT COUNT(*) FROM stored_file_refs r WHERE r.file_id = f.id) AS refCount
         FROM stored_files f ORDER BY f.created_at DESC`
      )
      .all() as {
      id: string;
      kind: StoredFileKind;
      diskName: string;
      originalName: string;
      size: number;
      refCount: number;
    }[];

    const files = rows.map((r) => {
      const used = r.refCount > 0;
      const refIds = used ? this.usedInSources(r.id) : [];
      const usedInNotes = refIds.map((id) => sourceTitles.get(id) ?? id);
      return {
        fileId: r.id,
        kind: r.kind,
        diskName: r.diskName,
        originalName: r.originalName,
        fileName: r.originalName,
        size: r.size,
        used,
        usedInNotes,
      };
    });

    return {
      imagesPath: imagesDir,
      attachmentsPath: attachmentsDir,
      files,
      unusedCount: files.filter((f) => !f.used).length,
    };
  }
}

/** Buat baris DB + nama disk dari file baru */
export function registerNewStoredFile(
  repo: StoredFilesRepo,
  params: {
    kind: StoredFileKind;
    originalName: string;
    mimeType: string;
    fileKind: string;
    size: number;
  }
): StoredFileRow {
  const id = randomUUID();
  const diskName = diskNameFromId(id, params.originalName);
  return repo.insert({ id, diskName, ...params });
}
