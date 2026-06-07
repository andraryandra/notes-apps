import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, LayoutGrid, FileText, Trash2 } from 'lucide-react';
import type { KanbanCard, KanbanGroup } from '../types';
import { getKanbanGroupDisplayName } from '../utils/kanbanDisplayNames';
import { useI18n } from '../i18n/useI18n';
import './KanbanTree.css';

interface Props {
  groups: KanbanGroup[];
  cards: KanbanCard[];
  selectedGroupId: string | null;
  selectedCardId: string | null;
  onSelectGroup: (groupId: string) => void;
  onSelectCard: (cardId: string, groupId: string) => void;
  onCreateGroup: () => void;
  onDeleteGroup: (groupId: string) => void;
}

export function KanbanTree({
  groups,
  cards,
  selectedGroupId,
  selectedCardId,
  onSelectGroup,
  onSelectCard,
  onCreateGroup,
  onDeleteGroup,
}: Props) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="kanban-tree">
      <div className="kanban-tree-header">
        <LayoutGrid size={14} />
        <span>{t('kanban.boardTitle')}</span>
        <button type="button" className="kanban-tree-add" onClick={onCreateGroup} title={t('kanban.newGroup')}>
          <Plus size={16} />
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="kanban-tree-empty">{t('kanban.noGroups')}</p>
      ) : (
        <ul className="kanban-tree-list">
          {groups.map((group) => {
            const groupCards = cards
              .filter((c) => c.groupId === group.id)
              .sort((a, b) => b.updatedAt - a.updatedAt);
            const isOpen = expanded[group.id] ?? selectedGroupId === group.id;
            const isGroupActive = selectedGroupId === group.id;

            return (
              <li key={group.id} className="kanban-tree-group">
                <div className={`kanban-tree-group-row ${isGroupActive ? 'active' : ''}`}>
                  <button
                    type="button"
                    className="kanban-tree-expand"
                    onClick={() => toggle(group.id)}
                    aria-expanded={isOpen}
                  >
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <button
                    type="button"
                    className="kanban-tree-group-btn"
                    onClick={() => {
                      onSelectGroup(group.id);
                      setExpanded((prev) => ({ ...prev, [group.id]: true }));
                    }}
                  >
                    <span className="kanban-tree-group-name">
                      {getKanbanGroupDisplayName(group.name, t)}
                    </span>
                    <span className="kanban-tree-badge">{groupCards.length}</span>
                  </button>
                  <button
                    type="button"
                    className="kanban-tree-delete"
                    onClick={() => onDeleteGroup(group.id)}
                    title={t('kanban.deleteGroup')}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                {isOpen && (
                  <ul className="kanban-tree-cards">
                    {groupCards.length === 0 ? (
                      <li className="kanban-tree-card-empty">{t('kanban.noCards')}</li>
                    ) : (
                      groupCards.map((card) => (
                        <li key={card.id}>
                          <button
                            type="button"
                            className={`kanban-tree-card-btn ${selectedCardId === card.id ? 'active' : ''}`}
                            onClick={() => onSelectCard(card.id, group.id)}
                          >
                            <FileText size={13} />
                            <span>{card.title.trim() || t('noteList.untitled')}</span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
