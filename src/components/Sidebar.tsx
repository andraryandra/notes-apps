import { Star, FileText, Tag, Plus, LayoutGrid, CheckSquare, Calendar, LayoutDashboard } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { FolderTree } from './FolderTree';
import { KanbanTree } from './KanbanTree';
import { useI18n } from '../i18n/useI18n';
import type { Folder, Tag as TagType, SidebarView, KanbanGroup, KanbanCard } from '../types';
import './Sidebar.css';

interface Props {
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

export function Sidebar({
  folders,
  tags,
  searchQuery,
  onSearchChange,
  sidebarView,
  selectedFolderId,
  selectedTagId,
  onViewChange,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateTag,
  onDeleteTag,
  noteCounts,
  globalAssetsOpen,
  globalAssetCount,
  onToggleGlobalAssets,
  kanbanGroups = [],
  kanbanCards = [],
  selectedKanbanGroupId = null,
  selectedKanbanCardId = null,
  onSelectKanbanGroup,
  onSelectKanbanCard,
  onCreateKanbanGroup,
  onDeleteKanbanGroup,
}: Props) {
  const { t } = useI18n();
  return (
    <aside className="sidebar">
      <GlobalSearch value={searchQuery} onChange={onSearchChange} />

      <nav className="sidebar-nav">
        <button
          type="button"
          className={`nav-item ${sidebarView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          <LayoutDashboard size={18} />
          <span>{t('sidebar.dashboard')}</span>
        </button>
        <button
          type="button"
          className={`nav-item ${sidebarView === 'all' ? 'active' : ''}`}
          onClick={() => onViewChange('all')}
        >
          <FileText size={18} />
          <span>{t('sidebar.allNotes')}</span>
          <span className="nav-badge">{noteCounts.all}</span>
        </button>
        <button
          type="button"
          className={`nav-item ${sidebarView === 'favorites' ? 'active' : ''}`}
          onClick={() => onViewChange('favorites')}
        >
          <Star size={18} />
          <span>{t('sidebar.favorites')}</span>
          <span className="nav-badge">{noteCounts.favorites}</span>
        </button>
        <button
          type="button"
          className={`nav-item ${sidebarView === 'todos' ? 'active' : ''}`}
          onClick={() => onViewChange('todos')}
        >
          <CheckSquare size={18} />
          <span>{t('sidebar.todos')}</span>
          <span className="nav-badge">{noteCounts.todosActive}</span>
        </button>
        <button
          type="button"
          className={`nav-item ${sidebarView === 'schedule' ? 'active' : ''}`}
          onClick={() => onViewChange('schedule')}
        >
          <Calendar size={18} />
          <span>{t('sidebar.schedule')}</span>
          <span className="nav-badge">{noteCounts.schedule}</span>
        </button>
        <button
          type="button"
          className={`nav-item ${globalAssetsOpen ? 'active' : ''}`}
          onClick={onToggleGlobalAssets}
          title={t('sidebar.globalAssetsTitle')}
        >
          <LayoutGrid size={18} />
          <span>{t('sidebar.globalAssets')}</span>
          <span className="nav-badge">{globalAssetCount}</span>
        </button>
      </nav>

      {sidebarView === 'todos' && onSelectKanbanGroup && onSelectKanbanCard && onCreateKanbanGroup && onDeleteKanbanGroup && (
        <KanbanTree
          groups={kanbanGroups}
          cards={kanbanCards}
          selectedGroupId={selectedKanbanGroupId}
          selectedCardId={selectedKanbanCardId}
          onSelectGroup={onSelectKanbanGroup}
          onSelectCard={onSelectKanbanCard}
          onCreateGroup={onCreateKanbanGroup}
          onDeleteGroup={onDeleteKanbanGroup}
        />
      )}

      <FolderTree
        folders={folders}
        selectedFolderId={sidebarView === 'folder' ? selectedFolderId : null}
        onSelect={(id) => onViewChange('folder', id)}
        onCreate={onCreateFolder}
        onRename={onRenameFolder}
        onDelete={onDeleteFolder}
      />

      <div className="tags-section">
        <div className="tags-header">
          <Tag size={14} />
          <span>{t('sidebar.tags')}</span>
          <button type="button" className="tag-add-btn" onClick={onCreateTag} title={t('app.modal.newTag')}>
            <Plus size={16} />
          </button>
        </div>
        <div className="tags-list">
          {tags.length === 0 ? (
            <p className="tags-empty">{t('sidebar.noTags')}</p>
          ) : (
            tags.map((tag) => (
              <div key={tag.id} className="tag-row-wrap">
                <button
                  type="button"
                  className={`tag-item ${sidebarView === 'tag' && selectedTagId === tag.id ? 'active' : ''}`}
                  onClick={() => onViewChange('tag', null, tag.id)}
                >
                  <span className="tag-dot" style={{ background: tag.color }} />
                  <span>{tag.name}</span>
                </button>
                <button
                  type="button"
                  className="tag-delete"
                  onClick={() => onDeleteTag(tag.id)}
                  title="Hapus tag"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
