# 03 — Model Data & IPC

## Sumber kebenaran tipe

File: **`src/types.ts`** — jangan duplikasi interface di file lain.

## Skema `AppData`

```typescript
interface AppData {
  folders: Folder[];
  notes: Note[];
  tags: Tag[];
  todos: TodoItem[];           // legacy — dikosongkan setelah migrasi kanban
  kanbanGroups: KanbanGroup[];
  kanbanColumns: KanbanColumn[];
  kanbanCards: KanbanCard[];
}
```

### Folder

| Field | Tipe | Keterangan |
|-------|------|------------|
| id | string | UUID |
| name | string | Nama tampilan |
| parentId | string \| null | `null` = root |
| createdAt | number | Unix ms |

Helper pohon: `buildFolderTree(folders, parentId)` di `useNotesStore.ts`.

### Note

| Field | Tipe | Keterangan |
|-------|------|------------|
| id | string | UUID |
| title | string | Plain text |
| content | string | HTML dari TipTap |
| contentPreview | string? | Preview teks untuk daftar (dari DB) |
| contentLoaded | boolean? | `false` = konten penuh belum dimuat (lazy) |
| folderId | string \| null | Referensi folder |
| tagIds | string[] | ID tag |
| favorite | boolean | Filter view + styling |
| pinned | boolean | Urutan di atas daftar |
| scheduledAt | number \| null | Jadwal (unix ms) |
| createdAt | number | Unix ms |
| updatedAt | number | Di-update setiap `updateNote` |

### Tag

| Field | Tipe | Keterangan |
|-------|------|------------|
| id | string | UUID |
| name | string | |
| color | string | Hex; rotasi dari `TAG_COLORS` saat create |

### Kanban (ringkas)

| Entitas | Field penting |
|---------|---------------|
| `KanbanGroup` | id, name, createdAt, updatedAt |
| `KanbanColumn` | id, groupId, name, order |
| `KanbanCard` | id, groupId, columnId, title, content (HTML), order, dueAt, scheduledAt, linkedNoteId |

## Penyimpanan di disk

| Platform | Lokasi data |
|----------|-------------|
| Linux | `~/.config/notes-app/` |
| macOS | `~/Library/Application Support/notes-app/` |
| Windows | `%APPDATA%/notes-app/` |

| File / folder | Isi |
|---------------|-----|
| `notes.db` | SQLite — catatan, folder, tag, kanban, metadata file |
| `settings.json` | Tema, layout, scroll batch size |
| `images/` | File gambar binary |
| `attachments/` | Lampiran (PDF, Office, dll.) |
| `notes-data.json.migrated` | JSON lama (setelah migrasi otomatis ke SQLite) |
| `pre-restore-backup/` | Cadangan otomatis sebelum restore |

Engine: **better-sqlite3**, mode WAL, foreign keys ON.

Skema DB & cara menambah migrasi: **[09-DB-MIGRATIONS.md](09-DB-MIGRATIONS.md)**.

### Backup & restore

- **Export backup:** folder berisi `notes.db`, `settings.json`, `images/`, `attachments/`, manifest.
- **Restore:** ganti DB sepenuhnya (bukan merge); data lama dicadangkan ke `pre-restore-backup/`.
- UI: title bar → **Pengaturan** → Backup & Restore.

Implementasi: `electron/storage/index.ts`, handler IPC di `electron/main.ts`.

### JSON legacy

`notes-data.json` dimigrasi otomatis ke SQLite saat pertama kali app dibuka (jika `notes.db` belum ada). Field baru di-merge di `normalizeData.ts`. Detail import: [09-DB-MIGRATIONS.md](09-DB-MIGRATIONS.md).

## IPC API (`window.electronAPI`)

Didefinisikan di `electron/preload.ts`, diimplementasi di `electron/main.ts`.

### Data & penyimpanan

| Channel | Input | Output | Fungsi |
|---------|-------|--------|--------|
| `data:load` | — | `AppData` | Muat dari SQLite (preview ringkas) |
| `data:save` | `AppData` | `boolean` | Simpan transaksi SQLite |
| `data:loadNoteContent` | noteId | `{ content } \| null` | Lazy load HTML penuh |
| `data:loadAllNoteContents` | — | `Record<id, content>` | Semua konten (dashboard/aset) |
| `settings:load` / `settings:save` | `AppSettings` | — | Tema, layout, batch size |
| `storage:getInfo` | — | `StorageInfo` | Statistik DB & disk |
| `storage:getFileInventory` | — | `StoredFileInventory` | Daftar file di disk |
| `storage:openFolder` | `'data'\|'images'\|'attachments'` | — | Buka folder OS |
| `storage:deleteFile` | fileId, force? | — | Hapus file tersimpan |
| `backup:export` / `backup:restore` | — | `BackupResult` | Backup folder |

### Gambar & lampiran

| Channel | Fungsi |
|---------|--------|
| `image:upload` | Dialog → salin ke images → `notes-image://` |
| `image:save-buffer` | Paste/drop → URL |
| `image:resolve` | URL → data URL base64 |
| `attachment:pick` / `attachment:copyFromPath` / `attachment:saveBuffer` | Lampiran file |
| `file:resolve` / `file:readText` / `file:readBuffer` | Baca lampiran |
| `file:openExternal` / `file:showInFolder` / `file:download` | Aksi OS |
| `file:previewOffice` / `file:listExcelSheets` | Preview Office |

### Ekspor

| Channel | Fungsi |
|---------|--------|
| `note:export` | Ekspor catatan ke MD / PDF / HTML / TXT (dialog save) |

## Tema & layout

CSS: `src/styles/themes.css` — atribut `data-theme` pada `<html>`.

- **14 tema** warna (gelap, terang, nuansa modern).
- **Layout:** `classic` (3 kolom) atau `focus` (editor penuh + drawer).

Hook: `useAppearance()` — sinkron dengan `settings.json`.

Konfigurasi: `src/config/appearance.ts`.

## Pintasan keyboard

Definisi: `src/config/keyboardShortcuts.ts`  
Hook: `src/hooks/useGlobalShortcuts.ts` (dipasang di `App.tsx`)  
Tampilan: panel **Pengaturan → Pintasan keyboard**.

## Mutasi data (renderer)

**Semua** create/update/delete harus melalui hook **`useNotesStore`**:

| Method | Efek |
|--------|------|
| `createFolder(name, parentId?)` | Tambah folder |
| `renameFolder` / `deleteFolder` | |
| `createNote(folderId?, opts?)` | Catatan baru |
| `updateNote(id, patch)` | Partial update + updatedAt |
| `deleteNote(id)` / `deleteNotes(ids[])` | Hapus satu / bulk |
| `toggleFavorite(id)` / `togglePin(id)` | |
| `createTag` / `deleteTag` / `toggleNoteTag` | |
| `ensureNoteContent(id)` | Lazy load HTML |
| `flushBeforeNoteSwitch()` | Flush debounce sebelum ganti catatan |
| `reload()` | Muat ulang dari disk (setelah restore) |
| Kanban CRUD | `createKanbanGroup`, `createKanbanCard`, `moveKanbanCard`, dll. |

`persist` memakai functional updater + debounce save (~400ms saat mengetik konten).

## Filter catatan (logika di `App.tsx`)

Prioritas:

1. Jika `searchQuery` tidak kosong → filter semua notes by title + konten.
2. Else switch `sidebarView`:
   - `all` — semua
   - `favorites` — `favorite === true`
   - `folder` — `folderId` dalam subtree folder terpilih
   - `tag` — `tagIds.includes(selectedTagId)`

Urutan tampilan di `NoteList`: `sortNotesForList()` — pin dulu, lalu `updatedAt` desc.

## Format konten HTML

- TipTap: `p`, `h1`, `h2`, `ul`, `ol`, `strong`, `em`, `img`, `hr`, dll.
- Font size: `span style="font-size: Npx"` via extension FontSize.
- Gambar: `notes-image://uuid` atau `data:` sementara saat editing.
- Lampiran: node kustom dengan `data-stored-url`, `data-file-id`.

## Normalisasi data

`electron/normalizeData.ts` — merge default field untuk data lama / import (mis. `pinned: false`, `scheduledAt: null`).
