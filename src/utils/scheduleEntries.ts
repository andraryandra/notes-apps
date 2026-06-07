import type { KanbanCard, Note } from '../types';

export interface ScheduleEntry {
  kind: 'note' | 'kanban';
  id: string;
  title: string;
  at: number;
  noteId?: string;
  groupId?: string;
  tagIds?: string[];
}

export function buildScheduleEntries(
  notes: Note[],
  kanbanCards: KanbanCard[],
  untitledLabel = 'Tanpa judul'
): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  for (const n of notes) {
    if (n.scheduledAt) {
      entries.push({
        kind: 'note',
        id: n.id,
        title: n.title.trim() || untitledLabel,
        at: n.scheduledAt,
        noteId: n.id,
        tagIds: n.tagIds,
      });
    }
  }
  for (const c of kanbanCards) {
    const at = c.scheduledAt ?? c.dueAt;
    if (at) {
      const linked = c.linkedNoteId ? notes.find((n) => n.id === c.linkedNoteId) : null;
      entries.push({
        kind: 'kanban',
        id: c.id,
        title: c.title.trim() || untitledLabel,
        at,
        noteId: c.linkedNoteId ?? undefined,
        groupId: c.groupId,
        tagIds: linked?.tagIds,
      });
    }
  }
  return entries;
}
