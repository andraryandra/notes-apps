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

## Branch workflow

| Branch | Purpose |
|--------|---------|
| `development` | Day-to-day development — push commits here |
| `main` | Production & releases — merging from `development` triggers Release Please + installer builds |

Recommended flow:

```bash
git checkout development
# ... edit, commit with feat: / fix: ...
git push origin development

# Ready to ship → open a PR development → main on GitHub, then merge
# Release Please + auto-merge + build run automatically on main
```

Release Please and auto-merge run **only** on push/merge to `main`, not on `development`.

## Download & install (for everyone)

Pre-built installers are published on **[GitHub Releases](https://github.com/andraryandra/notes-apps/releases)**.

| Platform | File | How to install |
|----------|------|----------------|
| **Linux** | `Notes-*-Linux.AppImage` | Make executable → run, or use `npm run install:app` after building locally |
| **Windows** | `Notes-*-Windows-Setup.exe` | Run the installer, then open **Notes** from the Start menu |
| **macOS** | `Notes-*-macOS.dmg` | Open the DMG, drag **Notes** to Applications |

### Publish a new release (maintainer)

Releases are automated with **[Release Please](https://github.com/googleapis/release-please)** + GitHub Actions.

#### Flow (after push to `main`)

```
Commit (Conventional Commits format)
  → "Release Please" workflow opens/updates a release PR
  → PR bumps package.json + CHANGELOG.md
  → "Auto-merge Release PR" workflow merges the PR automatically
  → bot creates tag vX.Y.Z + GitHub Release (release notes)
  → "Release" workflow builds AppImage / .exe / .dmg + auto-update manifests
```

#### Commit message format (required)

Release Please uses commit prefixes to determine version bumps and changelog entries:

| Prefix | Example | Version bump |
|--------|---------|--------------|
| `fix:` | `fix: fix lag on delete confirmation dialog` | patch (1.0.0 → 1.0.1) |
| `feat:` | `feat: move notes to folder` | minor (1.0.0 → 1.1.0) |
| `feat!:` or `BREAKING CHANGE:` | `feat!: change SQLite schema` | major (1.0.0 → 2.0.0) |
| `chore:` / `docs:` | `docs: update README` | no bump on its own* |

\*`chore`/`docs` commits are included in the next release changelog when combined with `feat`/`fix` commits.

Example:

```bash
git commit -m "fix: confirm before deleting a single note"
git commit -m "feat: auto-update from GitHub Releases"
git push origin main
# Release PR is auto-merged → tag + installer build run automatically
```

#### One-time GitHub setup

1. Repo → **Settings** → **Actions** → **General** → Workflow permissions → **Read and write permissions** (Save).
2. Enable **Allow GitHub Actions to create and approve pull requests** (same page).
3. Workflows live in `.github/workflows/` (already in this repo).
4. The first run may open a Release PR from `1.0.0` (then auto-merge).

> **Old commits without `feat:`/`fix:`?**  
> Release Please ignores commits before `bootstrap-sha` in `.github/release-please-config.json` (baseline v1.0.0). Only new Conventional Commits are included in the changelog.

#### Manual release (optional)

You can still push a tag manually — the `Release` workflow runs on any `v*` tag:

```bash
# Bump version in package.json first, then:
git tag v1.0.0
git push origin v1.0.0
```

Or run **Actions → Release → Run workflow** on GitHub.

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
