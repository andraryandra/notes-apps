import type { Note } from '../types';

export function noteMatchesQuery(
  note: Note,
  q: string,
  stripHtml: (html: string) => string
): boolean {
  const lower = q.toLowerCase();
  if (note.title.toLowerCase().includes(lower)) return true;
  if (note.contentPreview?.toLowerCase().includes(lower)) return true;
  if (!note.content) return false;
  return stripHtml(note.content).toLowerCase().includes(lower);
}

export function buildTagNoteCounts(notes: Note[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const n of notes) {
    for (const id of n.tagIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
  }
  return counts;
}
