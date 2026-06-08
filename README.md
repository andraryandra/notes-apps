# Notes — Electron Notes App

A desktop notes app with a modern UI, built with **Electron**, **React**, **TypeScript**, and **TipTap** (rich text editor).

![Notes dashboard — notes, TODO, schedule, and assets overview](assets/screenshots/dashboard.png)

## Documentation

| Audience | Start here |
|----------|------------|
| **AI agents / new developers** | [AGENTS.md](AGENTS.md) → [docs/00-INDEX.md](docs/00-INDEX.md) |
| **Product & features** | [docs/01-PRODUCT.md](docs/01-PRODUCT.md) |
| **Architecture** | [docs/02-ARCHITECTURE.md](docs/02-ARCHITECTURE.md) |
| **Task-specific file map** | [docs/06-TASK-GUIDE.md](docs/06-TASK-GUIDE.md) |

Cursor project skill: `.cursor/skills/notes-app/SKILL.md`

> Internal docs under `docs/` are written in Indonesian.

## Features

- **Unlimited folders** — create folders and subfolders with no depth limit
- **Tags** — colored labels to organize notes
- **Favorites & pin** — favorites for filtering; pin to keep notes at the top of the list
- **Global search** — search titles and content across all notes
- **Rich text editor** — bold, italic, underline, strikethrough, font size, headings, lists
- **Images & attachments** — upload, paste, drag-and-drop; PDF/Office preview
- **Kanban TODO** — column board with HTML note cards
- **Schedule** — calendar for notes and scheduled cards
- **Dashboard** — overview and data explorer
- **Export** — Markdown, PDF, HTML, plain text
- **Keyboard shortcuts** — Ctrl+N, Ctrl+F, Ctrl+,, Ctrl+Shift+P/E (see Settings)
- **Bulk delete** — select and delete multiple notes at once (with confirmation)
- **Move to folder** — move one or many notes via hierarchical folder picker
- **Confirm dialogs** — modern yes/no prompts for destructive actions
- **UI zoom** — Ctrl+/−/0 or Settings panel
- **Auto-update** — checks GitHub Releases when installed (Settings → Check for updates)
- **14 themes** + classic / focus layout modes
- **SQLite storage** — local `notes.db` with versioned schema migrations
- **Backup & restore** — backup folder (DB + settings + files on disk)

## Running locally

```bash
npm install
npm run dev
```

`npm run dev` opens an Electron window with hot reload.

## Download & install (for everyone)

Pre-built installers are published on **[GitHub Releases](https://github.com/andraryandra/notes-apps/releases)**.

| Platform | File | How to install |
|----------|------|----------------|
| **Linux** | `Notes-*-Linux.AppImage` | Make executable → run, or use `npm run install:app` after building locally |
| **Windows** | `Notes-*-Windows-Setup.exe` | Run the installer, then open **Notes** from the Start menu |
| **macOS** | `Notes-*-macOS.dmg` | Open the DMG, drag **Notes** to Applications |

### Publish a new release (maintainer)

Release otomatis memakai **[Release Please](https://github.com/googleapis/release-please)** + GitHub Actions.

#### Alur (setelah push ke `main`)

```
Commit (format Conventional Commits)
  → workflow "Release Please" membuka/meng-update PR "release"
  → PR berisi bump package.json + CHANGELOG.md
  → Anda merge PR tersebut
  → bot membuat tag vX.Y.Z + GitHub Release (catatan perbaikan)
  → workflow "Release" membangun AppImage / .exe / .dmg + manifest auto-update
```

#### Format pesan commit (penting)

Release Please membaca prefix commit untuk menentukan versi dan isi changelog:

| Prefix | Contoh | Efek versi |
|--------|--------|------------|
| `fix:` | `fix: dialog hapus catatan lag` | patch (1.0.0 → 1.0.1) |
| `feat:` | `feat: pindah catatan ke folder` | minor (1.0.0 → 1.1.0) |
| `feat!:` atau `BREAKING CHANGE:` | `feat!: ubah skema SQLite` | major (1.0.0 → 2.0.0) |
| `chore:` / `docs:` | `docs: update README` | tidak naik versi sendiri* |

\*Commit `chore`/`docs` ikut masuk changelog release berikutnya jika digabung dengan `feat`/`fix`.

Contoh:

```bash
git commit -m "fix: konfirmasi hapus catatan tunggal"
git commit -m "feat: auto-update dari GitHub Releases"
git push origin main
# Cek tab Pull Requests → merge PR "chore(main): release X.Y.Z"
```

#### Setup sekali di GitHub

1. Repo → **Settings** → **Actions** → **General** → Workflow permissions → **Read and write permissions** (Save).
2. Push workflow `.github/workflows/release-please.yml` ke `main` (sudah ada di repo ini).
3. Commit pertama kali mungkin langsung membuat Release PR dari `1.0.0`.

> **Commit lama tanpa prefix `feat:`/`fix:`?**  
> Release Please mengabaikan commit sebelum `bootstrap-sha` di `.github/release-please-config.json` (baseline v1.0.0). Hanya commit baru dengan Conventional Commits yang masuk changelog.

#### Release manual (opsional)

Masih bisa pakai tag manual — workflow `Release` tetap jalan saat push tag `v*`:

```bash
# Edit version di package.json dulu, lalu:
git tag v1.0.0
git push origin v1.0.0
```

Atau **Actions → Release → Run workflow** di GitHub.

## Production build

```bash
npm run build
```

Installers are written to the `release/` folder.

Build for one platform only:

```bash
npm run build:linux   # AppImage (Linux)
npm run build:win     # NSIS installer (Windows)
npm run build:mac     # DMG (macOS)
```

### Install / update AppImage (Linux, local)

```bash
npm run install:app      # copy AppImage to ~/Applications
npm run release:app      # build + copy in one step
npm run install:desktop  # refresh desktop menu entry only
```

## Project structure

```
electron/     → Main process, SQLite, migrations, IPC
src/          → React UI, hooks, components
docs/         → Product docs & agent guides
```

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New note |
| Ctrl+F | Focus search |
| Ctrl+, | Settings |
| Ctrl+Shift+P | Pin / unpin |
| Ctrl+Shift+E | Export Markdown |
| Ctrl + / Ctrl − / Ctrl+0 | Zoom in / out / reset |
| Ctrl+B / Ctrl+I | Bold / Italic (in editor) |

On macOS, use **Cmd** instead of Ctrl.

## Data locations

| Platform | Path |
|----------|------|
| Linux | `~/.config/notes-app/` |
| macOS | `~/Library/Application Support/notes-app/` |
| Windows | `%APPDATA%/notes-app/` |

| File | Contents |
|------|----------|
| `notes.db` | SQLite database |
| `settings.json` | Theme, layout |
| `images/` | Images |
| `attachments/` | File attachments |
