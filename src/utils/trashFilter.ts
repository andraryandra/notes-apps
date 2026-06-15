import type { KanbanCard, Note } from '../types';

export function isActiveNote(note: Note): boolean {
  return note.deletedAt == null;
}

export function isActiveKanbanCard(card: KanbanCard): boolean {
  return card.deletedAt == null;
}

export function filterActiveNotes(notes: Note[]): Note[] {
  return notes.filter(isActiveNote);
}

export function filterActiveKanbanCards(cards: KanbanCard[]): KanbanCard[] {
  return cards.filter(isActiveKanbanCard);
}

export function filterDeletedNotes(notes: Note[]): Note[] {
  return notes.filter((n) => n.deletedAt != null);
}

export function filterDeletedKanbanCards(cards: KanbanCard[]): KanbanCard[] {
  return cards.filter((c) => c.deletedAt != null);
}
