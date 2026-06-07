import type { Note } from '../types';
import {
  parseNoteAssets,
  filterAssets,
  countAssetsByTypeFilter,
  countAssetsByFileKindFilter,
  type AssetTypeFilter,
  type AssetFileKindFilter,
  type AssetTypeFilterCounts,
  type AssetFileKindFilterCounts,
  type ParsedNoteAsset,
} from './parseNoteAssets';

export interface GlobalNoteAsset extends ParsedNoteAsset {
  noteId: string;
  noteTitle: string;
}

export function parseGlobalNoteAssets(notes: Note[]): {
  items: GlobalNoteAsset[];
  counts: AssetTypeFilterCounts;
  fileKindCounts: AssetFileKindFilterCounts;
} {
  const items: GlobalNoteAsset[] = [];

  for (const note of notes) {
    const { items: noteItems } = parseNoteAssets(note.content);
    const title = note.title.trim() || 'Tanpa judul';
    for (const asset of noteItems) {
      items.push({
        ...asset,
        id: `${note.id}-${asset.id}`,
        noteId: note.id,
        noteTitle: title,
      });
    }
  }

  return {
    items,
    counts: countAssetsByTypeFilter(items),
    fileKindCounts: countAssetsByFileKindFilter(items),
  };
}

export function filterGlobalNoteAssets(
  items: GlobalNoteAsset[],
  typeFilter: AssetTypeFilter,
  fileKindFilter: AssetFileKindFilter,
  query: string
): GlobalNoteAsset[] {
  let list = filterAssets(items, typeFilter, fileKindFilter);
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.noteTitle.toLowerCase().includes(q) ||
      a.subtitle?.toLowerCase().includes(q) ||
      a.href?.toLowerCase().includes(q)
  );
}
