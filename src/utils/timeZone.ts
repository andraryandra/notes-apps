/** Konversi & format tanggal berdasarkan zona waktu IANA (Intl) */

export interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export function getZonedParts(ts: number, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(new Date(ts))
      .filter((p) => p.type !== 'literal')
      .map((p) => [p.type, p.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

export function getTimezoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = getZonedParts(utcMs, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return asUtc - utcMs;
}

export function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): number {
  let utc = Date.UTC(year, month - 1, day, hour, minute, second);
  for (let i = 0; i < 2; i++) {
    utc -= getTimezoneOffsetMs(utc, timeZone);
  }
  return utc;
}

export function startOfDayInZone(ts: number, timeZone: string): number {
  const { year, month, day } = getZonedParts(ts, timeZone);
  return zonedDateTimeToUtc(year, month, day, 0, 0, 0, timeZone);
}

export function endOfDayInZone(ts: number, timeZone: string): number {
  const { year, month, day } = getZonedParts(ts, timeZone);
  return zonedDateTimeToUtc(year, month, day, 23, 59, 59, timeZone) + 999;
}

export function addDaysInZone(dayStart: number, days: number, timeZone: string): number {
  const { year, month, day } = getZonedParts(dayStart, timeZone);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return zonedDateTimeToUtc(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
    0,
    0,
    0,
    timeZone
  );
}

function getWeekdayInZone(ts: number, timeZone: string): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(new Date(ts));
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[name] ?? 0;
}

export function formatInZone(
  ts: number,
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Date(ts).toLocaleString(locale, { ...options, timeZone });
}

export function getNowZonedParts(timeZone: string): ZonedParts {
  return getZonedParts(Date.now(), timeZone);
}

export function getMonthGridCellsInZone(
  year: number,
  month: number,
  timeZone: string
): { dayStart: number; dayNum: number; inMonth: boolean }[] {
  const firstOfMonth = zonedDateTimeToUtc(year, month + 1, 1, 0, 0, 0, timeZone);
  const startPad = getWeekdayInZone(firstOfMonth, timeZone);
  const cells: { dayStart: number; dayNum: number; inMonth: boolean }[] = [];
  let dayStart = addDaysInZone(firstOfMonth, -startPad, timeZone);
  for (let i = 0; i < 42; i++) {
    const parts = getZonedParts(dayStart, timeZone);
    cells.push({
      dayStart,
      dayNum: parts.day,
      inMonth: parts.month === month + 1 && parts.year === year,
    });
    dayStart = addDaysInZone(dayStart, 1, timeZone);
  }
  return cells;
}
