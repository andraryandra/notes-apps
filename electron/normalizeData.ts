import type { AppData, KanbanCard, KanbanColumn, KanbanGroup, Note, TodoItem, TodoStatus } from '../src/types';
import { migrateTodosToKanban } from '../src/utils/kanbanMigrate';

function normalizeNote(raw: Note & { scheduledAt?: number | null; pinned?: boolean }): Note {
  return {
    ...raw,
    scheduledAt: raw.scheduledAt ?? null,
    pinned: raw.pinned ?? false,
  };
}

function normalizeTodoStatus(raw: TodoItem & { status?: TodoStatus }): TodoStatus {
  if (raw.status === 'todo' || raw.status === 'doing' || raw.status === 'done') {
    return raw.done && raw.status !== 'done' ? 'done' : raw.status;
  }
  return raw.done ? 'done' : 'todo';
}

function normalizeTodo(raw: TodoItem & { status?: TodoStatus }): TodoItem {
  const status = normalizeTodoStatus(raw);
  return {
    ...raw,
    status,
    done: status === 'done',
    noteId: raw.noteId ?? null,
    dueAt: raw.dueAt ?? null,
  };
}

function normalizeKanbanCard(raw: KanbanCard): KanbanCard {
  return {
    ...raw,
    content: raw.content ?? '',
    dueAt: raw.dueAt ?? null,
    scheduledAt: raw.scheduledAt ?? null,
    linkedNoteId: raw.linkedNoteId ?? null,
    order: raw.order ?? 0,
  };
}

export function normalizeAppData(raw: Partial<AppData> & { notes?: Note[] }): AppData {
  const migrated = migrateTodosToKanban(raw);
  return {
    folders: raw.folders ?? [],
    notes: (raw.notes ?? []).map((n) => normalizeNote(n as Note)),
    tags: raw.tags ?? [],
    todos: migrated.todos,
    kanbanGroups: migrated.kanbanGroups.map((g) => ({ ...g })),
    kanbanColumns: (migrated.kanbanColumns as KanbanColumn[]).sort((a, b) => a.order - b.order),
    kanbanCards: migrated.kanbanCards.map((c) => normalizeKanbanCard(c)),
  };
}
