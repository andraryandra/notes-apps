import { describe, expect, it } from 'vitest';
import type { ScheduleEntry } from './scheduleEntries';
import {
  findDueScheduleReminders,
  markReminderFired,
  scheduleReminderKey,
  shouldFireReminder,
} from './scheduleReminders';

function entry(id: string, at: number): ScheduleEntry {
  return { kind: 'note', id, title: id, at, noteId: id };
}

describe('scheduleReminders', () => {
  it('builds stable dedup keys', () => {
    expect(scheduleReminderKey({ kind: 'note', id: 'n1', at: 1000 })).toBe('note:n1:1000');
  });

  it('finds entries due in the last window', () => {
    const now = 60_000;
    const entries = [
      entry('a', now - 120_000),
      entry('b', now - 30_000),
      entry('c', now + 1_000),
    ];
    expect(findDueScheduleReminders(entries, now).map((e) => e.id)).toEqual(['b']);
  });

  it('deduplicates fired reminders', () => {
    const key = 'note:n1:1000';
    expect(shouldFireReminder(key, {})).toBe(true);
    const fired = markReminderFired({}, key, Date.now());
    expect(shouldFireReminder(key, fired)).toBe(false);
  });
});
