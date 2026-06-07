# 07 — Konvensi Kode

## TypeScript

- `strict: true`
- Hindari `any`; gunakan tipe dari `src/types.ts`
- Named export untuk komponen dan hooks

## React

- Functional components + hooks
- State UI lokal di `App.tsx`; state domain di `useNotesStore`
- Controlled inputs untuk form (modal, judul, search)
- CSS per komponen: `Component.tsx` + `Component.css` di folder sama

## Penamaan

| Jenis | Pola | Contoh |
|-------|------|--------|
| Komponen | PascalCase | `FolderTree` |
| Hook | camelCase + use | `useNotesStore` |
| File komponen | PascalCase.tsx | `NoteList.tsx` |
| CSS class | kebab-case | `note-card` |
| IPC channel | `domain:action` | `data:save` |

## Styling

- Pakai CSS variables dari `global.css`
- Aksen: `var(--accent)`, background: `var(--bg-surface)`
- Jangan inline style kecuali warna tag dinamis (`style={{ color: tag.color }}`)

## TipTap

- Extensions didaftarkan di `RichEditor.tsx`
- Custom extension terpisah di `src/extensions/`
- `content` prop: sync hati-hati di `useEffect` untuk hindari loop (bandingkan HTML)

## Electron

- Semua akses disk di `electron/main.ts` dan `electron/storage/`
- Perubahan skema SQLite → [09-DB-MIGRATIONS.md](09-DB-MIGRATIONS.md)
- Preload tipis: hanya `contextBridge.exposeInMainWorld`
- Jangan tambah `nodeIntegration: true`

## Git & commit

- Pesan commit fokus "why" (Bahasa Indonesia atau Inggris sesuai tim)
- Jangan commit `node_modules`, `dist`, `release`

## Dokumentasi

Saat menambah fitur besar:

1. Update `docs/01-PRODUCT.md` (journey + fitur)
2. Update `docs/03-DATA-MODEL.md` jika ada entitas/IPC baru
3. Update `docs/09-DB-MIGRATIONS.md` jika ada migrasi skema
4. Update tabel di `docs/00-INDEX.md`
4. Update skill jika mengubah alur kerja agent

## Bahasa

- UI: **Bahasa Indonesia**
- Kode (variabel, komentar): Inggris
- Dokumentasi `docs/`: Bahasa Indonesia
