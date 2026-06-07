import Database from 'better-sqlite3';
import fs from 'fs';
import type { AppData, Folder, KanbanCard, KanbanColumn, KanbanGroup, Note, Tag, TodoItem } from '../../src/types';
import { normalizeAppData } from '../normalizeData';
import { StoredFilesRepo } from './storedFilesRepo';
import type { IDataStore } from './types';
import { runMigrations } from './migrations';

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Ringkas HTML untuk preview daftar catatan */
function previewFromHtml(html: string, max = 160): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export class SqliteStore implements IDataStore {
  readonly backend = 'sqlite' as const;
  private db: Database.Database;
  readonly files: StoredFilesRepo;

  constructor(private readonly dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.files = new StoredFilesRepo(this.db);
    runMigrations(this.db);
  }

  getDataPath(): string {
    return this.dbPath;
  }

  load(): AppData {
    const folders = this.db
      .prepare('SELECT id, name, parent_id AS parentId, created_at AS createdAt FROM folders')
      .all() as Folder[];

    const notes = (
      this.db
        .prepare(
          `SELECT id, title, substr(content, 1, 400) AS contentSnippet, folder_id AS folderId,
                  tag_ids AS tagIdsRaw, favorite, pinned, scheduled_at AS scheduledAt,
                  created_at AS createdAt, updated_at AS updatedAt
           FROM notes`
        )
        .all() as {
        id: string;
        title: string;
        contentSnippet: string;
        folderId: string | null;
        tagIdsRaw: string;
        favorite: number;
        pinned: number;
        scheduledAt: number | null;
        createdAt: number;
        updatedAt: number;
      }[]
    ).map(
      (r) =>
        ({
          id: r.id,
          title: r.title,
          content: '',
          contentPreview: previewFromHtml(r.contentSnippet),
          contentLoaded: false,
          folderId: r.folderId,
          tagIds: parseJson<string[]>(r.tagIdsRaw, []),
          favorite: Boolean(r.favorite),
          pinned: Boolean(r.pinned),
          scheduledAt: r.scheduledAt ?? null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }) satisfies Note
    );

    const tags = this.db.prepare('SELECT id, name, color FROM tags').all() as Tag[];

    const todos = (
      this.db
        .prepare(
          `SELECT id, title, done, status, note_id AS noteId, due_at AS dueAt,
                  created_at AS createdAt, updated_at AS updatedAt FROM todos`
        )
        .all() as {
        id: string;
        title: string;
        done: number;
        status: TodoItem['status'];
        noteId: string | null;
        dueAt: number | null;
        createdAt: number;
        updatedAt: number;
      }[]
    ).map(
      (r) =>
        ({
          id: r.id,
          title: r.title,
          done: Boolean(r.done),
          status: r.status,
          noteId: r.noteId ?? null,
          dueAt: r.dueAt ?? null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }) satisfies TodoItem
    );

    const kanbanGroups = this.db
      .prepare(
        'SELECT id, name, created_at AS createdAt, updated_at AS updatedAt FROM kanban_groups'
      )
      .all() as KanbanGroup[];

    const kanbanColumns = this.db
      .prepare(
        'SELECT id, group_id AS groupId, name, sort_order AS `order` FROM kanban_columns'
      )
      .all() as KanbanColumn[];

    const kanbanCards = this.db
      .prepare(
        `SELECT id, group_id AS groupId, column_id AS columnId, title, content,
                sort_order AS \`order\`, due_at AS dueAt, scheduled_at AS scheduledAt,
                linked_note_id AS linkedNoteId, created_at AS createdAt, updated_at AS updatedAt
         FROM kanban_cards`
      )
      .all()
      .map((row) => {
        const r = row as KanbanCard;
        return {
          ...r,
          dueAt: r.dueAt ?? null,
          scheduledAt: r.scheduledAt ?? null,
          linkedNoteId: r.linkedNoteId ?? null,
        };
      });

    return normalizeAppData({
      folders,
      notes,
      tags,
      todos,
      kanbanGroups,
      kanbanColumns,
      kanbanCards,
    });
  }

  loadNoteContent(noteId: string): { content: string } | null {
    const row = this.db
      .prepare('SELECT content FROM notes WHERE id = ?')
      .get(noteId) as { content: string } | undefined;
    return row ? { content: row.content } : null;
  }

  loadAllNoteContents(): Record<string, string> {
    const rows = this.db.prepare('SELECT id, content FROM notes').all() as {
      id: string;
      content: string;
    }[];
    const out: Record<string, string> = {};
    for (const r of rows) out[r.id] = r.content;
    return out;
  }

  save(data: AppData): void {
    const normalized = normalizeAppData(data);
    const tx = this.db.transaction(() => {
      this.syncIds(
        'folders',
        normalized.folders.map((f) => f.id),
        'DELETE FROM folders WHERE id = ?'
      );
      this.syncIds(
        'notes',
        normalized.notes.map((n) => n.id),
        'DELETE FROM notes WHERE id = ?'
      );
      this.syncIds(
        'tags',
        normalized.tags.map((t) => t.id),
        'DELETE FROM tags WHERE id = ?'
      );
      this.syncIds(
        'todos',
        normalized.todos.map((t) => t.id),
        'DELETE FROM todos WHERE id = ?'
      );
      this.syncIds(
        'kanban_groups',
        normalized.kanbanGroups.map((g) => g.id),
        'DELETE FROM kanban_groups WHERE id = ?'
      );
      this.syncIds(
        'kanban_columns',
        normalized.kanbanColumns.map((c) => c.id),
        'DELETE FROM kanban_columns WHERE id = ?'
      );
      this.syncIds(
        'kanban_cards',
        normalized.kanbanCards.map((c) => c.id),
        'DELETE FROM kanban_cards WHERE id = ?'
      );

      const insFolder = this.db.prepare(
        `INSERT OR REPLACE INTO folders (id, name, parent_id, created_at)
         VALUES (@id, @name, @parentId, @createdAt)`
      );
      for (const f of normalized.folders) insFolder.run(f);

      const insNoteFull = this.db.prepare(
        `INSERT OR REPLACE INTO notes (id, title, content, folder_id, tag_ids, favorite, pinned, scheduled_at, created_at, updated_at)
         VALUES (@id, @title, @content, @folderId, @tagIds, @favorite, @pinned, @scheduledAt, @createdAt, @updatedAt)`
      );
      const updNoteMeta = this.db.prepare(
        `UPDATE notes SET title = @title, folder_id = @folderId, tag_ids = @tagIds,
         favorite = @favorite, pinned = @pinned, scheduled_at = @scheduledAt, updated_at = @updatedAt
         WHERE id = @id`
      );
      for (const n of normalized.notes) {
        const row = {
          ...n,
          tagIds: JSON.stringify(n.tagIds),
          favorite: n.favorite ? 1 : 0,
          pinned: n.pinned ? 1 : 0,
        };
        if (n.contentLoaded !== false) {
          insNoteFull.run(row);
        } else {
          updNoteMeta.run(row);
        }
      }

      const insTag = this.db.prepare(
        'INSERT OR REPLACE INTO tags (id, name, color) VALUES (@id, @name, @color)'
      );
      for (const t of normalized.tags) insTag.run(t);

      const insTodo = this.db.prepare(
        `INSERT OR REPLACE INTO todos (id, title, done, status, note_id, due_at, created_at, updated_at)
         VALUES (@id, @title, @done, @status, @noteId, @dueAt, @createdAt, @updatedAt)`
      );
      for (const t of normalized.todos) {
        insTodo.run({ ...t, done: t.done ? 1 : 0 });
      }

      const insGroup = this.db.prepare(
        `INSERT OR REPLACE INTO kanban_groups (id, name, created_at, updated_at)
         VALUES (@id, @name, @createdAt, @updatedAt)`
      );
      for (const g of normalized.kanbanGroups) insGroup.run(g);

      const insCol = this.db.prepare(
        `INSERT OR REPLACE INTO kanban_columns (id, group_id, name, sort_order)
         VALUES (@id, @groupId, @name, @order)`
      );
      for (const c of normalized.kanbanColumns) insCol.run(c);

      const insCard = this.db.prepare(
        `INSERT OR REPLACE INTO kanban_cards (id, group_id, column_id, title, content, sort_order, due_at, scheduled_at, linked_note_id, created_at, updated_at)
         VALUES (@id, @groupId, @columnId, @title, @content, @order, @dueAt, @scheduledAt, @linkedNoteId, @createdAt, @updatedAt)`
      );
      for (const c of normalized.kanbanCards) insCard.run(c);
    });
    tx();
  }

  /** Hapus baris yang tidak ada lagi di snapshot terbaru */
  private syncIds(table: string, ids: string[], deleteSql: string): void {
    const idSet = new Set(ids);
    const existing = this.db.prepare(`SELECT id FROM ${table}`).all() as { id: string }[];
    const del = this.db.prepare(deleteSql);
    for (const row of existing) {
      if (!idSet.has(row.id)) del.run(row.id);
    }
  }

  close(): void {
    this.db.close();
  }
}

export function importAppDataToSqlite(dbPath: string, data: AppData): void {
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  const store = new SqliteStore(dbPath);
  store.save(data);
  store.close();
}
