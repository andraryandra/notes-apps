import { useMemo, memo, type ReactNode } from 'react';
import {
  FileText,
  Star,
  CheckSquare,
  Calendar,
  LayoutGrid,
  Sparkles,
  ArrowUpRight,
  Activity,
  PieChart,
  Layers,
} from 'lucide-react';
import type { Folder, KanbanCard, KanbanGroup, Note, Tag as TagType } from '../types';
import { parseGlobalNoteAssets } from '../utils/parseGlobalNoteAssets';
import { isToday, startOfDay } from '../utils/schedule';
import {
  getContentDistribution,
  getKanbanByGroup,
  getLast7DaysActivity,
} from '../utils/dashboardStats';
import type { SidebarView } from '../types';
import type { ParsedNoteAsset } from '../utils/parseNoteAssets';
import { useI18n } from '../i18n/useI18n';
import { useDateTime } from '../hooks/useDateTime';
import { getKanbanGroupDisplayName } from '../utils/kanbanDisplayNames';
import {
  ActivityBarChart,
  DonutChart,
  HorizontalBarChart,
  SegmentLegend,
} from './DashboardCharts';
import { DashboardBrowseList } from './DashboardBrowse';
import './DashboardPanel.css';
import './DashboardBrowse.css';

interface Props {
  notes: Note[];
  folders: Folder[];
  tags: TagType[];
  kanbanGroups: KanbanGroup[];
  kanbanCards: KanbanCard[];
  onNavigate: (view: SidebarView) => void;
  onOpenGlobalAssets: () => void;
  onOpenNote: (noteId: string) => void;
  onOpenKanbanCard: (cardId: string, groupId: string) => void;
  onOpenTag: (tagId: string) => void;
  onGoToAsset: (noteId: string, asset: ParsedNoteAsset) => void;
  scrollBatchSize: number;
  onHydrateNoteContents?: () => void | Promise<void>;
}

const CONTENT_SEGMENT_KEYS: Record<string, string> = {
  notes: 'dashboard.segmentNotes',
  fav: 'dashboard.segmentFavorites',
  todo: 'dashboard.segmentTodoCards',
  sched: 'dashboard.segmentScheduled',
};

function StatCard({
  icon,
  label,
  value,
  hint,
  accent,
  spark,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  hint: string;
  accent: 'violet' | 'amber' | 'emerald' | 'sky' | 'rose';
  spark?: number[];
  onClick?: () => void;
}) {
  const max = Math.max(1, ...(spark ?? [1]));
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`dash-stat dash-stat--${accent} ${onClick ? 'is-clickable' : ''}`}
      onClick={onClick}
    >
      <div className="dash-stat-glow" aria-hidden />
      <div className="dash-stat-top">
        <div className="dash-stat-icon">{icon}</div>
        {onClick && <ArrowUpRight size={16} className="dash-stat-arrow" />}
      </div>
      <span className="dash-stat-label">{label}</span>
      <span className="dash-stat-value">{value}</span>
      <span className="dash-stat-hint">{hint}</span>
      {spark && spark.length > 0 && (
        <div className="dash-sparkline" aria-hidden>
          {spark.map((v, i) => (
            <span key={i} className="dash-sparkline-bar" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
          ))}
        </div>
      )}
    </Tag>
  );
}

export const DashboardPanel = memo(function DashboardPanel({
  notes,
  folders,
  tags,
  kanbanGroups,
  kanbanCards,
  onNavigate,
  onOpenGlobalAssets,
  onOpenNote,
  onOpenKanbanCard,
  onOpenTag,
  onGoToAsset,
  scrollBatchSize,
  onHydrateNoteContents,
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();
  const assetData = useMemo(() => parseGlobalNoteAssets(notes), [notes]);
  const favoritesCount = useMemo(() => notes.filter((n) => n.favorite).length, [notes]);
  const scheduledNotes = useMemo(() => notes.filter((n) => n.scheduledAt).length, [notes]);
  const scheduledCards = useMemo(
    () => kanbanCards.filter((c) => c.scheduledAt || c.dueAt).length,
    [kanbanCards]
  );
  const scheduleTotal = scheduledNotes + scheduledCards;

  const todaySchedule = useMemo(() => {
    let n = 0;
    for (const note of notes) {
      if (note.scheduledAt && isToday(note.scheduledAt, dt.timeZone)) n++;
    }
    for (const card of kanbanCards) {
      const at = card.scheduledAt ?? card.dueAt;
      if (at && isToday(at, dt.timeZone)) n++;
    }
    return n;
  }, [notes, kanbanCards, dt.timeZone]);

  const linkedCards = useMemo(
    () => kanbanCards.filter((c) => c.linkedNoteId).length,
    [kanbanCards]
  );

  const recentNotes = useMemo(
    () => [...notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 6),
    [notes]
  );

  const weekAgo = startOfDay(Date.now(), dt.timeZone) - 6 * 86400000;
  const updatedThisWeek = useMemo(
    () => notes.filter((n) => n.updatedAt >= weekAgo).length,
    [notes, weekAgo]
  );

  const activity = useMemo(
    () => getLast7DaysActivity(notes, kanbanCards, dt.dateLocale, dt.timeZone),
    [notes, kanbanCards, dt.dateLocale, dt.timeZone]
  );
  const contentSegments = useMemo(() => {
    return getContentDistribution(notes, favoritesCount, kanbanCards, scheduleTotal).map((s) => ({
      ...s,
      label: t(CONTENT_SEGMENT_KEYS[s.id] ?? s.id),
    }));
  }, [notes, favoritesCount, kanbanCards, scheduleTotal, t]);

  const assetSegments = useMemo(
    () =>
      [
        { id: 'img', label: t('dashboard.segmentImage'), value: assetData.counts.image, color: '#ec4899' },
        { id: 'file', label: t('dashboard.segmentFile'), value: assetData.counts.file, color: '#8b5cf6' },
        { id: 'link', label: t('dashboard.segmentLink'), value: assetData.counts.link, color: '#0ea5e9' },
      ].filter((s) => s.value > 0),
    [assetData.counts, t]
  );

  const kanbanByGroup = useMemo(
    () =>
      getKanbanByGroup(kanbanGroups, kanbanCards).map((item) => ({
        ...item,
        name: getKanbanGroupDisplayName(item.name, t),
      })),
    [kanbanGroups, kanbanCards, t]
  );

  const totalItems =
    notes.length + kanbanCards.length + assetData.counts.all + tags.length + folders.length;

  const noteSpark = activity.map((d) => d.notes);
  const todoSpark = activity.map((d) => d.cards);

  const todayLabel = dt.formatDayHeading(dt.startOfDay(Date.now()));

  return (
    <div className="dashboard-panel">
      <div className="dashboard-hero">
        <div className="dashboard-hero-bg" aria-hidden />
        <div className="dashboard-hero-content">
          <div className="dashboard-hero-text">
            <span className="dashboard-hero-badge">
              <Sparkles size={14} />
              {t('dashboard.badge')}
            </span>
            <h1>{t('dashboard.title')}</h1>
            <p>{todayLabel}</p>
          </div>
          <div className="dashboard-hero-metric">
            <span className="dashboard-hero-metric-value">{totalItems}</span>
            <span className="dashboard-hero-metric-label">{t('dashboard.totalEntries')}</span>
            <div className="dashboard-hero-pills">
              <span>{t('dashboard.notesCount', { count: notes.length })}</span>
              <span>{t('dashboard.todosCount', { count: kanbanCards.length })}</span>
              <span>{t('dashboard.assetsCount', { count: assetData.counts.all })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <StatCard
          accent="violet"
          icon={<FileText size={20} />}
          label={t('dashboard.statNotes')}
          value={notes.length}
          hint={t('dashboard.updatesThisWeek', { count: updatedThisWeek })}
          spark={noteSpark}
          onClick={() => onNavigate('all')}
        />
        <StatCard
          accent="amber"
          icon={<Star size={20} />}
          label={t('dashboard.statFavorites')}
          value={favoritesCount}
          hint={
            notes.length
              ? t('dashboard.percentOfNotes', {
                  percent: Math.round((favoritesCount / notes.length) * 100),
                })
              : t('dashboard.noFavorites')
          }
          onClick={() => onNavigate('favorites')}
        />
        <StatCard
          accent="emerald"
          icon={<CheckSquare size={20} />}
          label={t('dashboard.statTodos')}
          value={kanbanCards.length}
          hint={t('dashboard.groupsLinked', { groups: kanbanGroups.length, linked: linkedCards })}
          spark={todoSpark}
          onClick={() => onNavigate('todos')}
        />
        <StatCard
          accent="sky"
          icon={<Calendar size={20} />}
          label={t('dashboard.statSchedule')}
          value={scheduleTotal}
          hint={t('dashboard.itemsToday', { count: todaySchedule })}
          onClick={() => onNavigate('schedule')}
        />
        <StatCard
          accent="rose"
          icon={<LayoutGrid size={20} />}
          label={t('dashboard.statGlobalAssets')}
          value={assetData.counts.all}
          hint={t('dashboard.assetsHint', {
            img: assetData.counts.image,
            file: assetData.counts.file,
            link: assetData.counts.link,
          })}
          onClick={onOpenGlobalAssets}
        />
      </div>

      <div className="dashboard-charts-row">
        <section className="dashboard-glass dashboard-glass--wide">
          <div className="dashboard-glass-head">
            <h3>
              <Activity size={18} />
              {t('dashboard.activity7Days')}
            </h3>
            <span className="dashboard-glass-meta">{t('dashboard.activityMeta')}</span>
          </div>
          <ActivityBarChart data={activity} />
        </section>

        <section className="dashboard-glass">
          <div className="dashboard-glass-head">
            <h3>
              <PieChart size={18} />
              {t('dashboard.dataComposition')}
            </h3>
          </div>
          <div className="dashboard-donut-row">
            <DonutChart
              segments={contentSegments}
              size={148}
              centerValue={contentSegments.reduce((s, x) => s + x.value, 0) || 0}
              centerLabel={t('dashboard.centerItem')}
              emptyLabel={t('dashboard.chartEmpty')}
            />
            <SegmentLegend segments={contentSegments} />
          </div>
        </section>
      </div>

      <div className="dashboard-charts-row dashboard-charts-row--3">
        <section className="dashboard-glass">
          <div className="dashboard-glass-head">
            <h3>
              <LayoutGrid size={18} />
              {t('dashboard.assetsByType')}
            </h3>
          </div>
          <div className="dashboard-donut-row dashboard-donut-row--compact">
            <DonutChart
              segments={assetSegments}
              size={120}
              stroke={18}
              centerValue={assetData.counts.all}
              centerLabel={t('dashboard.centerAsset')}
              emptyLabel={t('dashboard.chartEmpty')}
            />
            <SegmentLegend segments={assetSegments} />
          </div>
        </section>

        <section className="dashboard-glass">
          <div className="dashboard-glass-head">
            <h3>
              <Layers size={18} />
              {t('dashboard.todoByGroup')}
            </h3>
          </div>
          <HorizontalBarChart items={kanbanByGroup} color="#22c55e" emptyLabel={t('dashboard.chartNoData')} />
        </section>

        <section className="dashboard-glass">
          <div className="dashboard-glass-head">
            <h3>
              <FileText size={18} />
              {t('dashboard.recentNotes')}
            </h3>
          </div>
          {recentNotes.length === 0 ? (
            <p className="dashboard-empty">{t('dashboard.noNotes')}</p>
          ) : (
            <ul className="dashboard-timeline">
              {recentNotes.map((n, i) => (
                <li key={n.id}>
                  <button type="button" className="dashboard-timeline-btn" onClick={() => onOpenNote(n.id)}>
                    <span className="dashboard-timeline-dot" data-index={i} />
                    <span className="dashboard-timeline-body">
                      <span className="dashboard-timeline-title">
                        {n.title.trim() || t('noteList.untitled')}
                      </span>
                      <span className="dashboard-timeline-meta">
                        {dt.formatDateTime(n.updatedAt)}
                        {n.favorite && t('dashboard.favoriteBadge')}
                        {n.scheduledAt && t('dashboard.scheduleBadge')}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <DashboardBrowseList
        notes={notes}
        tags={tags}
        kanbanGroups={kanbanGroups}
        kanbanCards={kanbanCards}
        onOpenNote={onOpenNote}
        onOpenKanbanCard={onOpenKanbanCard}
        onOpenTag={onOpenTag}
        onGoToAsset={onGoToAsset}
        scrollBatchSize={scrollBatchSize}
        onHydrateNoteContents={onHydrateNoteContents}
      />
    </div>
  );
});
