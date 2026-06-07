# Panduan Agent AI — Notes App

**Baca file ini dulu.** Jangan scan seluruh repo kecuali tugas Anda membutuhkannya.

## Langkah cepat (30 detik)

| Pertanyaan | Buka |
|------------|------|
| Apa produk ini & fitur apa saja? | [docs/01-PRODUCT.md](docs/01-PRODUCT.md) |
| Arsitektur & alur data? | [docs/02-ARCHITECTURE.md](docs/02-ARCHITECTURE.md) |
| Model data & IPC? | [docs/03-DATA-MODEL.md](docs/03-DATA-MODEL.md) |
| Layout UI & komponen? | [docs/04-UI-MAP.md](docs/04-UI-MAP.md) |
| File mana untuk tugas X? | [docs/05-FILE-MAP.md](docs/05-FILE-MAP.md) + [docs/06-TASK-GUIDE.md](docs/06-TASK-GUIDE.md) |
| Konvensi kode? | [docs/07-CONVENTIONS.md](docs/07-CONVENTIONS.md) |
| Setup & persiapan AI? | [docs/08-PERSIAPAN-AI.md](docs/08-PERSIAPAN-AI.md) |
| **Migrasi skema SQLite?** | **[docs/09-DB-MIGRATIONS.md](docs/09-DB-MIGRATIONS.md)** |
| Indeks lengkap? | [docs/00-INDEX.md](docs/00-INDEX.md) |

## Skill proyek

```
.cursor/skills/notes-app/SKILL.md
```

## Aturan kerja agent

1. **Minimal scope** — ubah hanya file yang disebut di [docs/06-TASK-GUIDE.md](docs/06-TASK-GUIDE.md).
2. **Satu sumber kebenaran tipe** — `src/types.ts`.
3. **State & persist** — mutasi lewat `useNotesStore`; jangan tulis disk dari renderer.
4. **Skema DB** — hanya lewat migrasi; panduan lengkap di [docs/09-DB-MIGRATIONS.md](docs/09-DB-MIGRATIONS.md).
5. **Gambar** — referensi `notes-image://`; resolve base64 hanya untuk tampilan editor.
6. **Folder** — pohon via `parentId` (flat array); jangan nested JSON.
7. **Bahasa UI** — Bahasa Indonesia.

## Stack (ringkas)

Electron 34 + Vite 6 + React 18 + TypeScript + TipTap 2 + SQLite (`better-sqlite3`).

## Perintah

```bash
npm install
npm run dev      # development (Electron + HMR)
npm run build    # production build
npx tsc --noEmit # cek tipe
```

## Diagram alur baca dokumen

```
User request
     │
     ▼
 AGENTS.md (Anda di sini)
     │
     ├─► Fitur / UX baru?     → 01-PRODUCT + 04-UI-MAP + 06-TASK-GUIDE
     ├─► Bug data / save?     → 03-DATA-MODEL + useNotesStore + sqliteStore
     ├─► Migrasi DB?          → 09-DB-MIGRATIONS (bukan 03 / 06)
     ├─► Editor / format?     → RichEditor + extensions/FontSize
     ├─► Folder / tag / pin?  → FolderTree + useNotesStore + App filter
     └─► Infra / build?       → 02-ARCHITECTURE + package.json + vite.config
```
