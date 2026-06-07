# 05 — Peta File (Quick Reference)

```
notes/
├── AGENTS.md                 ← START untuk AI
├── README.md                 ← User: install & run
├── package.json
├── vite.config.ts
├── index.html
├── docs/                     ← Dokumentasi produk (folder ini)
├── .cursor/
│   ├── rules/notes-app.mdc
│   └── skills/notes-app/SKILL.md
├── electron/
│   ├── main.ts               ← IPC, protocol, window, export PDF
│   ├── preload.ts            ← electronAPI bridge
│   ├── normalizeData.ts      ← Default field data lama
│   ├── storage/
│   │   ├── index.ts          ← createDataStore, backup helpers
│   │   ├── sqliteStore.ts    ← CRUD SQLite
│   │   ├── storedFilesRepo.ts← Metadata file di disk
│   │   ├── jsonStore.ts      ← Legacy (referensi)
│   │   └── migrations/
│   │       ├── index.ts, registry.ts, helpers.ts, types.ts
│   │       └── versions/     ← skrip migrasi saja (lihat 09-DB-MIGRATIONS)
│   └── storageFiles.ts       ← Sync referensi file HTML ↔ DB
└── src/
    ├── main.tsx
    ├── App.tsx               ← Root layout + filter + pintasan
    ├── types.ts              ← SEMUA interface domain
    ├── config/
    │   ├── appearance.ts     ← Tema & layout
    │   ├── keyboardShortcuts.ts
    │   └── storage.ts
    ├── hooks/
    │   ├── useNotesStore.ts  ← State + persist + CRUD
    │   ├── useGlobalShortcuts.ts
    │   ├── useAppearance.ts
    │   ├── useListScrollClass.ts
    │   └── useToast.tsx
    ├── utils/
    │   ├── exportNote.ts     ← exportNoteFile, sortNotesForList
    │   └── …
    ├── extensions/
    │   └── FontSize.ts
    ├── components/           ← UI (tsx + css)
    └── styles/
        ├── themes.css
        ├── layouts.css
        └── App.css
```

## File → ubah ketika...

| File | Ubah jika tugas tentang... |
|------|---------------------------|
| `electron/main.ts` | IPC baru, protocol, export, window |
| `electron/preload.ts` | Expose API ke renderer |
| `electron/storage/migrations/` | **Hanya** saat migrasi skema — baca [09-DB-MIGRATIONS.md](09-DB-MIGRATIONS.md) |
| `electron/storage/sqliteStore.ts` | Query load/save SQLite |
| `electron/normalizeData.ts` | Default field entitas |
| `src/types.ts` | Field entity baru, ElectronAPI |
| `src/hooks/useNotesStore.ts` | Logika CRUD, debounce, lazy load |
| `src/hooks/useGlobalShortcuts.ts` | Pintasan keyboard global |
| `src/config/keyboardShortcuts.ts` | Daftar pintasan (UI Pengaturan) |
| `src/App.tsx` | Filter view, routing UI, wire pintasan |
| `src/components/NoteList.*` | Kartu daftar, pin, bulk delete, virtual list |
| `src/components/NoteEditor.*` | Header editor, ekspor, pin |
| `src/components/SettingsModal.*` | Pengaturan & pintasan |
| `src/components/RichEditor.*` | Toolbar, TipTap, gambar/lampiran |
| `src/components/FolderTree.*` | UX folder tree |
| `src/utils/exportNote.ts` | Helper ekspor & sort daftar |

## File yang jarang perlu disentuh

- `tsconfig*.json`, `vite.config.ts` — kecuali upgrade tooling
- `electron/storage/jsonStore.ts` — legacy
- `TitleBar.*` — kecuali integrasi window controls

## Ukuran perkiraan (untuk prioritas baca)

| File | Baris ~ | Kompleksitas |
|------|---------|--------------|
| App.tsx | 650 | Tinggi (multi-view + filter) |
| useNotesStore.ts | 650 | Tinggi |
| electron/main.ts | 850 | Tinggi (IPC banyak) |
| RichEditor.tsx | 400+ | Tinggi (TipTap) |
| NoteList.tsx | 400 | Sedang (virtual list) |
| sqliteStore.ts | 300 | Sedang |

**Total src + electron ~ 8000+ baris** — dokumen ini menggantikan membaca semuanya untuk orientasi.
