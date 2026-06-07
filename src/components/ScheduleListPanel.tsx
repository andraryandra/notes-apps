import { useMemo, useState, type ReactNode } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckSquare,
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  Search,
  X,
  Filter,
} from 'lucide-react';
import type { KanbanCard, Note, Tag } from '../types';
import { NoteTagChips } from './NoteTagChips';
import { SearchableSelect } from './SearchableSelect';
import { usePagePagination } from '../hooks/usePagePagination';
import { buildScheduleEntries, type ScheduleEntry } from '../utils/scheduleEntries';
import {
  NoteContextMenu,
  type NoteContextMenuState,
} from './NoteContextMenu';
import { useI18n } from '../i18n/useI18n';
import { useDateTime } from '../hooks/useDateTime';
import { getZonedParts } from '../utils/timeZone';
import './ScheduleListPanel.css';

export type ScheduleSort = 'desc' | 'asc';
export type ScheduleTypeFilter = 'all' | 'note' | 'kanban';

interface Props {
  notes: Note[];
  kanbanCards: KanbanCard[];
  tags: Tag[];
  pageSize: number;
  dayFilter: number | null;
  onClearDayFilter: () => void;
  onOpenNote: (noteId: string) => void;
  onOpenKanbanCard: (cardId: string, groupId: string) => void;
  onToggleNoteFavorite: (noteId: string) => void;
  onToggleNotePin: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
}

const TYPE_OPTION_DEFS: { id: ScheduleTypeFilter; labelKey: string; icon: ReactNode }[] = [
  { id: 'all', labelKey: 'schedule.filterAll', icon: <Filter size={14} /> },
  { id: 'note', labelKey: 'schedule.filterNotes', icon: <FileText size={14} /> },
  { id: 'kanban', labelKey: 'schedule.filterTodo', icon: <CheckSquare size={14} /> },
];

export function ScheduleListPanel({
  notes,
  kanbanCards,
  tags,
  pageSize,
  dayFilter,
  onClearDayFilter,
  onOpenNote,
  onOpenKanbanCard,
  onToggleNoteFavorite,
  onToggleNotePin,
  onDeleteNote,
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ScheduleSort>('desc');
  const [typeFilter, setTypeFilter] = useState<ScheduleTypeFilter>('all');
  const [tagFilterId, setTagFilterId] = useState('');
  const [contextMenu, setContextMenu] = useState<NoteContextMenuState | null>(null);

  const noteById = useMemo(() => new Map(notes.map((n) => [n.id, n])), [notes]);

  const entries = useMemo(
    () => buildScheduleEntries(notes, kanbanCards, t('noteList.untitled')),
    [notes, kanbanCards, t]
  );

  const tagOptions = useMemo(
    () => [
      { value: '', label: t('schedule.filterAllTags') },
      ...tags.map((tag) => ({ value: tag.id, label: tag.name, color: tag.color })),
    ],
    [tags, t]
  );

  const filtered = useMemo(() => {
    let list = [...entries];
    const q = query.trim().toLowerCase();

    if (dayFilter != null) {
      list = list.filter((e) => dt.isSameDay(e.at, dayFilter));
    }
    if (typeFilter === 'note') list = list.filter((e) => e.kind === 'note');
    if (typeFilter === 'kanban') list = list.filter((e) => e.kind === 'kanban');
    if (tagFilterId) {
      list = list.filter((e) => e.tagIds?.includes(tagFilterId));
    }
    if (q) {
      list = list.filter((e) => e.title.toLowerCase().includes(q));
    }

    list.sort((a, b) => (sort === 'desc' ? b.at - a.at : a.at - b.at));
    return list;
  }, [entries, dayFilter, typeFilter, tagFilterId, query, sort, dt]);

  const pagination = usePagePagination(filtered, pageSize);
  const visible = pagination.slice as ScheduleEntry[];

  const upcoming = useMemo(
    () => entries.filter((e) => e.at >= dt.startOfDay(Date.now())).length,
    [entries, dt]
  );

  return (
    <div className="schedule-list-panel">
      <div className="schedule-list-hero">
        <div className="schedule-list-hero-bg" aria-hidden />
        <div className="schedule-list-hero-content">
          <div>
            <span className="schedule-list-badge">
              <Calendar size={14} />
              {t('schedule.listBadge')}
            </span>
            <h2>{t('schedule.listTitle')}</h2>
            <p>{t('schedule.listSummary', { total: entries.length, upcoming })}</p>
          </div>
          <div className="schedule-list-hero-stat">
            <span className="schedule-list-hero-stat-value">{filtered.length}</span>
            <span className="schedule-list-hero-stat-label">{t('schedule.filterResults')}</span>
          </div>
        </div>
      </div>

      <div className="schedule-list-toolbar">
        <div className="schedule-list-search">
          <Search size={16} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('schedule.searchPlaceholder')}
          />
          {query && (
            <button type="button" className="schedule-list-search-clear" onClick={() => setQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="schedule-list-controls">
          <div className="schedule-list-sort" role="group" aria-label={t('schedule.sortLabel')}>
            <button
              type="button"
              className={`schedule-list-sort-btn ${sort === 'desc' ? 'is-active' : ''}`}
              onClick={() => setSort('desc')}
              title={t('schedule.sortNewest')}
            >
              <ArrowDownWideNarrow size={15} />
              {t('schedule.sortNewestShort')}
            </button>
            <button
              type="button"
              className={`schedule-list-sort-btn ${sort === 'asc' ? 'is-active' : ''}`}
              onClick={() => setSort('asc')}
              title={t('schedule.sortOldest')}
            >
              <ArrowUpWideNarrow size={15} />
              {t('schedule.sortOldestShort')}
            </button>
          </div>

          <div className="schedule-list-type-tabs">
            {TYPE_OPTION_DEFS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`schedule-list-type-tab ${typeFilter === opt.id ? 'is-active' : ''}`}
                onClick={() => setTypeFilter(opt.id)}
              >
                {opt.icon}
                {t(opt.labelKey)}
              </button>
            ))}
          </div>

          <SearchableSelect
            className="schedule-list-tag-select"
            value={tagFilterId}
            onChange={setTagFilterId}
            options={tagOptions}
            placeholder={t('schedule.filterTag')}
            searchPlaceholder={t('schedule.searchTag')}
          />
        </div>

        {dayFilter != null && (
          <div className="schedule-list-day-chip">
            <Calendar size={14} />
            <span>{dt.formatDayHeading(dayFilter)}</span>
            <button type="button" onClick={onClearDayFilter} aria-label={t('schedule.showAllDates')}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      <div className="schedule-list-body">
        {visible.length === 0 ? (
          <div className="schedule-list-empty">
            <Calendar size={40} strokeWidth={1.2} />
            <p>{t('schedule.empty')}</p>
            {(query || tagFilterId || typeFilter !== 'all' || dayFilter != null) && (
              <button
                type="button"
                className="schedule-list-reset-btn"
                onClick={() => {
                  setQuery('');
                  setTagFilterId('');
                  setTypeFilter('all');
                  onClearDayFilter();
                }}
              >
                {t('schedule.resetFilter')}
              </button>
            )}
          </div>
        ) : (
          <ul className="schedule-list-cards">
            {visible.map((item) => (
              <li key={`${item.kind}-${item.id}`}>
                <button
                  type="button"
                  className={`schedule-list-card schedule-list-card--${item.kind}`}
                  onClick={() => {
                    if (item.kind === 'note' && item.noteId) onOpenNote(item.noteId);
                    else if (item.kind === 'kanban' && item.groupId) {
                      onOpenKanbanCard(item.id, item.groupId);
                    }
                  }}
                  onContextMenu={(e) => {
                    if (item.kind !== 'note' || !item.noteId) return;
                    e.preventDefault();
                    const note = noteById.get(item.noteId);
                    setContextMenu({
                      x: e.clientX,
                      y: e.clientY,
                      noteId: item.noteId,
                      favorite: note?.favorite ?? false,
                      pinned: note?.pinned ?? false,
                    });
                  }}
                >
                  <div className={`schedule-list-card-date schedule-list-card-date--${item.kind}`}>
                    <span className="schedule-list-card-day">
                      {getZonedParts(item.at, dt.timeZone).day}
                    </span>
                    <span className="schedule-list-card-month">
                      {dt.formatDate(item.at, { month: 'short' })}
                    </span>
                  </div>
                  <div className="schedule-list-card-body">
                    <span className="schedule-list-card-title">{item.title}</span>
                    <span className="schedule-list-card-meta">
                      {dt.formatScheduleDate(item.at)} · {dt.formatScheduleTime(item.at)}
                    </span>
                    {item.tagIds && item.tagIds.length > 0 && (
                      <NoteTagChips tags={tags} tagIds={item.tagIds} className="schedule-list-card-tags" />
                    )}
                  </div>
                  <span className="schedule-list-card-badge">
                    {item.kind === 'note' ? t('schedule.badgeNoteShort') : t('schedule.badgeTodoShort')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {filtered.length > 0 && (
        <footer className="schedule-list-footer">
          <span className="schedule-list-footer-meta">
            {t('schedule.pageRange', {
              start: pagination.rangeStart,
              end: pagination.rangeEnd,
              total: pagination.totalItems,
            })}
          </span>
          <div className="schedule-list-footer-nav">
            <button
              type="button"
              className="schedule-list-page-btn"
              disabled={!pagination.hasPrev}
              onClick={pagination.goPrev}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="schedule-list-page-label">
              {pagination.page + 1} / {pagination.totalPages}
            </span>
            <button
              type="button"
              className="schedule-list-page-btn"
              disabled={!pagination.hasNext}
              onClick={pagination.goNext}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      )}
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
