import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  ChevronDown,
  FileText,
  Link2,
  Plus,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import { DateTimePicker } from './DateTimePicker';
import { NoteTagChips } from './NoteTagChips';
import { NoteMetaTokens } from './NoteMetaTokens';
import type { KanbanCard, Note, Tag as TagType } from '../types';
import { useI18n } from '../i18n/useI18n';
import { useDateTime } from '../hooks/useDateTime';
import './NoteMetaPanel.css';

type MetaTab = 'tags' | 'schedule' | 'link';

interface Props {
  card: KanbanCard;
  tags: TagType[];
  notes: Note[];
  onScheduledAtChange: (scheduledAt: number | null) => void;
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string) => void;
  onLinkedNoteChange: (noteId: string | null) => void;
  onOpenLinkedNote: (noteId: string) => void;
}

const POPOVER_Z = 10000;

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

export function KanbanCardMetaPanel({
  card,
  tags,
  notes,
  onScheduledAtChange,
  onToggleTag,
  onCreateTag,
  onLinkedNoteChange,
  onOpenLinkedNote,
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<MetaTab>('tags');
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const [newTagName, setNewTagName] = useState('');

  const noteOptions = useMemo(
    () =>
      [...notes]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((n) => ({
          value: n.id,
          label: n.title.trim() || t('noteList.untitled'),
          description: dt.formatDate(n.updatedAt, { day: 'numeric', month: 'short' }),
        })),
    [notes, t, dt]
  );

  const linkedNote = card.linkedNoteId ? notes.find((n) => n.id === card.linkedNoteId) : null;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    setPopoverStyle(computePopoverStyle(triggerRef.current));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      if (isNestedPopoverTarget(target)) return;
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

  const addTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    onCreateTag(name);
    setNewTagName('');
  };

  const hasTrailing =
    card.tagIds.length > 0 || !!card.scheduledAt || !!linkedNote;

  const tabs: { id: MetaTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'tags',
      label: t('noteMeta.tabTag'),
      icon: <Tag size={14} />,
      badge: card.tagIds.length ? String(card.tagIds.length) : undefined,
    },
    {
      id: 'schedule',
      label: t('noteMeta.tabSchedule'),
      icon: <Calendar size={14} />,
      badge: card.scheduledAt ? '✓' : undefined,
    },
    {
      id: 'link',
      label: t('kanban.linkNote'),
      icon: <Link2 size={14} />,
      badge: linkedNote ? '✓' : undefined,
    },
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
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`note-meta-popover-tab ${tab === item.id ? 'is-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge && <span className="note-meta-popover-tab-badge">{item.badge}</span>}
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
                  {tags.map((tag) => {
                    const active = card.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`note-meta-tag-btn ${active ? 'is-active' : ''}`}
                        style={
                          active
                            ? {
                                borderColor: tag.color,
                                color: tag.color,
                                background: `color-mix(in srgb, ${tag.color} 14%, transparent)`,
                              }
                            : undefined
                        }
                        onClick={() => onToggleTag(tag.id)}
                      >
                        <span className="note-meta-tag-dot" style={{ background: tag.color }} />
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
                {card.tagIds.length > 0 && (
                  <div className="note-meta-tag-active">
                    <span className="note-meta-label">{t('noteMeta.activeTags')}</span>
                    <NoteTagChips tags={tags} tagIds={card.tagIds} size="md" />
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
              value={card.scheduledAt}
              onChange={onScheduledAtChange}
              placeholder={t('noteMeta.schedulePlaceholder')}
            />
          </>
        )}

        {tab === 'link' && (
          <>
            <p className="note-meta-hint note-meta-hint--flush">{t('kanban.linkHint')}</p>
            <label className="note-meta-label">{t('kanban.linkNote')}</label>
            <SearchableSelect
              className="note-meta-group-select"
              value={card.linkedNoteId ?? ''}
              onChange={(id) => onLinkedNoteChange(id || null)}
              options={noteOptions}
              emptyOption={{ value: '', label: t('kanban.notLinked') }}
              placeholder={t('kanban.selectNote')}
              searchPlaceholder={t('kanban.searchNote')}
            />
            {linkedNote && (
              <button
                type="button"
                className="note-meta-link-btn"
                onClick={() => {
                  onOpenLinkedNote(linkedNote.id);
                  setOpen(false);
                }}
              >
                <FileText size={16} />
                {t('kanban.openNote')}
              </button>
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
            <NoteMetaTokens scheduledAt={card.scheduledAt} todoCount={0} />
            <NoteTagChips tags={tags} tagIds={card.tagIds} />
            {linkedNote && (
              <span className="note-meta-token note-meta-token--todo">
                <Link2 size={11} strokeWidth={2.25} aria-hidden />
                <span className="note-meta-token-text">
                  {linkedNote.title.trim() || t('noteList.untitled')}
                </span>
              </span>
            )}
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
