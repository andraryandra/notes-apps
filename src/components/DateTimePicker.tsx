import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { useDateTime } from '../hooks/useDateTime';
import { getZonedParts } from '../utils/timeZone';
import './DateTimePicker.css';

interface Props {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  className?: string;
}

const POPOVER_Z = 10050;

function computePopoverStyle(trigger: HTMLButtonElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const gap = 8;
  const width = Math.min(320, window.innerWidth - 24);
  let left = rect.left;
  if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
  left = Math.max(12, left);

  const spaceBelow = window.innerHeight - rect.bottom - gap;
  const spaceAbove = rect.top - gap;
  const openUp = spaceBelow < 340 && spaceAbove > spaceBelow;

  if (openUp) {
    return {
      position: 'fixed',
      left,
      width,
      bottom: window.innerHeight - rect.top + gap,
      zIndex: POPOVER_Z,
    };
  }
  return {
    position: 'fixed',
    left,
    width,
    top: rect.bottom + gap,
    zIndex: POPOVER_Z,
  };
}

const TIME_PRESETS = [
  { label: '09:00', hour: 9, minute: 0 },
  { label: '12:00', hour: 12, minute: 0 },
  { label: '17:00', hour: 17, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 },
];

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  className = '',
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});

  const base = value ?? Date.now();
  const baseParts = getZonedParts(base, dt.timeZone);
  const [viewYear, setViewYear] = useState(baseParts.year);
  const [viewMonth, setViewMonth] = useState(baseParts.month - 1);
  const [draftDay, setDraftDay] = useState(() => dt.startOfDay(base));
  const [draftHour, setDraftHour] = useState(baseParts.hour);
  const [draftMinute, setDraftMinute] = useState(baseParts.minute);

  const grid = useMemo(() => dt.getMonthGridCells(viewYear, viewMonth), [dt, viewYear, viewMonth]);
  const weekdayLabels = useMemo(() => dt.getWeekdayLabels(), [dt]);

  const formatLabel = (ts: number) =>
    `${dt.formatDate(ts, { day: 'numeric', month: 'short', year: 'numeric' })} · ${dt.formatScheduleTime(ts)}`;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    setPopoverStyle(computePopoverStyle(triggerRef.current));
  }, []);

  const syncDraftFromValue = useCallback(() => {
    const ts = value ?? Date.now();
    const parts = getZonedParts(ts, dt.timeZone);
    setViewYear(parts.year);
    setViewMonth(parts.month - 1);
    setDraftDay(dt.startOfDay(ts));
    setDraftHour(parts.hour);
    setDraftMinute(parts.minute);
  }, [value, dt]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onMove = () => updatePosition();
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    return () => {
      window.removeEventListener('resize', onMove);
      window.removeEventListener('scroll', onMove, true);
    };
  }, [open, updatePosition]);

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const apply = () => {
    onChange(dt.atDayTime(draftDay, draftHour, draftMinute));
    setOpen(false);
  };

  const applyPreset = (hour: number, minute: number) => {
    setDraftHour(hour);
    setDraftMinute(minute);
  };

  const bumpHour = (delta: number) => {
    setDraftHour((h) => (h + delta + 24) % 24);
  };

  const bumpMinute = (delta: number) => {
    setDraftMinute((m) => (m + delta + 60) % 60);
  };

  const monthLabel = dt.formatMonthYear(viewYear, viewMonth);
  const resolvedPlaceholder = placeholder ?? t('dateTimePicker.placeholder');

  const popover = open ? (
    <div
      ref={popoverRef}
      className="dtp-popover"
      style={popoverStyle}
      role="dialog"
      aria-label={t('dateTimePicker.title')}
    >
      <div className="dtp-popover-head">
        <span className="dtp-popover-title">
          <Calendar size={15} />
          {t('dateTimePicker.title')}
        </span>
        <button type="button" className="dtp-icon-btn" onClick={() => setOpen(false)} aria-label={t('dateTimePicker.close')}>
          <X size={16} />
        </button>
      </div>

      <div className="dtp-calendar-nav">
        <button type="button" className="dtp-nav-btn" onClick={() => shiftMonth(-1)} aria-label={t('schedule.prevMonth')}>
          <ChevronLeft size={16} />
        </button>
        <span className="dtp-month-label">{monthLabel}</span>
        <button type="button" className="dtp-nav-btn" onClick={() => shiftMonth(1)} aria-label={t('schedule.nextMonth')}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="dtp-weekdays">
        {weekdayLabels.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="dtp-grid">
        {grid.map(({ dayStart, dayNum, inMonth }) => {
          const selected = dt.isSameDay(dayStart, draftDay);
          const today = dt.isToday(dayStart);
          return (
            <button
              key={dayStart}
              type="button"
              className={`dtp-day ${!inMonth ? 'other-month' : ''} ${selected ? 'selected' : ''} ${today ? 'is-today' : ''}`}
              onClick={() => setDraftDay(dayStart)}
            >
              {dayNum}
            </button>
          );
        })}
      </div>

      <div className="dtp-time-section">
        <div className="dtp-time-head">
          <Clock size={14} />
          <span>{t('dateTimePicker.time')}</span>
        </div>
        <div className="dtp-time-row">
          <div className="dtp-spinner">
            <button type="button" className="dtp-spinner-btn" onClick={() => bumpHour(1)} aria-label={t('dateTimePicker.hourUp')}>
              <ChevronUp size={14} />
            </button>
            <span className="dtp-spinner-value">{String(draftHour).padStart(2, '0')}</span>
            <button type="button" className="dtp-spinner-btn" onClick={() => bumpHour(-1)} aria-label={t('dateTimePicker.hourDown')}>
              <ChevronDown size={14} />
            </button>
          </div>
          <span className="dtp-time-colon">:</span>
          <div className="dtp-spinner">
            <button type="button" className="dtp-spinner-btn" onClick={() => bumpMinute(5)} aria-label={t('dateTimePicker.minuteUp')}>
              <ChevronUp size={14} />
            </button>
            <span className="dtp-spinner-value">{String(draftMinute).padStart(2, '0')}</span>
            <button type="button" className="dtp-spinner-btn" onClick={() => bumpMinute(-5)} aria-label={t('dateTimePicker.minuteDown')}>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
        <div className="dtp-presets">
          {TIME_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`dtp-preset ${draftHour === p.hour && draftMinute === p.minute ? 'is-active' : ''}`}
              onClick={() => applyPreset(p.hour, p.minute)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="dtp-footer">
        {value && (
          <button
            type="button"
            className="dtp-footer-btn dtp-footer-btn--muted"
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
          >
            {t('dateTimePicker.clear')}
          </button>
        )}
        <button
          type="button"
          className="dtp-footer-btn dtp-footer-btn--muted"
          onClick={() => {
            const now = Date.now();
            const parts = getZonedParts(now, dt.timeZone);
            setDraftDay(dt.startOfDay(now));
            setDraftHour(parts.hour);
            setDraftMinute(parts.minute);
            setViewYear(parts.year);
            setViewMonth(parts.month - 1);
          }}
        >
          {t('dateTimePicker.now')}
        </button>
        <button type="button" className="dtp-footer-btn dtp-footer-btn--primary" onClick={apply}>
          {t('dateTimePicker.apply')}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className={`dtp ${open ? 'is-open' : ''} ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className="dtp-trigger"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => {
            const next = !o;
            if (next) {
              syncDraftFromValue();
              requestAnimationFrame(() => updatePosition());
            }
            return next;
          });
        }}
      >
        <Calendar size={16} className="dtp-trigger-icon" aria-hidden />
        <span className={`dtp-trigger-text ${value ? '' : 'is-placeholder'}`}>
          {value ? formatLabel(value) : resolvedPlaceholder}
        </span>
        <ChevronDown size={16} className="dtp-trigger-chevron" aria-hidden />
      </button>
      {popover && createPortal(popover, document.body)}
    </div>
  );
}
