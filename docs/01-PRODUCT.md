# 01 — Produk & Alur Pengguna

## Ringkasan produk

**Notes** adalah aplikasi catatan desktop (Electron) untuk menulis, mengorganisir, dan menemukan catatan dengan folder bersarang, tag, favorit, pin, kanban TODO, jadwal, dan editor rich text.

## Persona & kebutuhan

| Persona | Kebutuhan utama |
|---------|-----------------|
| Peneliti / mahasiswa | Catatan panjang, gambar, lampiran, folder per topik |
| Pengguna harian | Cepat buat catatan, favorit, pin, cari global |
| Power user | Subfolder dalam, banyak tag, kanban, jadwal, ekspor |

## Fitur inti

### 1. Folder (subfolder tak terbatas)

- Folder disimpan datar dengan `parentId`.
- UI menampilkan pohon expandable.
- Aksi: buat root, buat subfolder (+ di baris folder), rename (double-click atau menu), hapus (beserta semua subfolder).
- Saat folder dihapus, catatan di dalamnya dipindah ke **tanpa folder** (`folderId: null`), tidak dihapus.

### 2. Tags

- Tag global dengan `name` + `color`.
- Satu catatan bisa punya banyak tag (`note.tagIds`).
- Toggle tag dari toolbar editor atau panel meta.
- Filter sidebar per tag.
- Hapus tag menghapus referensi di semua catatan.

### 3. Favorit vs Pin

| | Favorit | Pin |
|---|---------|-----|
| Field | `note.favorite` | `note.pinned` |
| Efek | Filter view "Favorit" + styling amber di kartu | Catatan selalu di **atas daftar** (sort: pin dulu, lalu `updatedAt`) |
| Toggle | Bintang di kartu / header editor / menu kanan | Ikon pin di kartu / header editor / menu kanan |
| Pintasan | — | Ctrl+Shift+P (catatan aktif) |

Keduanya independen — catatan bisa favorit saja, pin saja, atau keduanya.

### 4. Pencarian global

- Input di atas sidebar (`id="global-search-input"`).
- Pintasan **Ctrl+F** (Cmd+F di macOS) fokus ke input ini.
- Saat ada query: **abaikan filter sidebar**, cari di semua catatan.
- Mencocokkan: `title` (lowercase) dan teks polos dari `content` HTML.

### 5. Editor rich text

| Kemampuan | Cara |
|-----------|------|
| Bold / Italic / Underline / Strikethrough | Toolbar |
| Ukuran font | Dropdown 12px–32px |
| Heading 1 & 2 | Toolbar |
| Bullet & numbered list | Toolbar |
| Horizontal rule | Toolbar |
| Gambar | Upload dialog, paste clipboard, drag-drop |
| Lampiran file | Upload PDF, Office, dll. |

Konten disimpan sebagai **HTML string** di `note.content`.

### 6. Daftar catatan (panel tengah)

- Diurutkan: **pin dulu**, lalu `updatedAt` terbaru.
- Preview teks polos (`contentPreview` dari DB, lazy load konten penuh).
- Tampilkan path folder, tag chips, jadwal, jumlah TODO terkait.
- **Hapus bulk:** mode pilih (checkbox) → hapus banyak sekaligus.
- Virtual scroll (`@tanstack/react-virtual`) untuk performa daftar panjang.

### 7. Kanban / TODO

- Grup kanban di sidebar (papan per proyek/topik).
- Kolom kustom per grup; kartu berisi judul + konten HTML.
- Kartu bisa ditautkan ke catatan (`linkedNoteId`).
- Due date & jadwal per kartu.

### 8. Jadwal (Schedule)

- Kalender bulanan + daftar item terjadwal.
- Catatan dengan `scheduledAt` dan kartu kanban dengan `dueAt` / `scheduledAt`.
- Jadwalkan catatan baru atau tautkan catatan yang ada ke tanggal.

### 9. Dashboard

- Ringkasan statistik dan akses cepat ke catatan, tag, aset global.
- Jelajahi data dengan infinite scroll.

### 10. Ekspor catatan

- Menu **Download** di header editor: Markdown, PDF, HTML, Teks.
- Pintasan **Ctrl+Shift+E** → ekspor Markdown catatan aktif.
- Implementasi: IPC `exportNote` di main process (PDF via `printToPDF`).

### 11. Pengaturan

- **Tema:** 14 pilihan warna.
- **Layout:** klasik (3 kolom) atau fokus (editor penuh + drawer daftar).
- **Infinite scroll:** batch size daftar.
- **Pintasan keyboard:** tabel referensi.
- **Penyimpanan:** info DB, kelola file gambar/lampiran, backup & restore.

## Pintasan keyboard (global)

| Pintasan | Fungsi |
|----------|--------|
| Ctrl+N | Buat catatan baru |
| Ctrl+F | Fokus pencarian global |
| Ctrl+, | Buka pengaturan |
| Ctrl+Shift+P | Pin / lepas pin catatan aktif |
| Ctrl+Shift+E | Ekspor catatan aktif (Markdown) |
| Esc | Tutup pengaturan / drawer daftar |

Di macOS gunakan **Cmd** sebagai pengganti Ctrl. Daftar lengkap di Pengaturan.

## Alur pengguna (user journeys)

### J1 — Buat catatan di folder

```
Klik folder di sidebar
  → Klik "+" di daftar catatan (atau Ctrl+N)
  → Catatan baru dengan folderId = folder aktif
  → Tulis judul & isi di editor
  → Auto-save (debounce ~400ms)
```

### J2 — Pin catatan ke atas daftar

```
Buka catatan → klik ikon pin di header
  ATAU Ctrl+Shift+P
  ATAU klik kanan kartu → "Pin ke atas"
  → Catatan muncul di atas daftar (tanpa mengubah filter favorit)
```

### J3 — Cari catatan

```
Ctrl+F atau klik kotak pencarian
  → Ketik query
  → Daftar menampilkan semua catatan yang cocok
  → Judul panel: Hasil: "query"
```

### J4 — Ekspor ke PDF

```
Buka catatan → ikon Download di header
  → Pilih PDF (.pdf)
  → Dialog simpan file OS
```

### J5 — Hapus banyak catatan

```
Daftar catatan → mode pilih (checkbox)
  → Centang catatan → Hapus terpilih
```

### J6 — Sisipkan gambar

```
Toolbar ImagePlus → dialog file
  ATAU paste / drag gambar ke editor
  → Main process simpan ke userData/images/
  → URL notes-image:// disimpan di HTML
```

## Layout layar

### Mode klasik (default)

```
┌─────────────────────────────────────────────────────────────┐
│ TitleBar (⚙ Pengaturan)                                     │
├──────────┬──────────────┬──────────────────────────────────┤
│ Sidebar  │ NoteList     │ NoteEditor / EmptyState / …      │
│ - Search │ - Kartu      │ - Judul, pin, favorit, ekspor    │
│ - Dash   │   catatan    │ - Toolbar TipTap                 │
│ - All    │              │ - Panel meta (tag, jadwal)       │
│ - Fav    │              │ - Panel aset (opsional)          │
│ - Folder │              │                                  │
│ - Tags   │              │                                  │
│ - TODO   │              │                                  │
│ - Jadwal │              │                                  │
└──────────┴──────────────┴──────────────────────────────────┘
```

View khusus (menggantikan NoteList + Editor): **Dashboard**, **Kanban**, **Jadwal**.

### Mode fokus

Editor memenuhi layar; daftar catatan jadi drawer (toggle dari title bar).

## State UI utama (di `App.tsx`)

| State | Tipe | Fungsi |
|-------|------|--------|
| `searchQuery` | string | Pencarian global |
| `sidebarView` | `SidebarView` | View aktif (dashboard, all, favorites, folder, tag, todos, schedule) |
| `selectedFolderId` | string \| null | Folder dipilih |
| `selectedTagId` | string \| null | Tag dipilih |
| `selectedNoteId` | string \| null | Catatan dibuka |
| `selectedKanbanGroupId` | string \| null | Grup kanban aktif |
| `selectedKanbanCardId` | string \| null | Kartu kanban aktif |
| `showSettings` | boolean | Modal pengaturan |
| `noteListDrawerOpen` | boolean | Drawer daftar (layout fokus) |
| `modal` | folder \| tag \| kanbanGroup \| null | Modal buat entitas |

## Batasan produk saat ini

- Tidak ada sinkronisasi cloud / multi-device.
- Tidak ada enkripsi catatan.
- Gambar `notes-image://` mungkin belum tampil sempurna di ekspor PDF.
- Tidak ada undo history global.
- Titlebar window controls belum terhubung ke Electron (dekoratif).

## Glosarium

| Istilah | Arti |
|---------|------|
| Catatan (Note) | Satu entri dengan judul + HTML content |
| Folder | Kontainer organisasi; bisa bersarang |
| Tag | Label lintas folder |
| Favorit | Tandai penting + filter view |
| Pin | Pin ke atas urutan daftar |
| View | Mode sidebar (all, favorites, folder, tag, todos, schedule, dashboard) |
| Kartu kanban | Item TODO dengan konten HTML di papan kanban |
