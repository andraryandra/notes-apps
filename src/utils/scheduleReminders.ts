import type { ScheduleEntry } from './scheduleEntries';

export const REMINDER_POLL_MS = 60_000;
export const REMINDER_WINDOW_MS = 60_000;

export function scheduleReminderKey(entry: Pick<ScheduleEntry, 'kind' | 'id'> & { at: number }): string {
  return `${entry.kind}:${entry.id}:${entry.at}`;
}

/** Item jadwal yang jatuh tempo dalam window [now - windowMs, now] */
export function findDueScheduleReminders(
  entries: ScheduleEntry[],
  now: number,
  windowMs = REMINDER_WINDOW_MS
): ScheduleEntry[] {
  const from = now - windowMs;
  return entries.filter((e) => e.at <= now && e.at > from);
}

export function shouldFireReminder(key: string, fired: Record<string, number> | undefined): boolean {
  return !fired?.[key];
}

export function markReminderFired(
  fired: Record<string, number>,
  key: string,
  at: number
): Record<string, number> {
  return { ...fired, [key]: at };
}
