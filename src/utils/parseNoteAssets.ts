import type { FileKind } from './fileKinds';
import { kindLabel } from './fileKinds';

export interface ParsedNoteAsset {
  id: string;
  type: 'image' | 'file' | 'link';
  /** Indeks di antara elemen sejenis di dokumen (untuk scroll) */
  index: number;
  title: string;
  subtitle?: string;
  storedUrl?: string;
  href?: string;
  src?: string;
  fileKind?: FileKind;
  mimeType?: string;
}

export type AssetTypeFilter = 'all' | 'image' | 'file' | 'link';

export type AssetFileKindFilter = 'all' | 'pdf' | 'excel' | 'word';

export type AssetTypeFilterCounts = Record<AssetTypeFilter, number>;

export type AssetFileKindFilterCounts = Record<AssetFileKindFilter, number>;

export function countAssetsByTypeFilter(items: ParsedNoteAsset[]): AssetTypeFilterCounts {
  return {
    all: items.length,
    image: items.filter((i) => i.type === 'image').length,
    file: items.filter((i) => i.type === 'file').length,
    link: items.filter((i) => i.type === 'link').length,
  };
}

export function countAssetsByFileKindFilter(items: ParsedNoteAsset[]): AssetFileKindFilterCounts {
  const files = items.filter((i) => i.type === 'file');
  return {
    all: files.length,
    pdf: files.filter((i) => i.fileKind === 'pdf').length,
    excel: files.filter((i) => i.fileKind === 'excel').length,
    word: files.filter((i) => i.fileKind === 'word').length,
  };
}

export function filterAssets<T extends ParsedNoteAsset>(
  items: T[],
  typeFilter: AssetTypeFilter,
  fileKindFilter: AssetFileKindFilter = 'all'
): T[] {
  if (typeFilter === 'image') return items.filter((i) => i.type === 'image');
  if (typeFilter === 'link') return items.filter((i) => i.type === 'link');

  if (typeFilter === 'file') {
    let list = items.filter((i) => i.type === 'file');
    if (fileKindFilter !== 'all') {
      list = list.filter((i) => i.fileKind === fileKindFilter);
    }
    return list;
  }

  if (fileKindFilter !== 'all') {
    return items.filter((i) => i.type === 'file' && i.fileKind === fileKindFilter);
  }
  return items;
}

export interface ParsedNoteAssetsResult {
  items: ParsedNoteAsset[];
  counts: AssetTypeFilterCounts;
}

export function parseNoteAssets(html: string): ParsedNoteAssetsResult {
  const doc = new DOMParser().parseFromString(html || '<p></p>', 'text/html');
  const items: ParsedNoteAsset[] = [];
  let imageIdx = 0;
  let fileIdx = 0;
  let linkIdx = 0;

  const walk = (parent: Element) => {
    for (const el of Array.from(parent.children)) {
      if (el.matches('figure.note-image-figure')) {
        const img = el.querySelector('img');
        const caption = el.querySelector('figcaption')?.textContent?.trim();
        const storedSrc = img?.getAttribute('data-stored-src') ?? undefined;
        const alt = img?.getAttribute('alt')?.trim();
        const idx = imageIdx++;
        items.push({
          id: `image-${idx}`,
          type: 'image',
          index: idx,
          title: caption || alt || `Gambar ${idx + 1}`,
          subtitle: caption && alt ? alt : undefined,
          storedUrl: storedSrc,
          src: img?.getAttribute('src') ?? undefined,
        });
        continue;
      }

      if (el.tagName === 'IMG' && !el.closest('figure.note-image-figure')) {
        const img = el as HTMLImageElement;
        const storedSrc = img.getAttribute('data-stored-src') ?? undefined;
        const alt = img.getAttribute('alt')?.trim();
        const idx = imageIdx++;
        items.push({
          id: `image-${idx}`,
          type: 'image',
          index: idx,
          title: alt || `Gambar ${idx + 1}`,
          storedUrl: storedSrc,
          src: img.getAttribute('src') ?? undefined,
        });
        continue;
      }

      if (el.hasAttribute('data-note-attachment')) {
        const fileName = el.getAttribute('data-file-name') || 'file';
        const fileKind = (el.getAttribute('data-file-kind') || 'other') as FileKind;
        const storedUrl = el.getAttribute('data-stored-url') ?? undefined;
        const mimeType = el.getAttribute('data-mime-type') ?? undefined;
        const idx = fileIdx++;
        items.push({
          id: `file-${idx}`,
          type: 'file',
          index: idx,
          title: fileName,
          subtitle: kindLabel(fileKind),
          storedUrl,
          fileKind,
          mimeType,
        });
        continue;
      }

      if (el.tagName === 'A') {
        const href = el.getAttribute('href');
        if (href) {
          const label = el.textContent?.trim();
          const idx = linkIdx++;
          items.push({
            id: `link-${idx}`,
            type: 'link',
            index: idx,
            title: label || href,
            subtitle: label ? href : undefined,
            href,
          });
        }
        walk(el);
        continue;
      }

      walk(el);
    }
  };

  walk(doc.body);

  const counts = countAssetsByTypeFilter(items);

  return { items, counts };
}

/** @deprecated gunakan filterAssets */
export function filterNoteAssets<T extends ParsedNoteAsset>(
  items: T[],
  filter: AssetTypeFilter
): T[] {
  return filterAssets(items, filter);
}
