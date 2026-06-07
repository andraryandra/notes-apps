# Notes App — Referensi Skill

## AppData (ringkas)

```typescript
// src/types.ts
AppData {
  folders, notes, tags,
  todos[],           // legacy
  kanbanGroups, kanbanColumns, kanbanCards
}
Note {
  id, title, content, contentPreview?, contentLoaded?,
  folderId, tagIds[], favorite, pinned, scheduledAt,
  createdAt, updatedAt
}
```

## Sort daftar catatan

```typescript
// src/utils/exportNote.ts — sortNotesForList
pinned first → updatedAt desc
```

## Filter notes (App.tsx)

```
if searchQuery → filter all notes by title + content
else if sidebarView === 'favorites' → favorite
else if sidebarView === 'folder' → folderId in subtree
else if sidebarView === 'tag' → tagIds includes selectedTagId
else if sidebarView === 'dashboard'|'todos'|'schedule' → view khusus (bukan NoteList filter)
else → all notes
```

## Store methods (penting)

`createFolder`, `renameFolder`, `deleteFolder`, `createNote`, `updateNote`, `deleteNote`, `deleteNotes`, `toggleFavorite`, `togglePin`, `createTag`, `deleteTag`, `toggleNoteTag`, `ensureNoteContent`, kanban CRUD

## Lokasi data user

`app.getPath('userData')` → `notes.db` + `settings.json` + `images/` + `attachments/`

Migrasi skema → [docs/09-DB-MIGRATIONS.md](../../docs/09-DB-MIGRATIONS.md)

## TipTap stack

StarterKit + Underline + TextStyle + Color + FontSize (custom) + Image + Placeholder + node lampiran kustom
