import { useMemo, useRef, useState, useEffect, type ReactNode } from 'react';
import {
  Search,
  FileText,
  Star,
  Calendar,
  LayoutGrid,
  Tag,
  Image,
  Paperclip,
  Link2,
  CheckSquare,
} from 'lucide-react';
import { stripHtml } from '../hooks/useNotesStore';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { buildTagNoteCounts, noteMatchesQuery } from '../utils/noteSearch';
import type { GlobalNoteAsset } from '../utils/parseGlobalNoteAssets';
import {
  filterGlobalNoteAssets,
  parseGlobalNoteAssets,
} from '../utils/parseGlobalNoteAssets';
import type { KanbanCard, KanbanGroup, Note, Tag as TagType } from '../types';
import type { ParsedNoteAsset } from '../utils/parseNoteAssets';
import { useI18n } from '../i18n/useI18n';
import { useDateTime } from '../hooks/useDateTime';
import { getKanbanGroupDisplayName } from '../utils/kanbanDisplayNames';
import './DashboardBrowse.css';
import './InfiniteScroll.css';

type BrowseTab = 'notes' | 'favorites' | 'schedule' | 'assets' | 'tags';

interface ScheduleRow {
  id: string;
  kind: 'note' | 'kanban';
  title: string;
  at: number;
  noteId?: string;
  groupId?: string;
}

interface Props {
  notes: Note[];
  tags: TagType[];
  kanbanGroups: KanbanGroup[];
  kanbanCards: KanbanCard[];
  onOpenNote: (noteId: string) => void;
  onOpenKanbanCard: (cardId: string, groupId: string) => void;
  onOpenTag: (tagId: string) => void;
  onGoToAsset: (noteId: string, asset: ParsedNoteAsset) => void;
  scrollBatchSize: number;
  onHydrateNoteContents?: () => void | Promise<void>;
}

const TAB_DEFS: { id: BrowseTab; labelKey: string; icon: ReactNode }[] = [
  { id: 'notes', labelKey: 'dashboard.tabNotes', icon: <FileText size={15} /> },
  { id: 'favorites', labelKey: 'dashboard.tabFavorites', icon: <Star size={15} /> },
  { id: 'schedule', labelKey: 'dashboard.tabSchedule', icon: <Calendar size={15} /> },
  { id: 'assets', labelKey: 'dashboard.tabAssets', icon: <LayoutGrid size={15} /> },
  { id: 'tags', labelKey: 'dashboard.tabTags', icon: <Tag size={15} /> },
];

function matchQuery(text: string, q: string): boolean {
  return text.toLowerCase().includes(q);
}

function AssetIcon({ type }: { type: GlobalNoteAsset['type'] }) {
  if (type === 'image') return <Image size={16} />;
  if (type === 'file') return <Paperclip size={16} />;
  return <Link2 size={16} />;
}

export function DashboardBrowseList({
  notes,
  tags,
  kanbanGroups,
  kanbanCards,
  onOpenNote,
  onOpenKanbanCard,
  onOpenTag,
  onGoToAsset,
  scrollBatchSize,
  onHydrateNoteContents,
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();
  const [tab, setTab] = useState<BrowseTab>('notes');
  const [query, setQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query, 280);

  useEffect(() => {
    if (tab === 'assets') void onHydrateNoteContents?.();
  }, [tab, onHydrateNoteContents]);

  const groupNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of kanbanGroups) m.set(g.id, getKanbanGroupDisplayName(g.name, t));
    return m;
  }, [kanbanGroups, t]);

  const assetItems = useMemo(() => {
    if (tab !== 'assets') return [];
    return parseGlobalNoteAssets(notes).items;
  }, [notes, tab]);

  const tagNoteCounts = useMemo(() => buildTagNoteCounts(notes), [notes]);

  const scheduleRows = useMemo((): ScheduleRow[] => {
    const rows: ScheduleRow[] = [];
    for (const n of notes) {
      if (n.scheduledAt) {
        rows.push({
          kind: 'note',
          id: n.id,
          title: n.title.trim() || t('noteList.untitled'),
          at: n.scheduledAt,
          noteId: n.id,
        });
      }
    }
    for (const c of kanbanCards) {
      const at = c.scheduledAt ?? c.dueAt;
      if (at) {
        rows.push({
          kind: 'kanban',
          id: c.id,
          title: c.title.trim() || t('noteList.untitled'),
          at,
          groupId: c.groupId,
        });
      }
    }
    return rows.sort((a, b) => a.at - b.at);
  }, [notes, kanbanCards, t]);

  const q = debouncedQuery.trim().toLowerCase();

  const filteredNotes = useMemo(() => {
    const list = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return list;
    return list.filter((n) => noteMatchesQuery(n, q, stripHtml));
  }, [notes, q]);

  const filteredFavorites = useMemo(() => {
    const list = notes.filter((n) => n.favorite).sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return list;
    return list.filter((n) => noteMatchesQuery(n, q, stripHtml));
  }, [notes, q]);

  const filteredSchedule = useMemo(() => {
    if (!q) return scheduleRows;
    return scheduleRows.filter((r) => matchQuery(r.title, q));
  }, [scheduleRows, q]);

  const filteredAssets = useMemo(
    () => filterGlobalNoteAssets(assetItems, 'all', 'all', debouncedQuery),
    [assetItems, debouncedQuery]
  );

  const filteredTags = useMemo(() => {
    const withCount = tags.map((t) => ({
      ...t,
      noteCount: tagNoteCounts.get(t.id) ?? 0,
    }));
    if (!q) return withCount.sort((a, b) => b.noteCount - a.noteCount);
    return withCount
      .filter((t) => matchQuery(t.name, q))
      .sort((a, b) => b.noteCount - a.noteCount);
  }, [tags, tagNoteCounts, q]);

type BrowseItem =
  | Note
  | ScheduleRow
  | GlobalNoteAsset
  | (TagType & { noteCount: number });

  const currentItems: BrowseItem[] =
    tab === 'notes'
      ? filteredNotes
      : tab === 'favorites'
        ? filteredFavorites
        : tab === 'schedule'
          ? filteredSchedule
          : tab === 'assets'
            ? filteredAssets
            : filteredTags;

  const infinite = useInfiniteScroll(currentItems, scrollBatchSize, scrollRef);
  const visibleItems = infinite.visible;

  const tabCounts: Record<BrowseTab, number> = {
    notes: notes.length,
    favorites: notes.filter((n) => n.favorite).length,
    schedule: scheduleRows.length,
    assets: assetItems.length,
    tags: tags.length,
  };

  const resultCount =
    tab === 'notes'
      ? filteredNotes.length
      : tab === 'favorites'
        ? filteredFavorites.length
        : tab === 'schedule'
          ? filteredSchedule.length
          : tab === 'assets'
            ? filteredAssets.length
            : filteredTags.length;

  const placeholder =
    tab === 'notes'
      ? t('dashboard.searchNotes')
      : tab === 'favorites'
        ? t('dashboard.searchFavorites')
        : tab === 'schedule'
          ? t('dashboard.searchSchedule')
          : tab === 'assets'
            ? t('dashboard.searchAssets')
            : t('dashboard.searchTags');

  return (
    <section className="dash-browse" data-tab={tab}>
      <div className="dash-browse-bg" aria-hidden />
      <div className="dash-browse-glow" aria-hidden />

      <div className="dash-browse-inner">
      <div className="dash-browse-head">
        <h3>
          <Search size={18} />
          {t('dashboard.browseTitle')}
        </h3>
        <span className="dash-browse-meta">{t('dashboard.resultsCount', { count: resultCount })}</span>
      </div>

      <div className="dash-browse-tabs" role="tablist">
        {TAB_DEFS.map((tabDef) => (
          <button
            key={tabDef.id}
            type="button"
            role="tab"
            aria-selected={tab === tabDef.id}
            className={`dash-browse-tab dash-browse-tab--${tabDef.id} ${tab === tabDef.id ? 'is-active' : ''}`}
            onClick={() => {
              setTab(tabDef.id);
              setQuery('');
            }}
          >
            {tabDef.icon}
            <span>{t(tabDef.labelKey)}</span>
            <span className="dash-browse-tab-count">{tabCounts[tabDef.id]}</span>
          </button>
        ))}
      </div>

      <div className="dash-browse-search">
        <Search size={16} className="dash-browse-search-icon" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        {query && (
          <button type="button" className="dash-browse-search-clear" onClick={() => setQuery('')}>
            {t('dashboard.clearSearch')}
          </button>
        )}
      </div>

      <div className="dash-browse-list-wrap" ref={scrollRef}>
        {tab === 'notes' && (
          <BrowseNoteList
            items={visibleItems as Note[]}
            empty={q ? t('dashboard.emptyNotesMatch') : t('dashboard.emptyNotes')}
            onOpen={onOpenNote}
            formatUpdatedAt={dt.formatDateTime}
            untitled={t('noteList.untitled')}
            contentEmpty={t('dashboard.contentEmpty')}
          />
        )}
        {tab === 'favorites' && (
          <BrowseNoteList
            items={visibleItems as Note[]}
            empty={q ? t('dashboard.emptyFavoritesMatch') : t('dashboard.emptyFavorites')}
            onOpen={onOpenNote}
            showStar
            formatUpdatedAt={dt.formatDateTime}
            untitled={t('noteList.untitled')}
            contentEmpty={t('dashboard.contentEmpty')}
          />
        )}
        {tab === 'schedule' && (
          <ul className="dash-browse-list">
            {(visibleItems as ScheduleRow[]).length === 0 ? (
              <li className="dash-browse-empty">
                {q ? t('dashboard.emptyScheduleMatch') : t('dashboard.emptySchedule')}
              </li>
            ) : (
              (visibleItems as ScheduleRow[]).map((row) => (
                <li key={`${row.kind}-${row.id}`}>
                  <button
                    type="button"
                    className="dash-browse-row"
                    onClick={() => {
                      if (row.kind === 'note' && row.noteId) onOpenNote(row.noteId);
                      else if (row.kind === 'kanban' && row.groupId) {
                        onOpenKanbanCard(row.id, row.groupId);
                      }
                    }}
                  >
                    <span className={`dash-browse-row-icon dash-browse-row-icon--${row.kind}`}>
                      {row.kind === 'note' ? <FileText size={16} /> : <CheckSquare size={16} />}
                    </span>
                    <span className="dash-browse-row-body">
                      <span className="dash-browse-row-title">{row.title}</span>
                      <span className="dash-browse-row-sub">
                        {dt.formatDate(row.at, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        · {dt.formatScheduleTime(row.at)}
                        {row.kind === 'kanban' && row.groupId && (
                          <> · {groupNameById.get(row.groupId) ?? t('dashboard.groupFallback')}</>
                        )}
                      </span>
                    </span>
                    <span className="dash-browse-row-badge">
                      {row.kind === 'note' ? t('dashboard.badgeNote') : t('dashboard.badgeTodo')}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
        {tab === 'assets' && (
          <ul className="dash-browse-list">
            {(visibleItems as GlobalNoteAsset[]).length === 0 ? (
              <li className="dash-browse-empty">
                {q ? t('dashboard.emptyAssetsMatch') : t('dashboard.emptyAssets')}
              </li>
            ) : (
              (visibleItems as GlobalNoteAsset[]).map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    className="dash-browse-row"
                    onClick={() => {
                      const { noteId, noteTitle: _n, ...parsed } = a;
                      onGoToAsset(noteId, parsed);
                    }}
                  >
                    <span className={`dash-browse-row-icon dash-browse-row-icon--${a.type}`}>
                      <AssetIcon type={a.type} />
                    </span>
                    <span className="dash-browse-row-body">
                      <span className="dash-browse-row-title">{a.title}</span>
                      <span className="dash-browse-row-sub">{a.noteTitle}</span>
                    </span>
                    <span className="dash-browse-row-badge">{a.type}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
        {tab === 'tags' && (
          <ul className="dash-browse-list dash-browse-list--tags">
            {(visibleItems as (TagType & { noteCount: number })[]).length === 0 ? (
              <li className="dash-browse-empty">
                {q ? t('dashboard.emptyTagsMatch') : t('dashboard.emptyTags')}
              </li>
            ) : (
              (visibleItems as (TagType & { noteCount: number })[]).map((tag) => (
                <li key={tag.id}>
                  <button type="button" className="dash-browse-row" onClick={() => onOpenTag(tag.id)}>
                    <span className="dash-browse-tag-dot" style={{ background: tag.color }} />
                    <span className="dash-browse-row-body">
                      <span className="dash-browse-row-title">{tag.name}</span>
                      <span className="dash-browse-row-sub">
                        {tag.noteCount === 0
                          ? t('dashboard.tagUnused')
                          : t('dashboard.tagNoteCount', { count: tag.noteCount })}
                      </span>
                    </span>
                    <span
                      className="dash-browse-tag-chip"
                      style={{ borderColor: tag.color, color: tag.color }}
                    >
                      #{tag.name}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
        {infinite.hasMore && currentItems.length > 0 && (
          <>
            <div ref={infinite.sentinelRef} className="infinite-scroll-sentinel" aria-hidden />
            <p className="infinite-scroll-status is-loading">{t('dashboard.loadMore')}</p>
          </>
        )}
        {!infinite.hasMore && infinite.total > infinite.visibleCount && (
          <p className="infinite-scroll-status">{t('dashboard.itemsLoaded', { count: infinite.total })}</p>
        )}
      </div>
      </div>
    </section>
  );
}

function BrowseNoteList({
  items,
  empty,
  onOpen,
  showStar,
  formatUpdatedAt,
  untitled,
  contentEmpty,
}: {
  items: Note[];
  empty: string;
  onOpen: (id: string) => void;
  showStar?: boolean;
  formatUpdatedAt: (ts: number) => string;
  untitled: string;
  contentEmpty: string;
}) {
  return (
    <ul className="dash-browse-list">
      {items.length === 0 ? (
        <li className="dash-browse-empty">{empty}</li>
      ) : (
        items.map((n) => {
          const preview = stripHtml(n.content).slice(0, 72);
          return (
            <li key={n.id}>
              <button type="button" className="dash-browse-row" onClick={() => onOpen(n.id)}>
                <span className="dash-browse-row-icon dash-browse-row-icon--note">
                  {showStar ? <Star size={16} fill="currentColor" /> : <FileText size={16} />}
                </span>
                <span className="dash-browse-row-body">
                  <span className="dash-browse-row-title">{n.title.trim() || untitled}</span>
                  <span className="dash-browse-row-sub">
                    {preview || contentEmpty}
                    {' · '}
                    {formatUpdatedAt(n.updatedAt)}
                  </span>
                </span>
              </button>
            </li>
          );
        })
      )}
    </ul>
  );
}
