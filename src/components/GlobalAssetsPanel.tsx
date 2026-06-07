import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PreviewProvider, usePreview } from '../context/PreviewContext';
import { AssetsPanel } from './AssetsPanel';
import { useI18n } from '../i18n/useI18n';
import { useFileKindFilterOptions, useNoteAssetFilterOptions } from '../hooks/useAssetFilterOptions';
import type { Note } from '../types';
import type { AssetTypeFilter, AssetFileKindFilter } from '../utils/parseNoteAssets';
import {
  filterGlobalNoteAssets,
  parseGlobalNoteAssets,
  type GlobalNoteAsset,
} from '../utils/parseGlobalNoteAssets';
import type { ParsedNoteAsset } from '../utils/parseNoteAssets';

interface Props {
  notes: Note[];
  onClose: () => void;
  onGoToAsset: (noteId: string, asset: ParsedNoteAsset) => void;
}

function GlobalAssetsPanelInner({ notes, onClose, onGoToAsset }: Props) {
  const { t } = useI18n();
  const filterOptions = useNoteAssetFilterOptions();
  const fileKindOptions = useFileKindFilterOptions();
  const { openPreview, openImagePreview } = usePreview();
  const [filter, setFilter] = useState<AssetTypeFilter>('all');
  const [fileKindFilter, setFileKindFilter] = useState<AssetFileKindFilter>('all');
  const [query, setQuery] = useState('');

  const { items, counts, fileKindCounts } = useMemo(() => parseGlobalNoteAssets(notes), [notes]);
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
    <AssetsPanel
      title={t('globalAssets.title')}
      className="note-assets-sidebar--global"
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
      }
    />
  );
}

export function GlobalAssetsPanel(props: Props) {
  return (
    <PreviewProvider>
      <GlobalAssetsPanelInner {...props} />
    </PreviewProvider>
  );
}
