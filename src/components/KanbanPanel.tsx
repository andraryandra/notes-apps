import { useMemo, useRef, useState, useEffect, type CSSProperties } from 'react';
import { Plus, Trash2, LayoutGrid, GripVertical, Pencil, X } from 'lucide-react';
import type { KanbanCard, KanbanColumn, KanbanGroup } from '../types';
import { useDateTime } from '../hooks/useDateTime';
import { getKanbanColumnDisplayName, getKanbanGroupDisplayName } from '../utils/kanbanDisplayNames';
import { useI18n } from '../i18n/useI18n';
import { KanbanColumnColorPicker } from './KanbanColumnColorPicker';
import { motionEnter } from '../utils/motion';
import { KANBAN_COLUMN_DRAG_MIME } from '../hooks/useNotesStore';
import './KanbanPanel.css';

interface Props {
  group: KanbanGroup;
  columns: KanbanColumn[];
  cards: KanbanCard[];
  selectedCardId: string | null;
  onSelectCard: (id: string | null) => void;
  onCreateColumn: (name: string) => void;
  onRenameColumn: (id: string, name: string) => void;
  onUpdateColumnColor: (id: string, color: string) => void;
  onDeleteColumn: (id: string) => void;
  onCreateCard: (columnId: string, title: string) => void;
  onMoveCard: (cardId: string, columnId: string) => void;
  onMoveColumn: (columnId: string, targetColumnId: string) => void;
  onDeleteCard: (id: string) => void;
  onRenameGroup: (name: string) => void;
}

export function KanbanPanel({
  group,
  columns,
  cards,
  selectedCardId,
  onSelectCard,
  onCreateColumn,
  onRenameColumn,
  onUpdateColumnColor,
  onDeleteColumn,
  onCreateCard,
  onMoveCard,
  onMoveColumn,
  onDeleteCard,
  onRenameGroup,
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [dragColId, setDragColId] = useState<string | null>(null);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [colDraft, setColDraft] = useState('');
  const [groupEditing, setGroupEditing] = useState(false);
  const [groupDraft, setGroupDraft] = useState(group.name);
  const [composerCol, setComposerCol] = useState<string | null>(null);
  const [cardDraft, setCardDraft] = useState('');
  const cardInputRef = useRef<HTMLTextAreaElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (boardRef.current) {
      const cols = boardRef.current.querySelectorAll<HTMLElement>('.kanban-column');
      cols.forEach((col, i) => {
        window.setTimeout(() => motionEnter('viewPanel', col), i * 50);
      });
    }
  }, [group.id]);

  const prevCardCount = useRef(cards.length);
  useEffect(() => {
    if (cards.length > prevCardCount.current && boardRef.current) {
      const allCards = boardRef.current.querySelectorAll<HTMLElement>('.kanban-card');
      const last = allCards[allCards.length - 1];
      if (last) motionEnter('card', last);
    }
    prevCardCount.current = cards.length;
  }, [cards.length]);

  const sortedColumns = useMemo(
    () => [...columns].sort((a, b) => a.order - b.order),
    [columns]
  );

  const byColumn = useMemo(() => {
    const map = new Map<string, KanbanCard[]>();
    for (const col of sortedColumns) map.set(col.id, []);
    for (const c of cards) {
      if (!map.has(c.columnId)) map.set(c.columnId, []);
      map.get(c.columnId)!.push(c);
    }
    for (const [, list] of map) list.sort((a, b) => a.order - b.order);
    return map;
  }, [cards, sortedColumns]);

  const openComposer = (columnId: string) => {
    setComposerCol(columnId);
    setCardDraft('');
    requestAnimationFrame(() => cardInputRef.current?.focus());
  };

  const submitCard = () => {
    if (!composerCol || !cardDraft.trim()) return;
    onCreateCard(composerCol, cardDraft.trim());
    setCardDraft('');
    setComposerCol(null);
  };

  const startEditColumn = (col: KanbanColumn) => {
    setEditingColId(col.id);
    setColDraft(col.name);
  };

  const saveColumnName = () => {
    if (editingColId && colDraft.trim()) onRenameColumn(editingColId, colDraft.trim());
    setEditingColId(null);
  };

  const isColumnDrag = (e: React.DragEvent) =>
    dragColId != null || e.dataTransfer.types.includes(KANBAN_COLUMN_DRAG_MIME);

  const clearColumnHighlight = (columnEl: HTMLElement) => {
    columnEl.classList.remove('kanban-column--drag-over', 'kanban-column--reorder-over');
  };

  const handleColumnDragOver = (e: React.DragEvent, columnEl: HTMLElement) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (isColumnDrag(e)) {
      columnEl.classList.add('kanban-column--reorder-over');
      columnEl.classList.remove('kanban-column--drag-over');
      return;
    }
    columnEl.classList.add('kanban-column--drag-over');
    columnEl.classList.remove('kanban-column--reorder-over');
  };

  const handleColumnDragLeave = (e: React.DragEvent, columnEl: HTMLElement) => {
    if (!columnEl.contains(e.relatedTarget as Node)) {
      clearColumnHighlight(columnEl);
    }
  };

  const handleColumnDrop = (e: React.DragEvent, columnId: string, columnEl: HTMLElement) => {
    e.preventDefault();
    e.stopPropagation();
    clearColumnHighlight(columnEl);

    const draggedColId = e.dataTransfer.getData(KANBAN_COLUMN_DRAG_MIME) || dragColId;
    if (draggedColId) {
      onMoveColumn(draggedColId, columnId);
      setDragColId(null);
      return;
    }

    const cardId = e.dataTransfer.getData('text/plain') || dragCardId;
    if (cardId) onMoveCard(cardId, columnId);
    setDragCardId(null);
  };

  const handleCardDragStart = (e: React.DragEvent, cardId: string) => {
    if ((e.target as HTMLElement).closest('.kanban-card-delete')) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
    setDragCardId(cardId);
    e.currentTarget.classList.add('kanban-card--dragging');
  };

  const handleCardDragEnd = (e: React.DragEvent) => {
    setDragCardId(null);
    e.currentTarget.classList.remove('kanban-card--dragging');
  };

  const handleColDragStart = (e: React.DragEvent, colId: string) => {
    e.dataTransfer.setData(KANBAN_COLUMN_DRAG_MIME, colId);
    e.dataTransfer.effectAllowed = 'move';
    setDragColId(colId);
    (e.currentTarget as HTMLElement).closest('.kanban-column')?.classList.add('kanban-column--dragging');
  };

  const handleColDragEnd = (e: React.DragEvent) => {
    setDragColId(null);
    (e.currentTarget as HTMLElement).closest('.kanban-column')?.classList.remove('kanban-column--dragging');
  };

  return (
    <div className="kanban-panel">
      <header className="kanban-panel-header">
        {groupEditing ? (
          <div className="kanban-group-rename">
            <input
              className="kanban-group-rename-input"
              value={groupDraft}
              onChange={(e) => setGroupDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onRenameGroup(groupDraft);
                  setGroupEditing(false);
                }
                if (e.key === 'Escape') setGroupEditing(false);
              }}
              autoFocus
            />
            <button
              type="button"
              className="kanban-icon-btn"
              onClick={() => {
                onRenameGroup(groupDraft);
                setGroupEditing(false);
              }}
            >
              {t('kanban.save')}
            </button>
          </div>
        ) : (
          <button type="button" className="kanban-panel-title" onClick={() => setGroupEditing(true)}>
            <LayoutGrid size={18} />
            <h2>{getKanbanGroupDisplayName(group.name, t)}</h2>
            <Pencil size={14} className="kanban-panel-edit-hint" />
          </button>
        )}
        <button
          type="button"
          className="kanban-add-column-btn"
          onClick={() => {
            onCreateColumn(t('kanban.columnDefault', { n: sortedColumns.length + 1 }));
          }}
        >
          <Plus size={16} />
          {t('kanban.newColumn')}
        </button>
      </header>

      {sortedColumns.length === 0 ? (
        <div className="kanban-panel-empty">
          <p>{t('kanban.noColumns')}</p>
          <button type="button" onClick={() => onCreateColumn(t('kanban.columnDefault', { n: 1 }))}>
            <Plus size={16} /> {t('kanban.createFirstColumn')}
          </button>
        </div>
      ) : (
        <div className="kanban-board" ref={boardRef}>
          {sortedColumns.map((col) => (
            <div
              key={col.id}
              className={`kanban-column ${dragColId === col.id ? 'kanban-column--dragging' : ''}`}
              style={{ '--col-color': col.color } as CSSProperties}
              onDragOver={(e) => handleColumnDragOver(e, e.currentTarget)}
              onDragLeave={(e) => handleColumnDragLeave(e, e.currentTarget)}
              onDrop={(e) => handleColumnDrop(e, col.id, e.currentTarget)}
            >
              <div className="kanban-column-header">
                {sortedColumns.length > 1 && (
                  <span
                    className="kanban-column-grip"
                    draggable
                    onDragStart={(e) => handleColDragStart(e, col.id)}
                    onDragEnd={handleColDragEnd}
                    title={t('kanban.dragColumn')}
                  >
                    <GripVertical size={14} />
                  </span>
                )}
                <KanbanColumnColorPicker
                  value={col.color}
                  onChange={(color) => onUpdateColumnColor(col.id, color)}
                />
                {editingColId === col.id ? (
                  <input
                    className="kanban-column-name-input"
                    value={colDraft}
                    onChange={(e) => setColDraft(e.target.value)}
                    onBlur={saveColumnName}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveColumnName();
                      if (e.key === 'Escape') setEditingColId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <button type="button" className="kanban-column-name" onClick={() => startEditColumn(col)}>
                    {getKanbanColumnDisplayName(col.name, t)}
                  </button>
                )}
                <span className="kanban-column-count">{(byColumn.get(col.id) ?? []).length}</span>
                {sortedColumns.length > 1 && (
                  <button
                    type="button"
                    className="kanban-column-delete"
                    onClick={() => onDeleteColumn(col.id)}
                    title={t('kanban.deleteColumn')}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div
                className="kanban-column-cards"
                onDragOver={(e) => handleColumnDragOver(e, e.currentTarget.closest('.kanban-column')!)}
                onDrop={(e) =>
                  handleColumnDrop(e, col.id, e.currentTarget.closest('.kanban-column')!)
                }
              >
                {(byColumn.get(col.id) ?? []).map((card) => (
                  <div
                    key={card.id}
                    draggable
                    title={t('kanban.dragCard')}
                    className={`kanban-card ${selectedCardId === card.id ? 'selected' : ''} ${dragCardId === card.id ? 'kanban-card--dragging' : ''}`}
                    onDragStart={(e) => handleCardDragStart(e, card.id)}
                    onDragEnd={handleCardDragEnd}
                    onDragOver={(e) => {
                      if (isColumnDrag(e)) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={(e) =>
                      handleColumnDrop(e, col.id, e.currentTarget.closest('.kanban-column')!)
                    }
                  >
                    <span className="kanban-card-grip" aria-hidden="true">
                      <GripVertical size={14} />
                    </span>
                    <div
                      role="button"
                      tabIndex={0}
                      className="kanban-card-body"
                      onClick={() => onSelectCard(card.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectCard(card.id);
                        }
                      }}
                    >
                      <span className="kanban-card-title">{card.title}</span>
                      {card.content && <span className="kanban-card-preview">{t('kanban.hasNotes')}</span>}
                      {card.scheduledAt && (
                        <span className="kanban-card-date">{dt.formatScheduleDate(card.scheduledAt)}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="kanban-card-delete"
                      draggable={false}
                      onClick={() => onDeleteCard(card.id)}
                      title={t('kanban.deleteCard')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div
                className="kanban-column-footer"
                onDragOver={(e) => handleColumnDragOver(e, e.currentTarget.closest('.kanban-column')!)}
                onDrop={(e) =>
                  handleColumnDrop(e, col.id, e.currentTarget.closest('.kanban-column')!)
                }
              >
                {composerCol === col.id ? (
                  <div className="kanban-composer">
                    <textarea
                      ref={cardInputRef}
                      rows={2}
                      placeholder={t('kanban.cardTitlePlaceholder')}
                      value={cardDraft}
                      onChange={(e) => setCardDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          submitCard();
                        }
                        if (e.key === 'Escape') setComposerCol(null);
                      }}
                    />
                    <div className="kanban-composer-actions">
                      <button type="button" onClick={submitCard} disabled={!cardDraft.trim()}>
                        {t('kanban.addCard')}
                      </button>
                      <button type="button" className="muted" onClick={() => setComposerCol(null)}>
                        {t('kanban.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" className="kanban-add-card" onClick={() => openComposer(col.id)}>
                    <Plus size={14} />
                    {t('kanban.addCard')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
