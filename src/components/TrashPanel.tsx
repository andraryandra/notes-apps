import { useMemo } from 'react';
import { Trash2, RotateCcw, FileText, CheckSquare } from 'lucide-react';
import type { KanbanCard, KanbanGroup, Note } from '../types';
import { filterDeletedKanbanCards, filterDeletedNotes } from '../utils/trashFilter';
import { getKanbanGroupDisplayName } from '../utils/kanbanDisplayNames';
import { useI18n } from '../i18n/useI18n';
import { useDateTime } from '../hooks/useDateTime';
import './TrashPanel.css';

interface Props {
  notes: Note[];
  kanbanCards: KanbanCard[];
  kanbanGroups: KanbanGroup[];
  onRestoreNote: (id: string) => void;
  onPurgeNote: (id: string) => void;
  onRestoreKanbanCard: (id: string) => void;
  onPurgeKanbanCard: (id: string) => void;
  onEmptyTrash: () => void;
  onOpenNote: (id: string) => void;
  onOpenKanbanCard: (cardId: string, groupId: string) => void;
}

export function TrashPanel({
  notes,
  kanbanCards,
  kanbanGroups,
  onRestoreNote,
  onPurgeNote,
  onRestoreKanbanCard,
  onPurgeKanbanCard,
  onEmptyTrash,
  onOpenNote,
  onOpenKanbanCard,
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();

  const deletedNotes = useMemo(() => filterDeletedNotes(notes), [notes]);
  const deletedCards = useMemo(() => filterDeletedKanbanCards(kanbanCards), [kanbanCards]);
  const groupNameById = useMemo(
    () => new Map(kanbanGroups.map((g) => [g.id, getKanbanGroupDisplayName(g.name, t)])),
    [kanbanGroups, t]
  );

  const total = deletedNotes.length + deletedCards.length;

  if (total === 0) {
    return (
      <div className="trash-panel">
        <header className="trash-panel-header">
          <h2>
            <Trash2 size={20} />
            {t('trash.title')}
          </h2>
        </header>
        <div className="trash-panel-empty">
          <Trash2 size={40} strokeWidth={1.25} />
          <p>{t('trash.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trash-panel">
      <header className="trash-panel-header">
        <div>
          <h2>
            <Trash2 size={20} />
            {t('trash.title')}
          </h2>
          <p>{t('trash.summary', { count: total })}</p>
        </div>
        <button type="button" className="trash-empty-btn" onClick={onEmptyTrash}>
          {t('trash.emptyAll')}
        </button>
      </header>

      <div className="trash-panel-body">
        {deletedNotes.length > 0 && (
          <section className="trash-section">
            <h3>{t('trash.notesSection')}</h3>
            <ul className="trash-list">
              {deletedNotes.map((note) => (
                <li key={note.id} className="trash-item">
                  <button type="button" className="trash-item-main" onClick={() => onOpenNote(note.id)}>
                    <FileText size={16} />
                    <span className="trash-item-title">{note.title.trim() || t('noteList.untitled')}</span>
                    <span className="trash-item-meta">
                      {note.deletedAt ? dt.formatDateTime(note.deletedAt) : ''}
                    </span>
                  </button>
                  <div className="trash-item-actions">
                    <button
                      type="button"
                      title={t('trash.restore')}
                      onClick={() => onRestoreNote(note.id)}
                    >
                      <RotateCcw size={15} />
                    </button>
                    <button
                      type="button"
                      title={t('trash.purge')}
                      onClick={() => onPurgeNote(note.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {deletedCards.length > 0 && (
          <section className="trash-section">
            <h3>{t('trash.kanbanSection')}</h3>
            <ul className="trash-list">
              {deletedCards.map((card) => (
                <li key={card.id} className="trash-item">
                  <button
                    type="button"
                    className="trash-item-main"
                    onClick={() => onOpenKanbanCard(card.id, card.groupId)}
                  >
                    <CheckSquare size={16} />
                    <span className="trash-item-title">{card.title.trim() || t('noteList.untitled')}</span>
                    <span className="trash-item-meta">
                      {groupNameById.get(card.groupId) ?? ''}
                      {card.deletedAt ? ` · ${dt.formatDateTime(card.deletedAt)}` : ''}
                    </span>
                  </button>
                  <div className="trash-item-actions">
                    <button
                      type="button"
                      title={t('trash.restore')}
                      onClick={() => onRestoreKanbanCard(card.id)}
                    >
                      <RotateCcw size={15} />
                    </button>
                    <button
                      type="button"
                      title={t('trash.purge')}
                      onClick={() => onPurgeKanbanCard(card.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
