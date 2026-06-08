# Dokumentasi Notes App — Indeks

Dokumentasi ini dirancang agar **agent AI dan developer** bisa bekerja tanpa membaca seluruh codebase.

## Urutan baca yang disarankan

| No | Dokumen | Isi | Waktu baca |
|----|---------|-----|------------|
| 0 | [AGENTS.md](../AGENTS.md) | Pintu masuk agent | 1 min |
| 1 | [01-PRODUCT.md](01-PRODUCT.md) | Visi, fitur, alur pengguna | 5 min |
| 2 | [02-ARCHITECTURE.md](02-ARCHITECTURE.md) | Lapisan sistem, diagram | 4 min |
| 3 | [03-DATA-MODEL.md](03-DATA-MODEL.md) | Entitas, IPC, penyimpanan | 5 min |
| 4 | [04-UI-MAP.md](04-UI-MAP.md) | Layout, komponen, state UI | 4 min |
| 5 | [05-FILE-MAP.md](05-FILE-MAP.md) | Peta file → tanggung jawab | 3 min |
| 6 | [06-TASK-GUIDE.md](06-TASK-GUIDE.md) | Tugas umum → file yang disentuh | 4 min |
| 7 | [07-CONVENTIONS.md](07-CONVENTIONS.md) | Gaya kode & batasan | 2 min |
| 8 | [08-PERSIAPAN-AI.md](08-PERSIAPAN-AI.md) | Setup agent, checklist, maintenance | 3 min |
| 9 | [09-DB-MIGRATIONS.md](09-DB-MIGRATIONS.md) | **Migrasi skema SQLite** (khusus) | 4 min |

## Artefak pendukung AI

| Artefak | Lokasi | Fungsi |
|---------|--------|--------|
| Skill proyek | `.cursor/skills/notes-app/SKILL.md` | Instruksi kerja khusus Notes |
| Rule Cursor | `.cursor/rules/notes-app.mdc` | Mengingatkan agent baca AGENTS.md |
| README user | [README.md](../README.md) | Instalasi & menjalankan app |

## Persiapan sebelum agent mengerjakan tugas

1. Baca **AGENTS.md** → tentukan kategori tugas.
2. Buka **01-PRODUCT** jika menyentuh fitur/UX.
3. Buka **05-FILE-MAP** + **06-TASK-GUIDE** → batasi file yang diedit.
4. Buka **03-DATA-MODEL** jika menyentuh data, folder, tag, atau gambar.
5. Buka **09-DB-MIGRATIONS** jika menyentuh kolom/tabel SQLite — **jangan** cari langkah migrasi di dokumen lain.
6. Jalankan `npm run dev` untuk verifikasi manual jika memungkinkan.

## Status implementasi fitur

| Fitur | Status | Catatan |
|-------|--------|---------|
| Folder tak terbatas | ✅ | `parentId` tree |
| Tags | ✅ | Many-to-many via `note.tagIds` |
| Favorit | ✅ | `note.favorite` + filter view + styling amber |
| Pin | ✅ | `note.pinned` — urutan di atas daftar (beda favorit) |
| Pencarian global | ✅ | Judul + strip HTML konten |
| Rich text editor | ✅ | TipTap + FontSize extension |
| Gambar & lampiran | ✅ | `notes-image://`, `notes-file://`, IPC file |
| Kanban / TODO | ✅ | Grup, kolom, kartu dengan konten HTML |
| Jadwal (Schedule) | ✅ | Kalender + daftar; `scheduledAt` pada catatan/kartu |
| Dashboard | ✅ | Ringkasan & jelajahi data |
| Penyimpanan SQLite | ✅ | `notes.db` + migrasi berversi |
| Backup & restore | ✅ | Folder backup (DB + settings + file disk) |
| Tema & layout | ✅ | 14 tema, mode klasik / fokus |
| Pintasan keyboard global | ✅ | Ctrl+N/F/,/Shift+P/E; panel di Pengaturan |
| Ekspor catatan | ✅ | MD, PDF, HTML, TXT via IPC |
| Hapus bulk catatan | ✅ | Mode pilih di daftar catatan + konfirmasi |
| Konfirmasi hapus (dialog) | ✅ | Catatan, folder, file backup — `ConfirmDialog` |
| Pindah catatan ke folder | ✅ | Bulk & tunggal + `FolderPicker` hierarki |
| Zoom UI | ✅ | Ctrl+/−/0 + Pengaturan |
| Auto-update (GitHub) | ✅ | `electron-updater`; cek otomatis + manual di Pengaturan |
| Ekspor PDF dengan gambar | ✅ | Inline `notes-image://` → data URL saat ekspor |
| Virtual list (performa) | ✅ | `@tanstack/react-virtual` di NoteList |
| Lazy load konten catatan | ✅ | Preview ringkas; muat penuh saat dibuka |
| Migrasi skema DB | ✅ | Lihat [09-DB-MIGRATIONS.md](09-DB-MIGRATIONS.md) |
| Cloud sync | ❌ | — |
| Enkripsi catatan | ❌ | — |

Update tabel ini saat menambah fitur besar.
