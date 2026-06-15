import { v4 as uuidv4 } from 'uuid';
import type { AppData, KanbanCard, KanbanColumn, KanbanGroup, TodoStatus } from '../types';
import { pickKanbanColumnColor } from './kanbanColumnColors';
import {
  DEFAULT_KANBAN_GROUP_NAME,
  LEGACY_KANBAN_GROUP_NAME,
} from './kanbanDisplayNames';

const LEGACY_STATUS_LABELS: Record<TodoStatus, string> = {
  todo: 'Belum',
  doing: 'Sedang',
  done: 'Selesai',
};

function defaultKanban(): Pick<AppData, 'kanbanGroups' | 'kanbanColumns' | 'kanbanCards'> {
  const groupId = uuidv4();
  const colId = uuidv4();
  const now = Date.now();
  return {
    kanbanGroups: [{ id: groupId, name: DEFAULT_KANBAN_GROUP_NAME, createdAt: now, updatedAt: now }],
    kanbanColumns: [{ id: colId, groupId, name: 'Kolom 1', order: 0, color: pickKanbanColumnColor(0) }],
    kanbanCards: [],
  };
}

export function migrateTodosToKanban(
  raw: Partial<AppData>
): Pick<AppData, 'kanbanGroups' | 'kanbanColumns' | 'kanbanCards' | 'todos'> {
  const existingGroups = raw.kanbanGroups ?? [];
  if (existingGroups.length > 0) {
    return {
      kanbanGroups: existingGroups,
      kanbanColumns: raw.kanbanColumns ?? [],
      kanbanCards: raw.kanbanCards ?? [],
      todos: [],
    };
  }

  const todos = raw.todos ?? [];
  const notes = raw.notes ?? [];

  if (todos.length === 0) {
    const d = defaultKanban();
    return { ...d, todos: [] };
  }

  const groupId = uuidv4();
  const now = Date.now();
  const columnIds: Record<TodoStatus, string> = {
    todo: uuidv4(),
    doing: uuidv4(),
    done: uuidv4(),
  };

  const kanbanGroups: KanbanGroup[] = [
    { id: groupId, name: LEGACY_KANBAN_GROUP_NAME, createdAt: now, updatedAt: now },
  ];

  const kanbanColumns: KanbanColumn[] = (
    ['todo', 'doing', 'done'] as TodoStatus[]
  ).map((s, i) => ({
    id: columnIds[s],
    groupId,
    name: LEGACY_STATUS_LABELS[s],
    order: i,
    color: pickKanbanColumnColor(i),
  }));

  const kanbanCards: KanbanCard[] = todos.map((t, index) => {
    const status = t.status ?? (t.done ? 'done' : 'todo');
    const linked = t.noteId ? notes.find((n) => n.id === t.noteId) : null;
    return {
      id: t.id,
      groupId,
      columnId: columnIds[status],
      title: t.title,
      content: linked?.content ?? '',
      order: index,
      dueAt: null,
      scheduledAt: t.dueAt ?? null,
      tagIds: [],
      linkedNoteId: t.noteId ?? null,
      deletedAt: null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  });

  return { kanbanGroups, kanbanColumns, kanbanCards, todos: [] };
}

export interface KanbanOrderUpdate {
  id: string;
  order: number;
}

/** Sisipkan kartu di kolom dan renumber order 0..n-1 */
export function computeKanbanCardOrders(
  cards: KanbanCard[],
  cardId: string,
  columnId: string,
  insertBeforeCardId?: string | null
): KanbanOrderUpdate[] | null {
  const moving = cards.find((c) => c.id === cardId);
  if (!moving) return null;

  const inCol = cards
    .filter((c) => c.columnId === columnId && c.deletedAt == null && c.id !== cardId)
    .sort((a, b) => a.order - b.order);

  let insertIdx = inCol.length;
  if (insertBeforeCardId) {
    const idx = inCol.findIndex((c) => c.id === insertBeforeCardId);
    if (idx >= 0) insertIdx = idx;
  }

  const reordered = [...inCol];
  reordered.splice(insertIdx, 0, { ...moving, columnId });

  return reordered.map((c, i) => ({ id: c.id, order: i }));
}
