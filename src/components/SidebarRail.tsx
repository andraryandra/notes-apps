import { useState, useEffect, useRef } from 'react';
import {
  Star,
  FileText,
  Tag,
  Plus,
  LayoutGrid,
  CheckSquare,
  Calendar,
  LayoutDashboard,
  Search,
  Folder as FolderIcon,
  FolderPlus,
  PanelLeftOpen,
} from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { FolderTree } from './FolderTree';
import { KanbanTree } from './KanbanTree';
import { SidebarTooltip } from './SidebarTooltip';
import { SidebarFlyout } from './SidebarFlyout';
import { useI18n } from '../i18n/useI18n';
import { staggerIn, motionEnter } from '../utils/motion';
import type { SidebarProps } from './sidebarTypes';
import './Sidebar.css';

type FlyoutPanel = 'search' | 'kanban' | 'folders' | 'tags' | null;

type Props = SidebarProps & {
  onExpand: () => void;
};

export function SidebarRail(props: Props) {
  const {
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
    onExpand,
  } = props;

  const { t } = useI18n();
  const [flyout, setFlyout] = useState<FlyoutPanel>(null);
  const railRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (railRef.current) staggerIn(railRef.current, '.sidebar-rail-btn', 32);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const active = rail.querySelector<HTMLElement>('.sidebar-rail-btn.active');
    if (active) motionEnter('navSpring', active);
  }, [sidebarView, flyout]);

  const toggleFlyout = (panel: FlyoutPanel) => {
    setFlyout((current) => (current === panel ? null : panel));
  };

  const closeFlyout = () => setFlyout(null);

  const flyoutTitle =
    flyout === 'search'
      ? t('globalSearch.title')
      : flyout === 'kanban'
        ? t('kanban.boardTitle')
        : flyout === 'folders'
          ? t('sidebar.folders')
          : flyout === 'tags'
            ? t('sidebar.tags')
            : '';

  return (
    <>
      <aside ref={railRef} className="sidebar sidebar--rail">
        <div className="sidebar-rail-header">
          <SidebarTooltip label={t('globalSearch.title')}>
            <button
              type="button"
              className={`sidebar-rail-btn ${flyout === 'search' || searchQuery ? 'active' : ''}`}
              onClick={() => toggleFlyout('search')}
              aria-label={t('globalSearch.title')}
              aria-expanded={flyout === 'search'}
            >
              <Search size={20} strokeWidth={2} />
            </button>
          </SidebarTooltip>
        </div>

        <nav className="sidebar-rail-nav" aria-label={t('sidebar.navLabel')}>
          <SidebarTooltip label={t('sidebar.dashboard')}>
            <button
              type="button"
              className={`sidebar-rail-btn ${sidebarView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onViewChange('dashboard')}
              aria-label={t('sidebar.dashboard')}
            >
              <LayoutDashboard size={20} strokeWidth={2} />
            </button>
          </SidebarTooltip>

          <SidebarTooltip label={t('sidebar.allNotes')} badge={noteCounts.all}>
            <button
              type="button"
              className={`sidebar-rail-btn ${sidebarView === 'all' ? 'active' : ''}`}
              onClick={() => onViewChange('all')}
              aria-label={t('sidebar.allNotes')}
            >
              <FileText size={20} strokeWidth={2} />
            </button>
          </SidebarTooltip>

          <SidebarTooltip label={t('sidebar.favorites')} badge={noteCounts.favorites}>
            <button
              type="button"
              className={`sidebar-rail-btn ${sidebarView === 'favorites' ? 'active' : ''}`}
              onClick={() => onViewChange('favorites')}
              aria-label={t('sidebar.favorites')}
            >
              <Star size={20} strokeWidth={2} />
            </button>
          </SidebarTooltip>

          <SidebarTooltip label={t('sidebar.todos')} badge={noteCounts.todosActive}>
            <button
              type="button"
              className={`sidebar-rail-btn ${sidebarView === 'todos' ? 'active' : ''}`}
              onClick={() => onViewChange('todos')}
              aria-label={t('sidebar.todos')}
            >
              <CheckSquare size={20} strokeWidth={2} />
            </button>
          </SidebarTooltip>

          <SidebarTooltip label={t('sidebar.schedule')} badge={noteCounts.schedule}>
            <button
              type="button"
              className={`sidebar-rail-btn ${sidebarView === 'schedule' ? 'active' : ''}`}
              onClick={() => onViewChange('schedule')}
              aria-label={t('sidebar.schedule')}
            >
              <Calendar size={20} strokeWidth={2} />
            </button>
          </SidebarTooltip>

          <SidebarTooltip label={t('sidebar.globalAssets')} badge={globalAssetCount}>
            <button
              type="button"
              className={`sidebar-rail-btn ${globalAssetsOpen ? 'active' : ''}`}
              onClick={onToggleGlobalAssets}
              aria-label={t('sidebar.globalAssetsTitle')}
            >
              <LayoutGrid size={20} strokeWidth={2} />
            </button>
          </SidebarTooltip>

          <div className="sidebar-rail-divider" role="separator" />

          {sidebarView === 'todos' &&
            onSelectKanbanGroup &&
            onSelectKanbanCard &&
            onCreateKanbanGroup &&
            onDeleteKanbanGroup && (
              <SidebarTooltip label={t('kanban.boardTitle')}>
                <button
                  type="button"
                  className={`sidebar-rail-btn ${flyout === 'kanban' ? 'active' : ''}`}
                  onClick={() => toggleFlyout('kanban')}
                  aria-label={t('kanban.boardTitle')}
                  aria-expanded={flyout === 'kanban'}
                >
                  <LayoutGrid size={20} strokeWidth={2} />
                </button>
              </SidebarTooltip>
            )}

          <SidebarTooltip label={t('sidebar.folders')}>
            <button
              type="button"
              className={`sidebar-rail-btn ${flyout === 'folders' || sidebarView === 'folder' ? 'active' : ''}`}
              onClick={() => toggleFlyout('folders')}
              aria-label={t('sidebar.folders')}
              aria-expanded={flyout === 'folders'}
            >
              <FolderIcon size={20} strokeWidth={2} />
            </button>
          </SidebarTooltip>

          <SidebarTooltip label={t('sidebar.tags')}>
            <button
              type="button"
              className={`sidebar-rail-btn ${flyout === 'tags' || sidebarView === 'tag' ? 'active' : ''}`}
              onClick={() => toggleFlyout('tags')}
              aria-label={t('sidebar.tags')}
              aria-expanded={flyout === 'tags'}
            >
              <Tag size={20} strokeWidth={2} />
            </button>
          </SidebarTooltip>

          <div className="sidebar-rail-divider" role="separator" />

          <SidebarTooltip label={t('sidebar.expandSidebar')}>
            <button
              type="button"
              className="sidebar-rail-btn sidebar-rail-btn--mode"
              onClick={onExpand}
              aria-label={t('sidebar.expandSidebar')}
            >
              <PanelLeftOpen size={20} strokeWidth={2} />
            </button>
          </SidebarTooltip>
        </nav>
      </aside>

      <SidebarFlyout open={flyout !== null} title={flyoutTitle} onClose={closeFlyout}>
        {flyout === 'search' && <GlobalSearch value={searchQuery} onChange={onSearchChange} />}

        {flyout === 'kanban' &&
          onSelectKanbanGroup &&
          onSelectKanbanCard &&
          onCreateKanbanGroup &&
          onDeleteKanbanGroup && (
            <>
              <div className="sidebar-flyout-tags-toolbar">
                <button type="button" className="sidebar-flyout-tags-add" onClick={onCreateKanbanGroup}>
                  <Plus size={14} />
                  {t('kanban.newGroup')}
                </button>
              </div>
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
            </>
          )}

        {flyout === 'folders' && (
          <>
            <div className="sidebar-flyout-tags-toolbar">
              <button
                type="button"
                className="sidebar-flyout-tags-add"
                onClick={() => onCreateFolder(null)}
              >
                <FolderPlus size={14} />
                {t('folderTree.newFolder')}
              </button>
            </div>
            <FolderTree
              folders={folders}
              selectedFolderId={sidebarView === 'folder' ? selectedFolderId : null}
              onSelect={(id) => onViewChange('folder', id)}
              onCreate={onCreateFolder}
              onRename={onRenameFolder}
              onDelete={onDeleteFolder}
            />
          </>
        )}

        {flyout === 'tags' && (
          <div className="sidebar-flyout-tags">
            <div className="sidebar-flyout-tags-toolbar">
              <button type="button" className="sidebar-flyout-tags-add" onClick={onCreateTag}>
                <Plus size={14} />
                {t('app.modal.newTag')}
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
        )}
      </SidebarFlyout>
    </>
  );
}
