import {
  useMemo,
  useRef,
  memo,
  useState,
  useCallback,
  useEffect,
  type MouseEvent,
} from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus, Star, Trash2, CheckSquare, Square, X, Pin, FolderInput } from 'lucide-react';
import { stripHtml, getFolderPath } from '../hooks/useNotesStore';
import { useListScrollClass } from '../hooks/useListScrollClass';
import { sortNotesForList } from '../utils/exportNote';
import { NoteTagChips } from './NoteTagChips';
import { NoteMetaTokens } from './NoteMetaTokens';
import { NoteContextMenu, type NoteContextMenuState } from './NoteContextMenu';
import { MoveToFolderDialog } from './MoveToFolderDialog';
import { useI18n } from '../i18n/useI18n';
import { useConfirm } from '../hooks/useConfirm';
import { useDateTime } from '../hooks/useDateTime';
import type { Note, Folder, Tag, KanbanCard } from '../types';
import './NoteList.css';

interface Props {
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  kanbanCards: KanbanCard[];
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => void;
  onMoveMany: (ids: string[], folderId: string | null) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  listTitle: string;
  panelClassName?: string;
  scrollBatchSize?: number;
}

type NoteCardProps = {
  note: Note;
  isSelected: boolean;
  selectMode: boolean;
  isChecked: boolean;
  folderPath: string;
  preview: string;
  todoCount: number;
  tags: Tag[];
  onSelect: (id: string) => void;
  onToggleCheck: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin: (id: string) => void;
  onContextMenu: (e: MouseEvent, noteId: string, favorite: boolean, pinned: boolean) => void;
};

const NoteCard = memo(function NoteCard({
  note,
  isSelected,
  selectMode,
  isChecked,
  folderPath,
  preview,
  todoCount,
  tags,
  onSelect,
  onToggleCheck,
  onDelete,
  onToggleFavorite,
  onTogglePin,
  onContextMenu,
}: NoteCardProps) {
  const { t } = useI18n();
  const dt = useDateTime();
  const hasLabels = note.tagIds.length > 0 || !!note.scheduledAt || todoCount > 0;

  const handleClick = () => {
    if (selectMode) onToggleCheck(note.id);
    else onSelect(note.id);
  };

  return (
    <div
      className={`note-card ${isSelected && !selectMode ? 'selected' : ''} ${note.favorite ? 'is-favorite' : ''} ${note.pinned ? 'is-pinned' : ''} ${selectMode && isChecked ? 'is-checked' : ''}`}
      onClick={handleClick}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      onContextMenu={(e) => {
        if (selectMode) return;
        onContextMenu(e, note.id, note.favorite, note.pinned);
      }}
      role="button"
      tabIndex={0}
    >
      <div className="note-card-top">
        {selectMode && (
          <span className="note-card-check" aria-hidden>
            {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
          </span>
        )}
        <h3>{note.title || t('noteList.untitled')}</h3>
        {!selectMode && (
          <div className="note-card-actions">
            <button
              type="button"
              className={note.pinned ? 'pin-btn active' : 'pin-btn'}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin(note.id);
              }}
              title={note.pinned ? t('noteList.unpin') : t('noteList.pin')}
            >
              <Pin size={14} fill={note.pinned ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className={note.favorite ? 'fav active' : 'fav'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(note.id);
              }}
              title={t('noteList.favorite')}
            >
              <Star size={14} fill={note.favorite ? 'currentColor' : 'none'} />
            </button>
            <button
              type="button"
              className="note-delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              title={t('noteList.delete')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      {preview && <p className="note-preview">{preview}</p>}
      <div className="note-card-meta">
        <span>{dt.formatNoteListDate(note.updatedAt)}</span>
        {folderPath && <span className="note-folder-path">{folderPath}</span>}
      </div>
      {hasLabels && (
        <div className="note-card-labels">
          <NoteMetaTokens scheduledAt={note.scheduledAt} todoCount={todoCount} />
          <NoteTagChips tags={tags} tagIds={note.tagIds} />
        </div>
      )}
    </div>
  );
});

export function NoteList(props: Props) {
  return <NoteListInner {...props} />;
}

const NoteListInner = memo(function NoteListInner({
  notes,
  folders,
  tags,
  kanbanCards,
  selectedNoteId,
  onSelect,
  onCreate,
  onDelete,
  onDeleteMany,
  onMoveMany,
  onToggleFavorite,
  onTogglePin,
  listTitle,
  panelClassName,
}: Props) {
  const { t } = useI18n();
  const { confirm } = useConfirm();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<NoteContextMenuState | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveNoteIds, setMoveNoteIds] = useState<string[]>([]);

  useListScrollClass(scrollRef, '.app-body', 'is-list-scrolling');

  const sorted = useMemo(() => sortNotesForList(notes), [notes]);
  const sortedIds = useMemo(() => sorted.map((n) => n.id), [sorted]);

  useEffect(() => {
    setCheckedIds((prev) => {
      const valid = new Set(sortedIds);
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [sortedIds]);

  useEffect(() => {
    if (sorted.length === 0) setSelectMode(false);
  }, [sorted.length]);

  useEffect(() => {
    if (!selectMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectMode]);

  const linkedCountByNote = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of kanbanCards) {
      if (!c.linkedNoteId) continue;
      m.set(c.linkedNoteId, (m.get(c.linkedNoteId) ?? 0) + 1);
    }
    return m;
  }, [kanbanCards]);

  const cardMetaById = useMemo(() => {
    const folderCache = new Map<string | null, string>();
    const meta = new Map<string, { preview: string; folderPath: string; todoCount: number }>();
    for (const note of sorted) {
      let folderPath = '';
      if (note.folderId) {
        if (!folderCache.has(note.folderId)) {
          folderCache.set(note.folderId, getFolderPath(folders, note.folderId));
        }
        folderPath = folderCache.get(note.folderId) ?? '';
      }
      const preview = (
        note.contentPreview ?? (note.content ? stripHtml(note.content) : '')
      ).slice(0, 80);
      meta.set(note.id, {
        preview,
        folderPath,
        todoCount: linkedCountByNote.get(note.id) ?? 0,
      });
    }
    return meta;
  }, [sorted, folders, linkedCountByNote]);

  const rowVirtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 104,
    overscan: 3,
  });

  const allChecked = sorted.length > 0 && checkedIds.size === sorted.length;
  const someChecked = checkedIds.size > 0;

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setCheckedIds(new Set());
  }, []);

  const toggleCheck = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setCheckedIds(allChecked ? new Set() : new Set(sortedIds));
  }, [allChecked, sortedIds]);

  const handleBulkDelete = useCallback(async () => {
    const ids = [...checkedIds];
    if (ids.length === 0) return;
    const label =
      ids.length === 1 ? t('common.noteOne') : t('common.notesCount', { count: ids.length });
    const ok = await confirm({
      title: t('noteList.deleteTitle'),
      message: t('noteList.bulkDeleteConfirm', { label }),
      confirmLabel: t('common.delete'),
      variant: 'danger',
    });
    if (!ok) return;
    onDeleteMany(ids);
    exitSelectMode();
  }, [checkedIds, onDeleteMany, exitSelectMode, t, confirm]);

  const openMoveDialog = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setMoveNoteIds(ids);
    setMoveDialogOpen(true);
  }, []);

  const handleMoveConfirm = useCallback(
    (folderId: string | null) => {
      onMoveMany(moveNoteIds, folderId);
      setMoveDialogOpen(false);
      setMoveNoteIds([]);
      exitSelectMode();
    },
    [moveNoteIds, onMoveMany, exitSelectMode]
  );

  const handleContextMenu = useCallback(
    (e: MouseEvent, noteId: string, favorite: boolean, pinned: boolean) => {
      e.preventDefault();
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        noteId,
        favorite,
        pinned,
      });
    },
    []
  );

  return (
    <div
      className={`note-list-panel ${selectMode ? 'is-select-mode' : ''} ${panelClassName ?? ''}`.trim()}
    >
      <div className="note-list-header">
        {selectMode ? (
          <>
            <span className="note-list-select-count">
              {checkedIds.size > 0
                ? t('common.selectedCount', { count: checkedIds.size })
                : t('noteList.selectNotes')}
            </span>
            <div className="note-list-header-actions">
              <button
                type="button"
                className="note-list-text-btn"
                onClick={toggleSelectAll}
                title={allChecked ? t('noteList.deselectAllTitle') : t('noteList.selectAllTitle')}
              >
                {allChecked ? t('noteList.deselectAll') : t('noteList.selectAll')}
              </button>
              <button
                type="button"
                className="note-list-icon-btn"
                disabled={!someChecked}
                onClick={() => openMoveDialog([...checkedIds])}
                title={t('noteList.moveSelected')}
              >
                <FolderInput size={16} />
              </button>
              <button
                type="button"
                className="note-list-delete-btn"
                disabled={!someChecked}
                onClick={handleBulkDelete}
                title={t('noteList.deleteSelected')}
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                className="note-list-icon-btn"
                onClick={exitSelectMode}
                title={t('noteList.cancelSelect')}
              >
                <X size={16} />
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>{listTitle}</h2>
            <div className="note-list-header-actions">
              {sorted.length > 0 && (
                <button
                  type="button"
                  className="note-list-icon-btn"
                  onClick={() => setSelectMode(true)}
                  title={t('noteList.selectMultiple')}
                >
                  <CheckSquare size={16} />
                </button>
              )}
              <button type="button" className="note-create-btn" onClick={onCreate} title={t('noteList.newNote')}>
                <Plus size={18} />
              </button>
            </div>
          </>
        )}
      </div>
      <div className="note-list-scroll" ref={scrollRef}>
        {sorted.length === 0 ? (
          <div className="note-list-empty">
            <p>{t('noteList.empty')}</p>
            <button type="button" onClick={onCreate}>
              {t('noteList.createFirst')}
            </button>
          </div>
        ) : (
          <div
            className="note-list-virtual-inner"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const note = sorted[virtualRow.index];
              const meta = cardMetaById.get(note.id)!;
              return (
                <div
                  key={note.id}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className="note-list-virtual-row"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <NoteCard
                    note={note}
                    isSelected={selectedNoteId === note.id}
                    selectMode={selectMode}
                    isChecked={checkedIds.has(note.id)}
                    folderPath={meta.folderPath}
                    preview={meta.preview}
                    todoCount={meta.todoCount}
                    tags={tags}
                    onSelect={onSelect}
                    onToggleCheck={toggleCheck}
                    onDelete={onDelete}
                    onToggleFavorite={onToggleFavorite}
                    onTogglePin={onTogglePin}
                    onContextMenu={handleContextMenu}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <NoteContextMenu
        menu={contextMenu}
        onClose={() => setContextMenu(null)}
        onToggleFavorite={onToggleFavorite}
        onTogglePin={onTogglePin}
        onDelete={onDelete}
        onMoveToFolder={(noteId) => openMoveDialog([noteId])}
      />
      <MoveToFolderDialog
        open={moveDialogOpen}
        folders={folders}
        noteCount={moveNoteIds.length}
        onConfirm={handleMoveConfirm}
        onClose={() => {
          setMoveDialogOpen(false);
          setMoveNoteIds([]);
        }}
      />
    </div>
  );
});
