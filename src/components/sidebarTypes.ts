import type { Folder, Tag as TagType, SidebarView, KanbanGroup, KanbanCard } from '../types';

export interface SidebarProps {
  folders: Folder[];
  tags: TagType[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sidebarView: SidebarView;
  selectedFolderId: string | null;
  selectedTagId: string | null;
  onViewChange: (view: SidebarView, folderId?: string | null, tagId?: string | null) => void;
  onCreateFolder: (parentId: string | null) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onCreateTag: () => void;
  onDeleteTag: (id: string) => void;
  noteCounts: { all: number; favorites: number; todosActive: number; schedule: number };
  globalAssetsOpen: boolean;
  globalAssetCount: number;
  onToggleGlobalAssets: () => void;
  kanbanGroups?: KanbanGroup[];
  kanbanCards?: KanbanCard[];
  selectedKanbanGroupId?: string | null;
  selectedKanbanCardId?: string | null;
  onSelectKanbanGroup?: (groupId: string) => void;
  onSelectKanbanCard?: (cardId: string, groupId: string) => void;
  onCreateKanbanGroup?: () => void;
  onDeleteKanbanGroup?: (groupId: string) => void;
}
