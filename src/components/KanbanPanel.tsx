import { useMemo, useRef, useState } from 'react';
import { Plus, Trash2, LayoutGrid, GripVertical, Pencil, X } from 'lucide-react';
import type { KanbanCard, KanbanColumn, KanbanGroup } from '../types';
import { useDateTime } from '../hooks/useDateTime';
import { getKanbanColumnDisplayName, getKanbanGroupDisplayName } from '../utils/kanbanDisplayNames';
import { useI18n } from '../i18n/useI18n';
import './KanbanPanel.css';

interface Props {
  group: KanbanGroup;
  columns: KanbanColumn[];
  cards: KanbanCard[];
  selectedCardId: string | null;
  onSelectCard: (id: string | null) => void;
  onCreateColumn: (name: string) => void;
  onRenameColumn: (id: string, name: string) => void;
  onDeleteColumn: (id: string) => void;
  onCreateCard: (columnId: string, title: string) => void;
  onMoveCard: (cardId: string, columnId: string) => void;
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
  onDeleteColumn,
  onCreateCard,
  onMoveCard,
  onDeleteCard,
  onRenameGroup,
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();
  const [dragId, setDragId] = useState<string | null>(null);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [colDraft, setColDraft] = useState('');
  const [groupEditing, setGroupEditing] = useState(false);
  const [groupDraft, setGroupDraft] = useState(group.name);
  const [composerCol, setComposerCol] = useState<string | null>(null);
  const [cardDraft, setCardDraft] = useState('');
  const cardInputRef = useRef<HTMLTextAreaElement>(null);

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
        <div className="kanban-board">
          {sortedColumns.map((col) => (
            <div
              key={col.id}
              className="kanban-column"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('kanban-column--drag-over');
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  e.currentTarget.classList.remove('kanban-column--drag-over');
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('kanban-column--drag-over');
                const id = e.dataTransfer.getData('text/plain') || dragId;
                if (id) onMoveCard(id, col.id);
                setDragId(null);
              }}
            >
              <div className="kanban-column-header">
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

              <div className="kanban-column-cards">
                {(byColumn.get(col.id) ?? []).map((card) => (
                  <div
                    key={card.id}
                    className={`kanban-card ${selectedCardId === card.id ? 'selected' : ''}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', card.id);
                      setDragId(card.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                  >
                    <GripVertical size={14} className="kanban-card-grip" />
                    <button type="button" className="kanban-card-body" onClick={() => onSelectCard(card.id)}>
                      <span className="kanban-card-title">{card.title}</span>
                      {card.content && <span className="kanban-card-preview">{t('kanban.hasNotes')}</span>}
                      {card.dueAt && (
                        <span className="kanban-card-date">{dt.formatScheduleDate(card.dueAt)}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="kanban-card-delete"
                      onClick={() => onDeleteCard(card.id)}
                      title={t('kanban.deleteCard')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="kanban-column-footer">
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
