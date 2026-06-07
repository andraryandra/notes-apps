/** Util tanggal untuk jadwal & TODO — semua fungsi menerima timeZone IANA */

import {
  addDaysInZone,
  endOfDayInZone,
  formatInZone,
  getMonthGridCellsInZone,
  getNowZonedParts,
  getZonedParts,
  startOfDayInZone,
  zonedDateTimeToUtc,
} from './timeZone';

export function startOfDay(ts: number, timeZone: string): number {
  return startOfDayInZone(ts, timeZone);
}

export function endOfDay(ts: number, timeZone: string): number {
  return endOfDayInZone(ts, timeZone);
}

export function isToday(ts: number, timeZone: string): boolean {
  const now = Date.now();
  return startOfDay(ts, timeZone) === startOfDay(now, timeZone);
}

export function isPastDay(ts: number, timeZone: string): boolean {
  return ts < startOfDay(Date.now(), timeZone);
}

export interface ScheduleDateLabels {
  today: string;
  tomorrow: string;
}

export function formatScheduleDate(
  ts: number,
  dateLocale: string,
  timeZone: string,
  labels: ScheduleDateLabels
): string {
  if (isToday(ts, timeZone)) return labels.today;
  const tomorrow = startOfDay(Date.now(), timeZone) + 86400000;
  if (startOfDay(ts, timeZone) === tomorrow) return labels.tomorrow;
  const parts = getZonedParts(ts, timeZone);
  const nowParts = getNowZonedParts(timeZone);
  return formatInZone(ts, dateLocale, timeZone, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: parts.year !== nowParts.year ? 'numeric' : undefined,
  });
}

export function formatScheduleTime(ts: number, dateLocale: string, timeZone: string): string {
  return formatInZone(ts, dateLocale, timeZone, { hour: '2-digit', minute: '2-digit' });
}

export function toDatetimeLocalValue(ts: number | null, timeZone: string): string {
  if (!ts) return '';
  const { year, month, day, hour, minute } = getZonedParts(ts, timeZone);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

export function fromDatetimeLocalValue(value: string, timeZone: string): number | null {
  if (!value) return null;
  const [datePart, timePart] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [h, mi] = (timePart ?? '00:00').split(':').map(Number);
  if ([y, m, d, h, mi].some(Number.isNaN)) return null;
  return zonedDateTimeToUtc(y, m, d, h, mi, 0, timeZone);
}

export function groupByDayKeys(timestamps: number[], timeZone: string): string[] {
  const keys = new Set(timestamps.map((t) => String(startOfDay(t, timeZone))));
  return [...keys].sort((a, b) => Number(a) - Number(b));
}

export function isSameDay(a: number, b: number, timeZone: string): boolean {
  return startOfDay(a, timeZone) === startOfDay(b, timeZone);
}

/** Senin = kolom pertama */
export function getMonthGridCells(year: number, month: number, timeZone: string) {
  return getMonthGridCellsInZone(year, month, timeZone);
}

export function formatMonthYear(
  year: number,
  month: number,
  dateLocale: string,
  timeZone: string
): string {
  const ts = zonedDateTimeToUtc(year, month + 1, 1, 12, 0, 0, timeZone);
  return formatInZone(ts, dateLocale, timeZone, { month: 'long', year: 'numeric' });
}

export function formatDayHeading(dayStart: number, dateLocale: string, timeZone: string): string {
  return formatInZone(dayStart, dateLocale, timeZone, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function atDayTime(dayStart: number, timeZone: string, hour = 9, minute = 0): number {
  const { year, month, day } = getZonedParts(dayStart, timeZone);
  return zonedDateTimeToUtc(year, month, day, hour, minute, 0, timeZone);
}

/** Label singkat Sen–Min / Mon–Sun sesuai locale & zona waktu */
export function getWeekdayLabels(dateLocale: string, timeZone: string): string[] {
  const monday = zonedDateTimeToUtc(2024, 1, 1, 12, 0, 0, timeZone);
  return Array.from({ length: 7 }, (_, i) => {
    const ts = addDaysInZone(monday, i, timeZone);
    return formatInZone(ts, dateLocale, timeZone, { weekday: 'short' });
  });
}

export function formatNoteListDate(
  ts: number,
  dateLocale: string,
  timeZone: string
): string {
  if (isToday(ts, timeZone)) {
    return formatInZone(ts, dateLocale, timeZone, { hour: '2-digit', minute: '2-digit' });
  }
  return formatInZone(ts, dateLocale, timeZone, { day: 'numeric', month: 'short' });
}

export function formatDateTime(
  ts: number,
  dateLocale: string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return formatInZone(ts, dateLocale, timeZone, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  });
}

export function formatDate(
  ts: number,
  dateLocale: string,
  timeZone: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return formatInZone(ts, dateLocale, timeZone, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function getTodayParts(timeZone: string) {
  return getNowZonedParts(timeZone);
}
