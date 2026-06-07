# 06 — Panduan Tugas untuk Agent

Gunakan tabel ini untuk **membatasi scope edit**. Baca dokumen yang disebut, lalu buka file target saja.

> **Migrasi SQLite?** Buka **[09-DB-MIGRATIONS.md](09-DB-MIGRATIONS.md)** — jangan ikuti langkah migrasi di dokumen ini.

## Tugas fitur produk

### Menambah field pada catatan (mis. `archived`)

| Langkah | File |
|---------|------|
| 1 | `docs/03-DATA-MODEL.md` — dokumentasikan field |
| 2 | `src/types.ts` — tambah field di `Note` |
| 3 | `docs/09-DB-MIGRATIONS.md` — tambah migrasi kolom |
| 4 | `electron/normalizeData.ts` — default field untuk data lama |
| 5 | `electron/storage/sqliteStore.ts` — SELECT/INSERT/UPDATE kolom baru |
| 6 | `src/hooks/useNotesStore.ts` — default di `createNote`, optional di `updateNote` |
| 7 | UI: `NoteList.tsx`, `NoteEditor.tsx` sesuai kebutuhan |

### Pintasan keyboard global baru

| Langkah | File |
|---------|------|
| 1 | `src/config/keyboardShortcuts.ts` — tambah entri + label ID |
| 2 | `src/hooks/useGlobalShortcuts.ts` — handler keydown |
| 3 | `src/App.tsx` — wire callback |
| 4 | `SettingsModal.tsx` otomatis baca `KEYBOARD_SHORTCUTS` |

### Pintasan di editor TipTap saja

| File | Catatan |
|------|---------|
| `RichEditor.tsx` | `editorProps.handleKeyDown` atau TipTap shortcuts |

### Ekspor catatan (format baru)

| Langkah | File |
|---------|------|
| 1 | `src/types.ts` — `NoteExportFormat` |
| 2 | `electron/main.ts` — handler `note:export` |
| 3 | `electron/preload.ts` — expose API |
| 4 | `src/utils/exportNote.ts` + `NoteEditor.tsx` — UI trigger |

### Memindahkan catatan antar folder (UI baru)

| Langkah | File |
|---------|------|
| 1 | `docs/01-PRODUCT.md` — tambah journey |
| 2 | `NoteEditor.tsx` — dropdown folder |
| 3 | `useNotesStore.ts` — `updateNote(id, { folderId })` sudah ada |

### Menambah format editor (mis. highlight)

| Langkah | File |
|---------|------|
| 1 | Install extension TipTap di `package.json` |
| 2 | `RichEditor.tsx` — register extension + tombol toolbar |
| 3 | `docs/02-ARCHITECTURE.md` — catat dependency |

## Tugas per area

| Area | Baca dulu | File utama |
|------|-----------|------------|
| Bug save / data hilang | 03-DATA-MODEL | `useNotesStore.ts`, `sqliteStore.ts`, `main.ts` |
| Migrasi DB | **09-DB-MIGRATIONS** | `electron/storage/migrations/` |
| Folder tidak tampil | 03, 04 | `FolderTree.tsx`, `buildFolderTree` |
| Filter / sort salah | 01, 03 | `App.tsx`, `sortNotesForList` |
| Pin / favorit | 01, 03 | `NoteList.tsx`, `useNotesStore.togglePin` |
| Gambar tidak muncul | 03, 02 | `RichEditor.tsx`, `main.ts` protocol |
| Pencarian tidak ketemu | 01 | `App.tsx`, `noteSearch` |
| Performa scroll list | 02, 04 | `NoteList.tsx`, `useListScrollClass` |
| Pengaturan blank | 04 | `SettingsModal.css`, `layouts.css` |
| Styling / tema | 04, 07 | `themes.css`, komponen CSS |
| Build gagal | 02 | `package.json`, `vite.config.ts` |

## Checklist sebelum selesai

- [ ] Tipe di `types.ts` selaras dengan SQLite + `normalizeData`
- [ ] Perubahan skema DB → checklist di [09-DB-MIGRATIONS.md](09-DB-MIGRATIONS.md)
- [ ] Mutasi lewat `useNotesStore` (bukan fetch langsung)
- [ ] Teks UI Bahasa Indonesia
- [ ] Tidak break subfolder (`parentId` model)
- [ ] Update `docs/00-INDEX.md` tabel fitur jika fitur besar
- [ ] `npx tsc --noEmit` lulus
- [ ] `npm run dev` jalan (restart main jika Electron IPC berubah)

## Anti-patterns (jangan lakukan)

| Jangan | Lakukan |
|--------|---------|
| `fs` di komponen React | IPC di main |
| `ALTER TABLE` inline di `sqliteStore` | [09-DB-MIGRATIONS.md](09-DB-MIGRATIONS.md) |
| Duplikasi `interface Note` | Import dari `types.ts` |
| Nested folder array | Tetap flat + `parentId` |
| Simpan gambar base64 di DB | `notes-image://` + folder disk |
| Refactor besar tanpa permintaan | Minimal diff |

## Template respons agent ke user

Setelah selesai tugas, sebutkan:

1. Fitur yang diubah (1 kalimat)
2. File yang disentuh (daftar)
3. Cara uji (`npm run dev` + langkah manual singkat)
4. Dokumen yang perlu di-update jika belum
