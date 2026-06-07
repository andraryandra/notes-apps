# Notes — Aplikasi Catatan Electron

Aplikasi catatan desktop dengan UI modern, dibangun dengan **Electron**, **React**, **TypeScript**, dan **TipTap** (rich text editor).

## Dokumentasi

| Audiens | Mulai dari |
|---------|------------|
| **Agent AI / developer baru** | [AGENTS.md](AGENTS.md) → [docs/00-INDEX.md](docs/00-INDEX.md) |
| **Alur produk & fitur** | [docs/01-PRODUCT.md](docs/01-PRODUCT.md) |
| **Arsitektur** | [docs/02-ARCHITECTURE.md](docs/02-ARCHITECTURE.md) |
| **Tugas spesifik (file mana)** | [docs/06-TASK-GUIDE.md](docs/06-TASK-GUIDE.md) |

Skill Cursor proyek: `.cursor/skills/notes-app/SKILL.md`

## Fitur

- **Folder tak terbatas** — buat folder dan subfolder tanpa batas kedalaman
- **Tags** — label warna untuk mengorganisir catatan
- **Favorit & Pin** — favorit untuk filter; pin untuk urutan di atas daftar
- **Pencarian global** — cari di judul dan isi semua catatan
- **Editor rich text** — bold, italic, underline, strikethrough, ukuran font, heading, list
- **Gambar & lampiran** — upload, paste, drag-drop; preview PDF/Office
- **Kanban TODO** — papan kolom dengan kartu berisi catatan HTML
- **Jadwal** — kalender catatan & kartu terjadwal
- **Dashboard** — ringkasan dan jelajahi data
- **Ekspor** — Markdown, PDF, HTML, Teks
- **Pintasan keyboard** — Ctrl+N, Ctrl+F, Ctrl+,, Ctrl+Shift+P/E (lihat Pengaturan)
- **Hapus bulk** — pilih banyak catatan sekaligus
- **14 tema** + mode layout klasik / fokus
- **Penyimpanan SQLite** — `notes.db` lokal dengan migrasi skema berversi
- **Backup & restore** — folder backup (DB + settings + file disk)

## Menjalankan

```bash
npm install
npm run dev
```

Perintah `npm run dev` akan membuka jendela Electron dengan hot reload.

## Build produksi

```bash
npm run build
```

Output installer ada di folder `release/`.

### Pasang / update AppImage (Linux)

```bash
npm run install:app      # salin AppImage ke ~/Applications
npm run release:app      # build + salin sekaligus
npm run install:desktop  # daftar ulang menu desktop saja
```

## Struktur

```
electron/     → Main process, SQLite, migrasi, IPC
src/          → React UI, hooks, komponen
docs/         → Dokumentasi produk & panduan agent
```

## Pintasan keyboard

| Pintasan | Fungsi |
|----------|--------|
| Ctrl+N | Catatan baru |
| Ctrl+F | Fokus pencarian |
| Ctrl+, | Pengaturan |
| Ctrl+Shift+P | Pin / lepas pin |
| Ctrl+Shift+E | Ekspor Markdown |
| Ctrl+B / Ctrl+I | Bold / Italic (di editor) |

Di macOS gunakan **Cmd** sebagai pengganti Ctrl.

## Data

| Platform | Lokasi |
|----------|--------|
| Linux | `~/.config/notes-app/` |
| macOS | `~/Library/Application Support/notes-app/` |
| Windows | `%APPDATA%/notes-app/` |

| File | Isi |
|------|-----|
| `notes.db` | Database SQLite |
| `settings.json` | Tema, layout |
| `images/` | Gambar |
| `attachments/` | Lampiran file |
# notes-apps
# notes-apps
