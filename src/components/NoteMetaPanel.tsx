import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  CheckSquare,
  Plus,
  ChevronDown,
  LayoutGrid,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { DateTimePicker } from './DateTimePicker';
import { NoteTagChips } from './NoteTagChips';
import { NoteMetaTokens } from './NoteMetaTokens';
import type { Note, KanbanCard, KanbanGroup, Tag as TagType } from '../types';
import { useI18n } from '../i18n/useI18n';
import { useDateTime } from '../hooks/useDateTime';
import { getKanbanGroupDisplayName } from '../utils/kanbanDisplayNames';
import './NoteMetaPanel.css';

type MetaTab = 'tags' | 'schedule' | 'kanban';

interface Props {
  note: Note;
  tags: TagType[];
  kanbanGroups: KanbanGroup[];
  linkedKanbanCards: KanbanCard[];
  onScheduledAtChange: (scheduledAt: number | null) => void;
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string) => void;
  onCreateKanbanCard: (title: string, groupId: string) => void;
  onOpenKanbanCard: (cardId: string, groupId: string) => void;
  onOpenTodoView: () => void;
}

const POPOVER_Z = 10000;

/** Popover anak (portal ke body) — jangan tutup panel properti saat diklik */
function isNestedPopoverTarget(target: Node): boolean {
  return target instanceof Element && !!target.closest('.dtp-popover, .searchable-select-popover');
}

function computePopoverStyle(trigger: HTMLButtonElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const gap = 8;
  const width = Math.min(380, window.innerWidth - 24);
  let left = rect.left;
  if (left + width > window.innerWidth - 12) {
    left = window.innerWidth - width - 12;
  }
  left = Math.max(12, left);

  const spaceBelow = window.innerHeight - rect.bottom - gap;
  const spaceAbove = rect.top - gap;
  const openUp = spaceBelow < 280 && spaceAbove > spaceBelow;
  const maxHeight = Math.min(480, Math.max(200, openUp ? spaceAbove - gap : spaceBelow - gap));

  if (openUp) {
    return {
      position: 'fixed',
      left,
      width,
      bottom: window.innerHeight - rect.top + gap,
      maxHeight,
      zIndex: POPOVER_Z,
    };
  }
  return {
    position: 'fixed',
    left,
    width,
    top: rect.bottom + gap,
    maxHeight,
    zIndex: POPOVER_Z,
  };
}

export function NoteMetaPanel({
  note,
  tags,
  kanbanGroups,
  linkedKanbanCards,
  onScheduledAtChange,
  onToggleTag,
  onCreateTag,
  onCreateKanbanCard,
  onOpenKanbanCard,
  onOpenTodoView,
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<MetaTab>('tags');
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [targetGroupId, setTargetGroupId] = useState('');

  const groupOptions = useMemo(
    () => kanbanGroups.map((g) => ({ value: g.id, label: getKanbanGroupDisplayName(g.name, t) })),
    [kanbanGroups, t]
  );

  const groupNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const g of kanbanGroups) map.set(g.id, getKanbanGroupDisplayName(g.name, t));
    return map;
  }, [kanbanGroups, t]);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    setPopoverStyle(computePopoverStyle(triggerRef.current));
  }, []);

  useEffect(() => {
    if (kanbanGroups.length === 0) {
      setTargetGroupId('');
      return;
    }
    setTargetGroupId((prev) =>
      prev && kanbanGroups.some((g) => g.id === prev) ? prev : kanbanGroups[0].id
    );
  }, [kanbanGroups, note.id]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      if (isNestedPopoverTarget(t)) return;
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

  const addCard = () => {
    const t = newCardTitle.trim();
    if (!t || !targetGroupId) return;
    onCreateKanbanCard(t, targetGroupId);
    setNewCardTitle('');
    setTab('kanban');
  };

  const addTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    onCreateTag(name);
    setNewTagName('');
  };

  const scheduleShort = note.scheduledAt ? dt.formatDateTime(note.scheduledAt) : null;

  const hasTrailing =
    note.tagIds.length > 0 || !!note.scheduledAt || linkedKanbanCards.length > 0;

  const tabs: { id: MetaTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'tags', label: t('noteMeta.tabTag'), icon: <Tag size={14} />, badge: note.tagIds.length ? String(note.tagIds.length) : undefined },
    { id: 'schedule', label: t('noteMeta.tabSchedule'), icon: <Calendar size={14} />, badge: scheduleShort ? '✓' : undefined },
    { id: 'kanban', label: t('noteMeta.tabTodo'), icon: <CheckSquare size={14} />, badge: linkedKanbanCards.length ? String(linkedKanbanCards.length) : undefined },
  ];

  const popover = open ? (
    <div
      ref={popoverRef}
      className="note-meta-popover"
      style={popoverStyle}
      role="dialog"
      aria-label={t('noteMeta.dialogLabel')}
    >
      <div className="note-meta-popover-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`note-meta-popover-tab ${tab === t.id ? 'is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
            {t.badge && <span className="note-meta-popover-tab-badge">{t.badge}</span>}
          </button>
        ))}
      </div>

      <div className="note-meta-popover-body">
        {tab === 'tags' && (
          <>
            <label className="note-meta-label">{t('noteMeta.createTag')}</label>
            <div className="note-meta-todo-add note-meta-tag-create">
              <input
                type="text"
                className="note-meta-input note-meta-input--full"
                placeholder={t('noteMeta.tagNamePlaceholder')}
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
              />
              <button
                type="button"
                className="note-meta-add-btn"
                onClick={addTag}
                disabled={!newTagName.trim()}
                title={t('noteMeta.createTagTitle')}
              >
                <Plus size={16} />
              </button>
            </div>

            {tags.length === 0 ? (
              <p className="note-meta-empty">{t('noteMeta.noTagsInApp')}</p>
            ) : (
              <>
                <p className="note-meta-hint">{t('noteMeta.tagHint')}</p>
                <div className="note-meta-tag-picker">
                  {tags.map((t) => {
                    const active = note.tagIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={`note-meta-tag-btn ${active ? 'is-active' : ''}`}
                        style={
                          active
                            ? {
                                borderColor: t.color,
                                color: t.color,
                                background: `color-mix(in srgb, ${t.color} 14%, transparent)`,
                              }
                            : undefined
                        }
                        onClick={() => onToggleTag(t.id)}
                      >
                        <span className="note-meta-tag-dot" style={{ background: t.color }} />
                        {t.name}
                      </button>
                    );
                  })}
                </div>
                {note.tagIds.length > 0 && (
                  <div className="note-meta-tag-active">
                    <span className="note-meta-label">{t('noteMeta.activeTags')}</span>
                    <NoteTagChips tags={tags} tagIds={note.tagIds} size="md" />
                  </div>
                )}
              </>
            )}
          </>
        )}

        {tab === 'schedule' && (
          <>
            <label className="note-meta-label">{t('noteMeta.scheduleLabel')}</label>
            <DateTimePicker
              value={note.scheduledAt}
              onChange={onScheduledAtChange}
              placeholder={t('noteMeta.schedulePlaceholder')}
            />
          </>
        )}

        {tab === 'kanban' && (
          <>
            <div className="note-meta-kanban-head">
              <p className="note-meta-hint note-meta-hint--flush">{t('noteMeta.kanbanHint')}</p>
              <button type="button" className="note-meta-link-btn" onClick={onOpenTodoView}>
                {t('noteMeta.openTodo')}
              </button>
            </div>

            {kanbanGroups.length === 0 ? (
              <p className="note-meta-empty">{t('noteMeta.noKanbanGroups')}</p>
            ) : (
              <>
                <label className="note-meta-label">{t('noteMeta.kanbanGroup')}</label>
                <SearchableSelect
                  className="note-meta-group-select"
                  value={targetGroupId}
                  onChange={setTargetGroupId}
                  options={groupOptions}
                  placeholder={t('noteMeta.selectGroup')}
                  searchPlaceholder={t('noteMeta.searchGroup')}
                />
                <div className="note-meta-todo-add">
                  <input
                    type="text"
                    className="note-meta-input note-meta-input--full"
                    placeholder={t('noteMeta.newCardPlaceholder')}
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCard()}
                  />
                  <button
                    type="button"
                    className="note-meta-add-btn"
                    onClick={addCard}
                    disabled={!newCardTitle.trim() || !targetGroupId}
                    title={t('noteMeta.addCardTitle')}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </>
            )}

            {linkedKanbanCards.length === 0 ? (
              kanbanGroups.length > 0 && (
                <p className="note-meta-empty">{t('noteMeta.noLinkedCards')}</p>
              )
            ) : (
              <ul className="note-meta-todo-list">
                {linkedKanbanCards.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="note-meta-todo-item"
                      onClick={() => {
                        onOpenKanbanCard(c.id, c.groupId);
                        setOpen(false);
                      }}
                    >
                      <LayoutGrid size={16} />
                      <span className="note-meta-todo-item-text">
                        <span>{c.title}</span>
                        <span className="note-meta-todo-item-sub">
                          {groupNameById.get(c.groupId) ?? t('noteMeta.groupFallback')}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="note-meta-panel" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`note-meta-toggle ${open ? 'is-open' : ''}`}
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => {
            const next = !o;
            if (next) requestAnimationFrame(() => updatePosition());
            return next;
          });
        }}
      >
        <SlidersHorizontal size={16} className="note-meta-toggle-icon" />
        <span className="note-meta-toggle-label">{t('noteMeta.properties')}</span>
        {hasTrailing ? (
          <span className="note-meta-toggle-trailing">
            <NoteMetaTokens
              scheduledAt={note.scheduledAt}
              todoCount={linkedKanbanCards.length}
            />
            <NoteTagChips tags={tags} tagIds={note.tagIds} />
          </span>
        ) : (
          <span className="note-meta-toggle-summary is-muted">{t('noteMeta.summary')}</span>
        )}
        <ChevronDown size={16} className="note-meta-toggle-chevron" aria-hidden />
      </button>
      {popover && createPortal(popover, document.body)}
    </div>
  );
}
