import { useMemo } from 'react';
import { useI18n } from '../i18n/useI18n';
import { localeTag } from '../i18n/localeFormat';
import {
  atDayTime,
  endOfDay,
  formatDate,
  formatDateTime,
  formatDayHeading,
  formatMonthYear,
  formatNoteListDate,
  formatScheduleDate,
  formatScheduleTime,
  getMonthGridCells,
  getTodayParts,
  getWeekdayLabels,
  groupByDayKeys,
  isPastDay,
  isSameDay,
  isToday,
  startOfDay,
  toDatetimeLocalValue,
  fromDatetimeLocalValue,
} from '../utils/schedule';

/** Hook terpusat: locale + timeZone untuk format & perhitungan tanggal */
export function useDateTime() {
  const { locale, timeZone, t } = useI18n();
  const dateLocale = localeTag(locale);

  return useMemo(() => {
    const scheduleLabels = {
      today: t('schedule.today'),
      tomorrow: t('schedule.tomorrow'),
    };

    return {
      locale,
      timeZone,
      dateLocale,
      startOfDay: (ts: number) => startOfDay(ts, timeZone),
      endOfDay: (ts: number) => endOfDay(ts, timeZone),
      isToday: (ts: number) => isToday(ts, timeZone),
      isPastDay: (ts: number) => isPastDay(ts, timeZone),
      isSameDay: (a: number, b: number) => isSameDay(a, b, timeZone),
      atDayTime: (dayStart: number, hour?: number, minute?: number) =>
        atDayTime(dayStart, timeZone, hour, minute),
      formatScheduleDate: (ts: number) => formatScheduleDate(ts, dateLocale, timeZone, scheduleLabels),
      formatScheduleTime: (ts: number) => formatScheduleTime(ts, dateLocale, timeZone),
      formatDayHeading: (dayStart: number) => formatDayHeading(dayStart, dateLocale, timeZone),
      formatMonthYear: (year: number, month: number) =>
        formatMonthYear(year, month, dateLocale, timeZone),
      getWeekdayLabels: () => getWeekdayLabels(dateLocale, timeZone),
      getMonthGridCells: (year: number, month: number) => getMonthGridCells(year, month, timeZone),
      getTodayParts: () => getTodayParts(timeZone),
      formatNoteListDate: (ts: number) => formatNoteListDate(ts, dateLocale, timeZone),
      formatDate: (ts: number, options?: Intl.DateTimeFormatOptions) =>
        formatDate(ts, dateLocale, timeZone, options),
      formatDateTime: (ts: number, options?: Intl.DateTimeFormatOptions) =>
        formatDateTime(ts, dateLocale, timeZone, options),
      toDatetimeLocalValue: (ts: number | null) => toDatetimeLocalValue(ts, timeZone),
      fromDatetimeLocalValue: (value: string) => fromDatetimeLocalValue(value, timeZone),
      groupByDayKeys: (timestamps: number[]) => groupByDayKeys(timestamps, timeZone),
    };
  }, [locale, timeZone, dateLocale, t]);
}
