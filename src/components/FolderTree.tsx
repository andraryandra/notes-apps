import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { buildFolderTree } from '../hooks/useNotesStore';
import type { Folder as FolderType } from '../types';
import './FolderTree.css';

interface Props {
  folders: FolderType[];
  selectedFolderId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: (parentId: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

function FolderNode({
  folder,
  folders,
  depth,
  selectedFolderId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  t,
}: {
  folder: FolderType;
  folders: FolderType[];
  depth: number;
  selectedFolderId: string | null;
  onSelect: (id: string) => void;
  onCreate: (parentId: string | null) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  t: (key: string) => string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const children = buildFolderTree(folders, folder.id);
  const isSelected = selectedFolderId === folder.id;
  const hasChildren = children.length > 0;

  const submitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== folder.name) onRename(folder.id, trimmed);
    setRenaming(false);
  };

  return (
    <div className="folder-node">
      <div
        className={`folder-row ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <button
          type="button"
          className="folder-expand"
          onClick={() => setExpanded(!expanded)}
          aria-label={expanded ? t('folderTree.collapse') : t('folderTree.expand')}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="folder-expand-spacer" />
          )}
        </button>
        <button
          type="button"
          className="folder-label"
          onClick={() => onSelect(folder.id)}
          onDoubleClick={() => {
            setRenaming(true);
            setRenameValue(folder.name);
          }}
        >
          {expanded ? <FolderOpen size={16} /> : <Folder size={16} />}
          {renaming ? (
            <input
              className="folder-rename-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitRename();
                if (e.key === 'Escape') setRenaming(false);
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="folder-name">{folder.name}</span>
          )}
        </button>
        <div className="folder-actions">
          <button
            type="button"
            className="folder-action-btn"
            title={t('folderTree.newSubfolder')}
            onClick={() => onCreate(folder.id)}
          >
            <FolderPlus size={14} />
          </button>
          <button
            type="button"
            className="folder-action-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <>
              <div className="folder-menu-backdrop" onClick={() => setMenuOpen(false)} />
              <div className="folder-menu">
                <button
                  type="button"
                  onClick={() => {
                    setRenaming(true);
                    setRenameValue(folder.name);
                    setMenuOpen(false);
                  }}
                >
                  <Pencil size={14} /> {t('folderTree.rename')}
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    onDelete(folder.id);
                    setMenuOpen(false);
                  }}
                >
                  <Trash2 size={14} /> {t('folderTree.delete')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {expanded &&
        children.map((child) => (
          <FolderNode
            key={child.id}
            folder={child}
            folders={folders}
            depth={depth + 1}
            selectedFolderId={selectedFolderId}
            onSelect={onSelect}
            onCreate={onCreate}
            onRename={onRename}
            onDelete={onDelete}
            t={t}
          />
        ))}
    </div>
  );
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: Props) {
  const { t } = useI18n();
  const roots = buildFolderTree(folders, null);

  return (
    <div className="folder-tree">
      <div className="folder-tree-header">
        <span>{t('sidebar.folders')}</span>
        <button type="button" className="folder-add-root" title={t('folderTree.newFolder')} onClick={() => onCreate(null)}>
          <FolderPlus size={16} />
        </button>
      </div>
      <div className="folder-tree-list">
        {roots.length === 0 ? (
          <p className="folder-empty">{t('folderTree.empty')}</p>
        ) : (
          roots.map((f) => (
            <FolderNode
              key={f.id}
              folder={f}
              folders={folders}
              depth={0}
              selectedFolderId={selectedFolderId}
              onSelect={onSelect}
              onCreate={onCreate}
              onRename={onRename}
              onDelete={onDelete}
              t={t}
            />
          ))
        )}
      </div>
    </div>
  );
}
