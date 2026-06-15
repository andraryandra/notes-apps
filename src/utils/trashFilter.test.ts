import { describe, expect, it } from 'vitest';
import type { KanbanCard, Note } from '../types';
import {
  filterActiveKanbanCards,
  filterActiveNotes,
  filterDeletedKanbanCards,
  filterDeletedNotes,
  isActiveKanbanCard,
  isActiveNote,
} from './trashFilter';

function note(id: string, deletedAt: number | null = null): Note {
  return {
    id,
    title: id,
    content: '',
    folderId: null,
    tagIds: [],
    favorite: false,
    pinned: false,
    scheduledAt: null,
    deletedAt,
    createdAt: 0,
    updatedAt: 0,
  };
}

function kanbanCard(id: string, deletedAt: number | null = null): KanbanCard {
  return {
    id,
    groupId: 'g',
    columnId: 'c',
    title: id,
    content: '',
    order: 0,
    dueAt: null,
    tagIds: [],
    linkedNoteId: null,
    scheduledAt: null,
    deletedAt,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('trashFilter', () => {
  it('detects active and deleted notes', () => {
    expect(isActiveNote(note('a'))).toBe(true);
    expect(isActiveNote(note('b', 1))).toBe(false);
  });

  it('filters active and deleted collections', () => {
    const notes = [note('a'), note('b', 1)];
    expect(filterActiveNotes(notes).map((n) => n.id)).toEqual(['a']);
    expect(filterDeletedNotes(notes).map((n) => n.id)).toEqual(['b']);
  });

  it('filters kanban cards the same way', () => {
    const cards = [kanbanCard('x'), kanbanCard('y', 2)];
    expect(filterActiveKanbanCards(cards).map((c) => c.id)).toEqual(['x']);
    expect(filterDeletedKanbanCards(cards).map((c) => c.id)).toEqual(['y']);
    expect(isActiveKanbanCard(cards[1])).toBe(false);
  });
});
