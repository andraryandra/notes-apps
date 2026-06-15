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
    if (c.scheduledAt) {
      entries.push({
        kind: 'kanban',
        id: c.id,
        title: c.title.trim() || untitledLabel,
        at: c.scheduledAt,
        noteId: c.linkedNoteId ?? undefined,
        groupId: c.groupId,
        tagIds: c.tagIds,
      });
    }
  }
  return entries;
}
