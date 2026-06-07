# 04 — Peta UI & Komponen

## Hierarki komponen

```
App
├── TitleBar (⚙ pengaturan, toggle drawer fokus)
├── Sidebar
│   ├── GlobalSearch (#global-search-input)
│   ├── nav (Dashboard, Semua, Favorit, TODO, Jadwal)
│   ├── FolderTree → FolderNode (rekursif)
│   ├── tags-section
│   └── kanban-groups (grup TODO)
├── [View aktif]
│   ├── DashboardPanel
│   ├── NoteList (+ NoteContextMenu)
│   ├── NoteEditor | EmptyState
│   ├── KanbanPanel + KanbanCardEditor
│   └── SchedulePanel + ScheduleListPanel
├── GlobalAssetsPanel (overlay)
├── SettingsModal
└── PromptModal (folder / tag / kanbanGroup)
```

## Tanggung jawab komponen

| Komponen | File | Tanggung jawab |
|----------|------|----------------|
| `App` | `src/App.tsx` | State global UI, filter, pintasan, modal |
| `TitleBar` | `components/TitleBar.tsx` | Drag region, pengaturan |
| `Sidebar` | `components/Sidebar.tsx` | Search + nav + folder + tag + kanban |
| `GlobalSearch` | `components/GlobalSearch.tsx` | Input pencarian (Ctrl+F) |
| `FolderTree` | `components/FolderTree.tsx` | Pohon folder, CRUD UI |
| `NoteList` | `components/NoteList.tsx` | Virtual list kartu, pin, bulk delete |
| `NoteContextMenu` | `components/NoteContextMenu.tsx` | Menu kanan: pin, favorit, hapus |
| `NoteEditor` | `components/NoteEditor.tsx` | Judul, pin, favorit, ekspor, meta |
| `NoteMetaPanel` | `components/NoteMetaPanel.tsx` | Tag, jadwal, link kanban |
| `NoteAssetsSidebar` | `components/NoteAssetsSidebar.tsx` | Daftar gambar/file/link di catatan |
| `RichEditor` | `components/RichEditor.tsx` | TipTap + toolbar |
| `DashboardPanel` | `components/DashboardPanel.tsx` | Ringkasan & jelajahi |
| `KanbanPanel` | `components/KanbanPanel.tsx` | Papan kolom + kartu |
| `KanbanCardEditor` | `components/KanbanCardEditor.tsx` | Editor kartu TODO |
| `SchedulePanel` | `components/SchedulePanel.tsx` | Kalender jadwal |
| `ScheduleListPanel` | `components/ScheduleListPanel.tsx` | Daftar item terjadwal |
| `SettingsModal` | `components/SettingsModal.tsx` | Tema, layout, pintasan, backup, file |
| `GlobalAssetsPanel` | `components/GlobalAssetsPanel.tsx` | Semua aset lintas catatan |
| `EmptyState` | `components/EmptyState.tsx` | Placeholder |

## CSS

- **Token global:** `src/styles/themes.css`, `src/styles/global.css`
- **Layout:** `src/styles/layouts.css`, `src/styles/App.css`
- **Per komponen:** `ComponentName.css` di folder yang sama

Tema via `data-theme` (14 pilihan). Token favorit: `--favorite-from`, `--favorite-to`, dll.

## Lebar layout (mode klasik)

| Variable | Nilai | Panel |
|----------|-------|-------|
| `--sidebar-width` | 260px | Sidebar |
| `--list-width` | 280px | NoteList |
| sisa | flex 1 | Editor / view lain |

Mode **fokus:** editor full width; NoteList jadi drawer overlay.

## Interaksi NoteList

| Aksi | Trigger |
|------|---------|
| Pilih catatan | Klik kartu |
| Pin | Ikon pin di kartu / menu kanan / Ctrl+Shift+P (via editor) |
| Favorit | Ikon bintang |
| Hapus | Ikon trash / menu kanan |
| Hapus bulk | Mode pilih → checkbox → hapus terpilih |
| Menu konteks | Klik kanan kartu |

## NoteEditor header

Tombol (kiri→kanan): kembali (opsional) → judul input → status save → folder path → panel aset → **ekspor** → **pin** → **favorit**.

Menu ekspor: Markdown, PDF, HTML, Teks.

## RichEditor toolbar

Grup: format teks → font size → struktur → gambar → lampiran → tags.

## Props penting (untuk agent)

### Sidebar

- `onViewChange(view, folderId?, tagId?)`
- `sidebarView`: `'dashboard' | 'all' | 'favorites' | 'folder' | 'tag' | 'todos' | 'schedule'`
- `noteCounts`: all, favorites, todosActive, schedule

### NoteList

- `notes` sudah difilter dari App; di-sort internal (`sortNotesForList`)
- `onTogglePin`, `onToggleFavorite`, `onDeleteMany`

### SettingsModal

- Tema, layout, scroll batch, pintasan, storage, backup

## Aksesibilitas

Baseline: `role="button"` di kartu catatan. Belum audit WCAG penuh.
