import { useEffect, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { usePreview } from '../context/PreviewContext';
import { AssetsPanel } from './AssetsPanel';
import { useI18n } from '../i18n/useI18n';
import { useNoteAssetFilterOptions } from '../hooks/useAssetFilterOptions';
import {
  parseNoteAssets,
  filterNoteAssets,
  type AssetTypeFilter,
  type ParsedNoteAsset,
} from '../utils/parseNoteAssets';
import { scrollToNoteAsset } from '../utils/scrollToNoteAsset';

interface Props {
  content: string;
  editor: Editor | null;
  onClose: () => void;
}

export function NoteAssetsSidebar({ content, editor, onClose }: Props) {
  const { t } = useI18n();
  const filterOptions = useNoteAssetFilterOptions();
  const { openPreview, openImagePreview } = usePreview();
  const [filter, setFilter] = useState<AssetTypeFilter>('all');
  const [liveHtml, setLiveHtml] = useState(content);

  useEffect(() => {
    if (!editor) {
      setLiveHtml(content);
      return;
    }
    const sync = () => setLiveHtml(editor.getHTML());
    sync();
    editor.on('update', sync);
    return () => {
      editor.off('update', sync);
    };
  }, [editor, content]);

  const { items, counts } = useMemo(() => parseNoteAssets(liveHtml), [liveHtml]);
  const visible = useMemo(() => filterNoteAssets(items, filter), [items, filter]);

  const handleSelect = (asset: ParsedNoteAsset) => {
    scrollToNoteAsset(editor, asset);
  };

  const handlePreview = async (asset: ParsedNoteAsset, e: React.MouseEvent) => {
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

  const handleOpenLink = (asset: ParsedNoteAsset, e: React.MouseEvent) => {
    e.stopPropagation();
    if (asset.href) window.open(asset.href, '_blank', 'noopener,noreferrer');
  };

  const emptyMessage = useMemo(() => {
    if (filter === 'all') return t('noteAssets.emptyAll');
    if (filter === 'image') return t('noteAssets.emptyImages');
    if (filter === 'file') return t('noteAssets.emptyFiles');
    return t('noteAssets.emptyLinks');
  }, [filter, t]);

  return (
    <AssetsPanel
      title={t('noteAssets.title')}
      items={visible}
      counts={counts}
      filter={filter}
      onFilterChange={setFilter}
      filterOptions={filterOptions}
      emptyMessage={emptyMessage}
      onClose={onClose}
      onSelect={handleSelect}
      onPreview={handlePreview}
      onOpenLink={handleOpenLink}
    />
  );
}
