import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange } from 'lucide-react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { useDateTime } from '../hooks/useDateTime';
import { useI18n } from '../i18n/useI18n';
import 'react-day-picker/dist/style.css';
import './DateRangeFilter.css';

interface Props {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onReset: () => void;
  className?: string;
  enablePresets?: boolean;
  splitCalendars?: boolean;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
  className,
  enablePresets = false,
  splitCalendars = false,
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [leftMonth, setLeftMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const addMonths = (date: Date, value: number) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + value);
    return next;
  };

  const [rightMonth, setRightMonth] = useState(() => addMonths(leftMonth, 1));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const toDate = (ymd: string): Date | undefined => {
    if (!ymd) return undefined;
    const ts = dt.fromDatetimeLocalValue(`${ymd}T12:00`);
    return ts == null ? undefined : new Date(ts);
  };

  const formatYmd = (date: Date | undefined): string => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const rangeValue: DateRange | undefined =
    startDate || endDate ? { from: toDate(startDate), to: toDate(endDate) } : undefined;

  const rangeLabel = useMemo(() => {
    const fmt = (ymd: string) => {
      const ts = dt.fromDatetimeLocalValue(`${ymd}T00:00`);
      return ts == null ? '—' : dt.formatDate(ts, { day: 'numeric', month: 'short', year: 'numeric' });
    };
    if (!startDate && !endDate) return t('schedule.selectDateRange');
    return `${startDate ? fmt(startDate) : '—'} - ${endDate ? fmt(endDate) : '—'}`;
  }, [startDate, endDate, dt, t]);

  const applyPresetRange = (preset: 'yesterday' | '7days' | '1month' | '3months' | '1year') => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const from = new Date(today);
    const to = new Date(today);

    if (preset === 'yesterday') {
      from.setDate(from.getDate() - 1);
      to.setDate(to.getDate() - 1);
    } else if (preset === '7days') {
      from.setDate(from.getDate() - 6);
    } else if (preset === '1month') {
      from.setMonth(from.getMonth() - 1);
    } else if (preset === '3months') {
      from.setMonth(from.getMonth() - 3);
    } else if (preset === '1year') {
      from.setFullYear(from.getFullYear() - 1);
    }

    onStartDateChange(formatYmd(from));
    onEndDateChange(formatYmd(to));
    setLeftMonth(new Date(from.getFullYear(), from.getMonth(), 1));
    setRightMonth(addMonths(new Date(from.getFullYear(), from.getMonth(), 1), 1));
  };

  return (
    <div className={`date-range-filter ${className ?? ''}`.trim()} ref={rootRef}>
      <button type="button" className={`date-range-filter-trigger ${open ? 'is-open' : ''}`} onClick={() => setOpen((v) => !v)}>
        <CalendarRange size={14} />
        <span className="date-range-filter-title">{t('schedule.dateRange')}</span>
        <span className="date-range-filter-value">{rangeLabel}</span>
      </button>
      {(startDate || endDate) && (
        <button type="button" className="date-range-filter-reset" onClick={onReset}>
          {t('schedule.clearDateRange')}
        </button>
      )}
      {open && (
        <div className="date-range-filter-popover">
          {enablePresets && (
            <div className="date-range-filter-presets">
              <button type="button" onClick={() => applyPresetRange('yesterday')}>
                {t('schedule.presetYesterday')}
              </button>
              <button type="button" onClick={() => applyPresetRange('7days')}>
                {t('schedule.preset7days')}
              </button>
              <button type="button" onClick={() => applyPresetRange('1month')}>
                {t('schedule.preset1month')}
              </button>
              <button type="button" onClick={() => applyPresetRange('3months')}>
                {t('schedule.preset3months')}
              </button>
              <button type="button" onClick={() => applyPresetRange('1year')}>
                {t('schedule.preset1year')}
              </button>
            </div>
          )}
          {splitCalendars ? (
            <div className="date-range-filter-calendars">
              <DayPicker
                mode="range"
                selected={rangeValue}
                onSelect={(range) => {
                  const nextStart = formatYmd(range?.from);
                  const nextEnd = formatYmd(range?.to);
                  onStartDateChange(nextStart);
                  onEndDateChange(nextEnd);
                }}
                month={leftMonth}
                onMonthChange={setLeftMonth}
                showOutsideDays
                fixedWeeks
                weekStartsOn={1}
              />
              <DayPicker
                mode="range"
                selected={rangeValue}
                onSelect={(range) => {
                  const nextStart = formatYmd(range?.from);
                  const nextEnd = formatYmd(range?.to);
                  onStartDateChange(nextStart);
                  onEndDateChange(nextEnd);
                }}
                month={rightMonth}
                onMonthChange={setRightMonth}
                showOutsideDays
                fixedWeeks
                weekStartsOn={1}
              />
            </div>
          ) : (
            <DayPicker
              mode="range"
              selected={rangeValue}
              onSelect={(range) => {
                const nextStart = formatYmd(range?.from);
                const nextEnd = formatYmd(range?.to);
                onStartDateChange(nextStart);
                onEndDateChange(nextEnd);
              }}
              numberOfMonths={2}
              showOutsideDays
              fixedWeeks
              weekStartsOn={1}
            />
          )}
        </div>
      )}
    </div>
  );
}
