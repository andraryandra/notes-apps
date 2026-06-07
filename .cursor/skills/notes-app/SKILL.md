---
name: notes-app
description: >-
  Develop and maintain the Notes Electron desktop app (React, TipTap, SQLite,
  folders, tags, favorites, pin, kanban, schedule, export, global search).
  Use when working in the notes repository, adding features, fixing bugs in
  useNotesStore, FolderTree, RichEditor, or electron IPC.
---

# Notes App — Skill Proyek

## Wajib dibaca sebelum coding

1. [AGENTS.md](../../AGENTS.md) — routing dokumen
2. [docs/06-TASK-GUIDE.md](../../docs/06-TASK-GUIDE.md) — file mana yang disentuh per tugas
3. **Migrasi DB?** → [docs/09-DB-MIGRATIONS.md](../../docs/09-DB-MIGRATIONS.md) saja (jangan 03/06)

Baca **hanya** dokumen tambahan yang relevan, jangan scan seluruh `src/`.

## Prinsip inti

- **Data:** `AppData` flat → persist ke **SQLite** (`notes.db`); folder = `parentId`.
- **Migrasi DB:** panduan hanya di `docs/09-DB-MIGRATIONS.md`.
- **Mutasi:** hanya `src/hooks/useNotesStore.ts` + IPC `saveData`.
- **Tipe:** hanya `src/types.ts`.
- **Gambar/lampiran:** `notes-image://` / `notes-file://` di disk via main.
- **UI:** Bahasa Indonesia.

## Alur kerja agent

```
1. Klasifikasi tugas (fitur / bug / editor / data / migrasi / build)
2. Migrasi? → 09-DB-MIGRATIONS. Lainnya → 06-TASK-GUIDE
3. Buka 03-DATA-MODEL jika entitas/IPC (bukan langkah migrasi)
4. Edit minimal file
5. Update docs jika fitur besar
```

## Referensi cepat IPC

| API | Kapan |
|-----|-------|
| `loadData` / `saveData` | Init & persist SQLite |
| `loadNoteContent` | Lazy load HTML catatan |
| `uploadImage` / `saveImageBuffer` | Gambar |
| `exportNote` | Ekspor MD/PDF/HTML/TXT |
| `exportBackup` / restore | Backup folder |

## File sacrosanct

| File | Jangan duplikasi logika di tempat lain |
|------|--------------------------------------|
| `src/types.ts` | Interface domain |
| `useNotesStore.ts` | CRUD + debounced save |
| `docs/09-DB-MIGRATIONS.md` | Satu-satunya panduan tambah migrasi |
| `electron/main.ts` | IPC, protocol, export |

## Perintah verifikasi

```bash
npm install
npm run dev
npx tsc --noEmit
```

## Detail lanjutan

- [reference.md](reference.md) — ringkasan entitas & filter logic
