import { describe, expect, it } from 'vitest';
import type { KanbanCard } from '../types';
import { computeKanbanCardOrders } from './kanbanMigrate';

function card(id: string, columnId: string, order: number): KanbanCard {
  return {
    id,
    groupId: 'g1',
    columnId,
    title: id,
    content: '',
    order,
    dueAt: null,
    tagIds: [],
    linkedNoteId: null,
    scheduledAt: null,
    deletedAt: null,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe('computeKanbanCardOrders', () => {
  const cards = [card('a', 'col1', 0), card('b', 'col1', 1), card('c', 'col2', 0)];

  it('moves card to end of column when insertBefore is null', () => {
    const updates = computeKanbanCardOrders(cards, 'c', 'col1', null);
    expect(updates).toEqual([
      { id: 'a', order: 0 },
      { id: 'b', order: 1 },
      { id: 'c', order: 2 },
    ]);
  });

  it('reorders within same column before target card', () => {
    const updates = computeKanbanCardOrders(cards, 'b', 'col1', 'a');
    expect(updates).toEqual([
      { id: 'b', order: 0 },
      { id: 'a', order: 1 },
    ]);
  });

  it('ignores deleted cards in target column', () => {
    const withDeleted = [...cards, { ...card('d', 'col1', 2), deletedAt: Date.now() }];
    const updates = computeKanbanCardOrders(withDeleted, 'c', 'col1', 'a');
    expect(updates?.map((u) => u.id)).toEqual(['c', 'a', 'b']);
  });
});
