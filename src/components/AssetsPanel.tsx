import { useMemo } from 'react';
import {
  Image as ImageIcon,
  Paperclip,
  Link2,
  ExternalLink,
  Eye,
  X,
} from 'lucide-react';
import { SearchableSelect } from './SearchableSelect';
import type {
  AssetTypeFilter,
  AssetTypeFilterCounts,
  AssetFileKindFilter,
  AssetFileKindFilterCounts,
  ParsedNoteAsset,
} from '../utils/parseNoteAssets';
import type { AssetFilterOption, FileKindFilterOption } from '../utils/assetFilters';
import { NOTE_ASSET_FILTERS } from '../utils/assetFilters';
import { useI18n } from '../i18n/useI18n';
import './NoteAssetsSidebar.css';

export interface AssetListItem extends ParsedNoteAsset {
  /** Baris kedua opsional (mis. nama catatan di panel global) */
  contextLabel?: string;
}

interface Props {
  title: string;
  className?: string;
  items: AssetListItem[];
  counts: AssetTypeFilterCounts;
  filter: AssetTypeFilter;
  onFilterChange: (f: AssetTypeFilter) => void;
  filterOptions?: AssetFilterOption[];
  fileKindFilter?: AssetFileKindFilter;
  onFileKindFilterChange?: (f: AssetFileKindFilter) => void;
  fileKindOptions?: FileKindFilterOption[];
  fileKindCounts?: AssetFileKindFilterCounts;
  emptyMessage: string;
  onClose: () => void;
  onSelect: (asset: AssetListItem) => void;
  onPreview?: (asset: AssetListItem, e: React.MouseEvent) => void;
  onOpenLink?: (asset: AssetListItem, e: React.MouseEvent) => void;
  searchSlot?: React.ReactNode;
}

export function AssetsPanel({
  title,
  className = '',
  items,
  counts,
  filter,
  onFilterChange,
  filterOptions = NOTE_ASSET_FILTERS,
  fileKindFilter,
  onFileKindFilterChange,
  fileKindOptions,
  fileKindCounts,
  emptyMessage,
  onClose,
  onSelect,
  onPreview,
  onOpenLink,
  searchSlot,
}: Props) {
  const { t } = useI18n();
  const countFor = (id: AssetTypeFilter) => counts[id] ?? 0;
  const fileKindSelectOptions = useMemo(
    () =>
      (fileKindOptions ?? []).map(({ id, label }) => ({
        value: id,
        label: `${label} (${fileKindCounts?.[id] ?? 0})`,
      })),
    [fileKindOptions, fileKindCounts]
  );
  const showFileKindDropdown =
    fileKindOptions &&
    fileKindOptions.length > 0 &&
    onFileKindFilterChange &&
    fileKindFilter !== undefined &&
    (filter === 'all' || filter === 'file');

  return (
    <aside className={`note-assets-sidebar ${className}`.trim()} aria-label={title}>
      <header className="note-assets-header">
        <h2 className="note-assets-title">{title}</h2>
        <button type="button" className="note-assets-close" onClick={onClose} title={t('globalAssets.closePanel')}>
          <X size={18} />
        </button>
      </header>

      {searchSlot}

      <div className="note-assets-filters" role="tablist">
        {filterOptions.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={filter === id}
            className={`note-assets-filter ${filter === id ? 'active' : ''}`}
            onClick={() => onFilterChange(id)}
          >
            <Icon size={14} />
            <span>{label}</span>
            <span className="note-assets-filter-count">{countFor(id)}</span>
          </button>
        ))}
      </div>

      {showFileKindDropdown && (
        <div className="note-assets-filter-row">
          <span className="note-assets-filter-label">{t('globalAssets.fileKindLabel')}</span>
          <SearchableSelect
            className="note-assets-file-kind-select"
            value={fileKindFilter}
            onChange={(v) => onFileKindFilterChange(v as AssetFileKindFilter)}
            options={fileKindSelectOptions}
            searchable={false}
            placeholder={t('globalAssets.fileKindPlaceholder')}
          />
        </div>
      )}

      <div className="note-assets-list">
        {items.length === 0 ? (
          <p className="note-assets-empty">{emptyMessage}</p>
        ) : (
          items.map((asset) => (
            <div
              key={asset.id}
              role="button"
              tabIndex={0}
              className={`note-assets-item note-assets-item--${asset.type}`}
              onClick={() => onSelect(asset)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(asset);
                }
              }}
            >
              <span className="note-assets-item-icon" aria-hidden>
                {asset.type === 'image' && <ImageIcon size={16} />}
                {asset.type === 'file' && <Paperclip size={16} />}
                {asset.type === 'link' && <Link2 size={16} />}
              </span>
              <span className="note-assets-item-text">
                <span className="note-assets-item-title">{asset.title}</span>
                {(asset.contextLabel || asset.subtitle) && (
                  <span className="note-assets-item-sub">
                    {asset.contextLabel}
                    {asset.contextLabel && asset.subtitle ? ' · ' : ''}
                    {asset.subtitle}
                  </span>
                )}
              </span>
              <span className="note-assets-item-actions">
                {asset.type === 'link' && onOpenLink && (
                  <button
                    type="button"
                    className="note-assets-item-action"
                    title={t('globalAssets.openLink')}
                    onClick={(e) => onOpenLink(asset, e)}
                  >
                    <ExternalLink size={15} />
                  </button>
                )}
                {(asset.type === 'image' || asset.type === 'file') && onPreview && (
                  <button
                    type="button"
                    className="note-assets-item-action"
                    title={t('globalAssets.preview')}
                    onClick={(e) => onPreview(asset, e)}
                  >
                    <Eye size={15} />
                  </button>
                )}
              </span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
