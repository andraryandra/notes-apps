import {
  Image as ImageIcon,
  Paperclip,
  Link2,
  LayoutList,
} from 'lucide-react';
import type { AssetTypeFilter, AssetFileKindFilter } from '../utils/parseNoteAssets';

export interface AssetFilterOption {
  id: AssetTypeFilter;
  label: string;
  icon: typeof ImageIcon;
}

export interface FileKindFilterOption {
  id: AssetFileKindFilter;
  label: string;
}

/** Chip filter — Semua, Gambar, File, Link */
export const NOTE_ASSET_FILTERS: AssetFilterOption[] = [
  { id: 'all', label: 'Semua', icon: LayoutList },
  { id: 'image', label: 'Gambar', icon: ImageIcon },
  { id: 'file', label: 'File', icon: Paperclip },
  { id: 'link', label: 'Link', icon: Link2 },
];

/** Dropdown jenis file — hanya di panel aset global */
export const FILE_KIND_FILTERS: FileKindFilterOption[] = [
  { id: 'all', label: 'Semua jenis file' },
  { id: 'pdf', label: 'PDF' },
  { id: 'excel', label: 'Excel' },
  { id: 'word', label: 'Word' },
];
