import { useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, FileText, CheckSquare, Plus, Link2 } from 'lucide-react';
import type { Note, KanbanCard, Tag } from '../types';
import { NoteTagChips } from './NoteTagChips';
import { SearchableSelect } from './SearchableSelect';
import { buildScheduleEntries } from '../utils/scheduleEntries';
import {
  NoteContextMenu,
  type NoteContextMenuState,
} from './NoteContextMenu';
import { useI18n } from '../i18n/useI18n';
import { useDateTime } from '../hooks/useDateTime';
import './SchedulePanel.css';

export type { ScheduleEntry } from '../utils/scheduleEntries';

interface Props {
  notes: Note[];
  kanbanCards: KanbanCard[];
  tags: Tag[];
  selectedDay: number;
  onSelectDay: (dayStart: number) => void;
  onOpenNote: (noteId: string) => void;
  onOpenKanbanCard: (cardId: string, groupId: string) => void;
  onCreateNoteForDay: (dayStart: number) => void;
  onAssignNoteToDay: (noteId: string, dayStart: number) => void;
  onToggleNoteFavorite: (noteId: string) => void;
  onToggleNotePin: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

export function SchedulePanel({
  notes,
  kanbanCards,
  tags,
  selectedDay,
  onSelectDay,
  onOpenNote,
  onOpenKanbanCard,
  onCreateNoteForDay,
  onAssignNoteToDay,
  onToggleNoteFavorite,
  onToggleNotePin,
  onDeleteNote,
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();
  const todayParts = dt.getTodayParts();
  const [viewYear, setViewYear] = useState(todayParts.year);
  const [viewMonth, setViewMonth] = useState(todayParts.month - 1);
  const [linkNoteId, setLinkNoteId] = useState('');
  const [contextMenu, setContextMenu] = useState<NoteContextMenuState | null>(null);

  const weekdayLabels = useMemo(() => dt.getWeekdayLabels(), [dt]);

  const entries = useMemo(
    () => buildScheduleEntries(notes, kanbanCards, t('noteList.untitled')),
    [notes, kanbanCards, t]
  );

  const countByDay = useMemo(() => {
    const map = new Map<number, number>();
    for (const e of entries) {
      const d = dt.startOfDay(e.at);
      map.set(d, (map.get(d) ?? 0) + 1);
    }
    return map;
  }, [entries, dt]);

  const dayEntries = useMemo(
    () => entries.filter((e) => dt.isSameDay(e.at, selectedDay)),
    [entries, selectedDay, dt]
  );

  const grid = useMemo(() => dt.getMonthGridCells(viewYear, viewMonth), [dt, viewYear, viewMonth]);

  const unscheduledNotes = useMemo(
    () => notes.filter((n) => !n.scheduledAt).sort((a, b) => b.updatedAt - a.updatedAt),
    [notes]
  );

  const unscheduledNoteOptions = useMemo(
    () =>
      unscheduledNotes.map((n) => ({
        value: n.id,
        label: n.title.trim() || t('noteList.untitled'),
        description: dt.formatDate(n.updatedAt, { day: 'numeric', month: 'short' }),
      })),
    [unscheduledNotes, t, dt]
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const handleAssignExisting = () => {
    if (!linkNoteId) return;
    onAssignNoteToDay(linkNoteId, selectedDay);
    setLinkNoteId('');
  };

  return (
    <div className="schedule-panel schedule-panel--calendar">
      <header className="schedule-panel-header">
        <h2>
          <Calendar size={18} />
          {t('schedule.title')}
        </h2>
      </header>

      <div className="schedule-calendar-nav">
        <button type="button" className="schedule-nav-btn" onClick={() => shiftMonth(-1)} aria-label={t('schedule.prevMonth')}>
          <ChevronLeft size={18} />
        </button>
        <span className="schedule-month-label">{dt.formatMonthYear(viewYear, viewMonth)}</span>
        <button type="button" className="schedule-nav-btn" onClick={() => shiftMonth(1)} aria-label={t('schedule.nextMonth')}>
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          className="schedule-today-btn"
          onClick={() => {
            const parts = dt.getTodayParts();
            setViewYear(parts.year);
            setViewMonth(parts.month - 1);
            onSelectDay(dt.startOfDay(Date.now()));
          }}
        >
          {t('schedule.today')}
        </button>
      </div>

      <div className="schedule-weekdays">
        {weekdayLabels.map((w) => (
          <span key={w} className="schedule-weekday">
            {w}
          </span>
        ))}
      </div>

      <div className="schedule-grid">
        {grid.map(({ dayStart, dayNum, inMonth }) => {
          const count = countByDay.get(dayStart) ?? 0;
          const selected = selectedDay === dayStart;
          const today = dt.isToday(dayStart);
          return (
            <button
              key={dayStart}
              type="button"
              className={`schedule-day-cell ${!inMonth ? 'other-month' : ''} ${selected ? 'selected' : ''} ${today ? 'is-today' : ''} ${count > 0 ? 'has-events' : ''}`}
              onClick={() => onSelectDay(dayStart)}
            >
              <span className="schedule-day-num">{dayNum}</span>
              {count > 0 && (
                <span className="schedule-day-count" aria-label={t('schedule.eventCount', { count })}>
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="schedule-day-panel">
        <div className="schedule-day-panel-head">
          <h3>{dt.formatDayHeading(selectedDay)}</h3>
          <button
            type="button"
            className="schedule-create-btn"
            onClick={() => onCreateNoteForDay(selectedDay)}
          >
            <Plus size={16} />
            {t('schedule.newNote')}
          </button>
        </div>

        {dayEntries.length === 0 ? (
          <p className="schedule-day-empty">{t('schedule.dayEmpty')}</p>
        ) : (
          <ul className="schedule-day-list">
            {dayEntries.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <button
                  type="button"
                  className={`schedule-item schedule-item--${item.kind}`}
                  onClick={() => {
                    if (item.kind === 'note' && item.noteId) onOpenNote(item.noteId);
                    else if (item.kind === 'kanban' && item.groupId) {
                      onOpenKanbanCard(item.id, item.groupId);
                    }
                  }}
                  onContextMenu={(e) => {
                    if (item.kind !== 'note' || !item.noteId) return;
                    e.preventDefault();
                    const note = notes.find((n) => n.id === item.noteId);
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      noteId: item.noteId,
                      favorite: note?.favorite ?? false,
                      pinned: note?.pinned ?? false,
                    });
                  }}
                >
                  {item.kind === 'note' ? (
                    <FileText size={16} className="schedule-item-icon" />
                  ) : (
                    <CheckSquare size={16} className="schedule-item-icon" />
                  )}
                  <span className="schedule-item-text">
                    <span className="schedule-item-title">{item.title}</span>
                    <span className="schedule-item-time">{dt.formatScheduleTime(item.at)}</span>
                    {item.tagIds && item.tagIds.length > 0 && (
                      <NoteTagChips
                        tags={tags}
                        tagIds={item.tagIds}
                        className="schedule-item-tags"
                      />
                    )}
                  </span>
                  <span className="schedule-item-kind">
                    {item.kind === 'note' ? t('schedule.badgeNote') : t('schedule.badgeKanbanCard')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {unscheduledNotes.length > 0 && (
          <div className="schedule-link-note">
            <label className="schedule-link-label">
              <Link2 size={14} />
              {t('schedule.linkExisting')}
            </label>
            <div className="schedule-link-row">
              <SearchableSelect
                className="schedule-link-select"
                value={linkNoteId}
                onChange={setLinkNoteId}
                options={unscheduledNoteOptions}
                placeholder={t('schedule.selectNote')}
                searchPlaceholder={t('schedule.searchNote')}
              />
              <button
                type="button"
                className="schedule-link-btn"
                disabled={!linkNoteId}
                onClick={handleAssignExisting}
              >
                {t('schedule.add')}
              </button>
            </div>
            <p className="schedule-link-hint">
              {t('schedule.scheduleHint', { date: dt.formatDayHeading(selectedDay) })}
            </p>
          </div>
        )}
      </div>
      <NoteContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onToggleFavorite={onToggleNoteFavorite}
        onTogglePin={onToggleNotePin}
        onDelete={onDeleteNote}
      />
    </div>
  );
}
