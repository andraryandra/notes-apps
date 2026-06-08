import type { Folder } from '../types';
import { buildFolderTree } from '../hooks/useNotesStore';

export interface FolderSelectItem {
  id: string;
  name: string;
  depth: number;
  /** Jalur breadcrumb penuh, mis. "Kerja / Klien A" */
  path: string;
  parentId: string | null;
}

/** Daftar folder dengan depth untuk tampilan pohon */
export function buildFolderSelectItems(folders: Folder[]): FolderSelectItem[] {
  const items: FolderSelectItem[] = [];

  const walk = (parentId: string | null, depth: number, prefix: string) => {
    for (const folder of buildFolderTree(folders, parentId)) {
      const path = prefix ? `${prefix} / ${folder.name}` : folder.name;
      items.push({
        id: folder.id,
        name: folder.name,
        depth,
        path,
        parentId: folder.parentId,
      });
      walk(folder.id, depth + 1, path);
    }
  };

  walk(null, 0, '');
  return items;
}

export function getFolderPathLabel(folders: Folder[], folderId: string | null): string {
  if (!folderId) return '';
  return buildFolderSelectItems(folders).find((f) => f.id === folderId)?.path ?? '';
}

export function collectFolderDescendantIds(folders: Folder[], rootId: string): Set<string> {
  const collectIds = (folderId: string): string[] => {
    const children = folders.filter((f) => f.parentId === folderId).map((f) => f.id);
    return [folderId, ...children.flatMap(collectIds)];
  };
  return new Set(collectIds(rootId));
}

export function countNotesInFolderSet(
  notes: { folderId: string | null }[],
  folderIds: Set<string>
): number {
  return notes.filter((n) => n.folderId && folderIds.has(n.folderId)).length;
}
