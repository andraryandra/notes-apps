import type { KanbanCard, KanbanGroup, Note } from '../types';
import { endOfDay, startOfDay } from './schedule';

export interface DayActivity {
  label: string;
  dayStart: number;
  notes: number;
  cards: number;
  total: number;
}

export function getLast7DaysActivity(
  notes: Note[],
  kanbanCards: KanbanCard[],
  dateLocale: string,
  timeZone: string
): DayActivity[] {
  const today = startOfDay(Date.now(), timeZone);
  const days: DayActivity[] = [];

  for (let i = 6; i >= 0; i--) {
    const dayStart = today - i * 86400000;
    const dayEnd = endOfDay(dayStart, timeZone);
    const label = new Date(dayStart).toLocaleDateString(dateLocale, {
      weekday: 'short',
      day: 'numeric',
      timeZone,
    });

    const noteCount = notes.filter((n) => n.updatedAt >= dayStart && n.updatedAt <= dayEnd).length;
    const cardCount = kanbanCards.filter(
      (c) => c.updatedAt >= dayStart && c.updatedAt <= dayEnd
    ).length;

    days.push({
      label,
      dayStart,
      notes: noteCount,
      cards: cardCount,
      total: noteCount + cardCount,
    });
  }

  return days;
}

export interface ChartSegment {
  id: string;
  label: string;
  value: number;
  color: string;
}

export function getContentDistribution(
  notes: Note[],
  favoritesCount: number,
  kanbanCards: KanbanCard[],
  scheduleTotal: number
): ChartSegment[] {
  return [
    { id: 'notes', label: 'notes', value: notes.length, color: '#8b5cf6' },
    { id: 'fav', label: 'fav', value: favoritesCount, color: '#f59e0b' },
    { id: 'todo', label: 'todo', value: kanbanCards.length, color: '#22c55e' },
    { id: 'sched', label: 'sched', value: scheduleTotal, color: '#0ea5e9' },
  ].filter((s) => s.value > 0);
}

export function getKanbanByGroup(
  groups: KanbanGroup[],
  cards: KanbanCard[]
): { name: string; count: number }[] {
  return groups
    .map((g) => ({
      name: g.name,
      count: cards.filter((c) => c.groupId === g.id).length,
    }))
    .sort((a, b) => b.count - a.count);
}
