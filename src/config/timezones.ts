/** Zona waktu IANA untuk pengaturan tampilan tanggal */

export const APP_TIME_ZONES = [
  'UTC',
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Bangkok',
  'Asia/Manila',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

export type AppTimeZone = (typeof APP_TIME_ZONES)[number];

export function detectSystemTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(value: unknown): string {
  if (typeof value === 'string' && isValidTimeZone(value)) return value;
  const system = detectSystemTimeZone();
  if (isValidTimeZone(system)) return system;
  return 'UTC';
}

/** Label singkat untuk dropdown pengaturan, mis. "UTC+7 · Jakarta" */
export function formatTimeZoneLabel(timeZone: string, localeTag: string): string {
  try {
    const parts = new Intl.DateTimeFormat(localeTag, {
      timeZone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    if (timeZone === 'UTC') return `${offset} · UTC`;
    const city = timeZone.split('/').pop()?.replace(/_/g, ' ') ?? timeZone;
    return `${offset} · ${city}`;
  } catch {
    return timeZone;
  }
}
