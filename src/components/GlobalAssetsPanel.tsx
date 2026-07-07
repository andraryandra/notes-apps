import { useMemo, useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { PreviewProvider, usePreview } from '../context/PreviewContext';
import { AssetsPanel } from './AssetsPanel';
import { useI18n } from '../i18n/useI18n';
import { useDateTime } from '../hooks/useDateTime';
import { useFileKindFilterOptions, useNoteAssetFilterOptions } from '../hooks/useAssetFilterOptions';
import type { Note } from '../types';
import type { AssetTypeFilter, AssetFileKindFilter } from '../utils/parseNoteAssets';
import {
  filterGlobalNoteAssets,
  parseGlobalNoteAssets,
  type GlobalNoteAsset,
} from '../utils/parseGlobalNoteAssets';
import type { ParsedNoteAsset } from '../utils/parseNoteAssets';
import { motionEnter } from '../utils/motion';
import { DateRangeFilter } from './DateRangeFilter';

interface Props {
  notes: Note[];
  overlay?: boolean;
  onClose: () => void;
  onGoToAsset: (noteId: string, asset: ParsedNoteAsset) => void;
}

function GlobalAssetsPanelInner({ notes, overlay, onClose, onGoToAsset }: Props) {
  const { t } = useI18n();
  const dt = useDateTime();
  const filterOptions = useNoteAssetFilterOptions();
  const fileKindOptions = useFileKindFilterOptions();
  const { openPreview, openImagePreview } = usePreview();
  const [filter, setFilter] = useState<AssetTypeFilter>('all');
  const [fileKindFilter, setFileKindFilter] = useState<AssetFileKindFilter>('all');
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panelRef.current?.querySelector('.note-assets-sidebar--global') as HTMLElement | null;
    if (!el) return;
    el.classList.add('motion-from-hidden');
    motionEnter('viewPanel', el);
  }, []);

  const dateFilteredNotes = useMemo(() => {
    let list = notes;
    const startAt = startDate ? dt.fromDatetimeLocalValue(`${startDate}T00:00`) : null;
    const endStart = endDate ? dt.fromDatetimeLocalValue(`${endDate}T00:00`) : null;
    const endAt = endStart != null ? dt.endOfDay(endStart) : null;
    if (startAt != null) list = list.filter((n) => n.updatedAt >= startAt);
    if (endAt != null) list = list.filter((n) => n.updatedAt <= endAt);
    return list;
  }, [notes, startDate, endDate, dt]);

  const { items, counts, fileKindCounts } = useMemo(
    () => parseGlobalNoteAssets(dateFilteredNotes),
    [dateFilteredNotes]
  );
  const visible = useMemo(
    () => filterGlobalNoteAssets(items, filter, fileKindFilter, query),
    [items, filter, fileKindFilter, query]
  );

  const listItems = visible.map((a) => ({
    ...a,
    contextLabel: a.noteTitle,
  }));

  const handleFilterChange = (next: AssetTypeFilter) => {
    setFilter(next);
    if (next === 'image' || next === 'link') {
      setFileKindFilter('all');
    }
  };

  const handleSelect = (asset: GlobalNoteAsset) => {
    const { noteId, noteTitle: _t, ...parsed } = asset;
    onGoToAsset(noteId, parsed);
  };

  const handlePreview = async (asset: GlobalNoteAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    if (asset.type === 'image') {
      let src = asset.src;
      if (asset.storedUrl?.startsWith('notes-image://') && window.electronAPI) {
        src = (await window.electronAPI.resolveImage(asset.storedUrl)) ?? src;
      }
      if (src) openImagePreview(src, asset.title);
      return;
    }
    if (asset.type === 'file' && asset.storedUrl && asset.fileKind) {
      openPreview({
        mode: 'file',
        title: asset.title,
        storedUrl: asset.storedUrl,
        fileKind: asset.fileKind,
        fileName: asset.title,
        mimeType: asset.mimeType || 'application/octet-stream',
      });
    }
  };

  const handleOpenLink = (asset: GlobalNoteAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    if (asset.href) window.open(asset.href, '_blank', 'noopener,noreferrer');
  };

  const emptyMessage =
    filter === 'all' && fileKindFilter === 'all' && !query.trim()
      ? t('globalAssets.emptyAll')
      : t('globalAssets.emptyFilter');

  return (
    <div ref={panelRef}>
    <AssetsPanel
      title={t('globalAssets.title')}
      className={`note-assets-sidebar--global ${overlay ? 'note-assets-sidebar--overlay' : ''}`.trim()}
      items={listItems}
      counts={counts}
      filter={filter}
      onFilterChange={handleFilterChange}
      filterOptions={filterOptions}
      fileKindFilter={fileKindFilter}
      onFileKindFilterChange={setFileKindFilter}
      fileKindOptions={fileKindOptions}
      fileKindCounts={fileKindCounts}
      emptyMessage={emptyMessage}
      onClose={onClose}
      onSelect={(a) => handleSelect(a as GlobalNoteAsset)}
      onPreview={(a, e) => void handlePreview(a as GlobalNoteAsset, e)}
      onOpenLink={(a, e) => handleOpenLink(a as GlobalNoteAsset, e)}
      searchSlot={
        <>
          <div className="global-assets-search">
            <Search size={16} className="global-assets-search-icon" aria-hidden />
            <input
              type="search"
              className="global-assets-search-input"
              placeholder={t('globalAssets.searchPlaceholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="global-assets-date-range">
            <DateRangeFilter
              className="global-assets-date-filter"
              startDate={startDate}
              endDate={endDate}
              enablePresets
              splitCalendars
              onStartDateChange={(value) => {
                setStartDate(value);
                if (value && endDate && endDate < value) setEndDate(value);
              }}
              onEndDateChange={(value) => {
                if (startDate && value && value < startDate) {
                  setEndDate(startDate);
                  return;
                }
                setEndDate(value);
              }}
              onReset={() => {
                setStartDate('');
                setEndDate('');
              }}
            />
          </div>
        </>
      }
    />
    </div>
  );
}

export function GlobalAssetsPanel(props: Props) {
  return (
    <PreviewProvider>
      <GlobalAssetsPanelInner {...props} />
    </PreviewProvider>
  );
}
