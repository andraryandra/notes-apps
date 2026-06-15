import { Star, FileText, Tag, Plus, LayoutGrid, CheckSquare, Calendar, LayoutDashboard, PanelLeftClose } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { FolderTree } from './FolderTree';
import { KanbanTree } from './KanbanTree';
import { useI18n } from '../i18n/useI18n';
import type { SidebarProps } from './sidebarTypes';
import './Sidebar.css';

type Props = SidebarProps & {
  onCollapse: () => void;
};

export function SidebarExpanded({
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
  onCollapse,
}: Props) {
  const { t } = useI18n();

  return (
    <aside className="sidebar sidebar--expanded">
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

      {sidebarView === 'todos' &&
        onSelectKanbanGroup &&
        onSelectKanbanCard &&
        onCreateKanbanGroup &&
        onDeleteKanbanGroup && (
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
                  title={t('sidebar.deleteTag')}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-mode-bar">
        <button
          type="button"
          className="sidebar-mode-btn"
          onClick={onCollapse}
          title={t('sidebar.collapseToRail')}
        >
          <PanelLeftClose size={18} />
          <span>{t('sidebar.collapseToRail')}</span>
        </button>
      </div>
    </aside>
  );
}
