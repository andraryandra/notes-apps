import { useEffect, useRef } from 'react';
import type { AppSettings } from '../config/appearance';
import type { KanbanCard, Note } from '../types';
import { buildScheduleEntries } from '../utils/scheduleEntries';
import { filterActiveKanbanCards, filterActiveNotes } from '../utils/trashFilter';
import {
  REMINDER_POLL_MS,
  findDueScheduleReminders,
  markReminderFired,
  scheduleReminderKey,
  shouldFireReminder,
} from '../utils/scheduleReminders';

export function useScheduleReminders(
  enabled: boolean,
  notes: Note[],
  kanbanCards: KanbanCard[],
  reminderFired: AppSettings['reminderFired'],
  onReminderFired: (next: Record<string, number>) => void,
  untitledLabel: string
) {
  const firedRef = useRef(reminderFired);
  firedRef.current = reminderFired;

  useEffect(() => {
    if (!enabled || !window.electronAPI?.showScheduleReminder) return;

    const tick = () => {
      const entries = buildScheduleEntries(
        filterActiveNotes(notes),
        filterActiveKanbanCards(kanbanCards),
        untitledLabel
      );
      const due = findDueScheduleReminders(entries, Date.now());
      let nextFired = firedRef.current;
      let changed = false;

      for (const entry of due) {
        const key = scheduleReminderKey(entry);
        if (!shouldFireReminder(key, nextFired)) continue;

        void window.electronAPI.showScheduleReminder({
          kind: entry.kind,
          title: entry.title,
          noteId: entry.kind === 'note' ? entry.id : entry.noteId,
          kanbanCardId: entry.kind === 'kanban' ? entry.id : undefined,
          groupId: entry.groupId,
        });

        nextFired = markReminderFired(nextFired, key, Date.now());
        changed = true;
      }

      if (changed) onReminderFired(nextFired);
    };

    tick();
    const id = window.setInterval(tick, REMINDER_POLL_MS);
    return () => window.clearInterval(id);
  }, [enabled, notes, kanbanCards, onReminderFired, untitledLabel]);
}
