import { useCallback, useMemo } from 'react';
import type { Editor } from '@tiptap/react';
import { Calendar, FileText, Link2 } from 'lucide-react';
import { PreviewProvider } from '../context/PreviewContext';
import { RichEditor } from './RichEditor';
import { SearchableSelect } from './SearchableSelect';
import { DateTimePicker } from './DateTimePicker';
import type { KanbanCard, Note } from '../types';
import type { SaveStatus } from '../hooks/useNotesStore';
import { useI18n } from '../i18n/useI18n';
import { useDateTime } from '../hooks/useDateTime';
import './KanbanCardEditor.css';

interface Props {
  card: KanbanCard;
  groupName: string;
  columnName: string;
  saveStatus: SaveStatus;
  onUpdateTitle: (title: string) => void;
  onUpdateContent: (content: string) => void;
  onDueAtChange: (dueAt: number | null) => void;
  onScheduledAtChange: (scheduledAt: number | null) => void;
  notes: Note[];
  onLinkedNoteChange: (noteId: string | null) => void;
  onOpenLinkedNote: (noteId: string) => void;
}

export function KanbanCardEditor({
  card,
  groupName,
  columnName,
  saveStatus,
  onUpdateTitle,
  onUpdateContent,
  onDueAtChange,
  onScheduledAtChange,
  notes,
  onLinkedNoteChange,
  onOpenLinkedNote,
}: Props) {
  const { t } = useI18n();
  const dt = useDateTime();

  const statusLabel =
    saveStatus === 'saving'
      ? t('noteEditor.saving')
      : saveStatus === 'saved'
        ? t('noteEditor.saved')
        : null;

  const noteOptions = useMemo(
    () =>
      [...notes]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .map((n) => ({
          value: n.id,
          label: n.title.trim() || t('noteList.untitled'),
          description: dt.formatDate(n.updatedAt, { day: 'numeric', month: 'short' }),
        })),
    [notes, t, dt]
  );

  const linkedNote = card.linkedNoteId
    ? notes.find((n) => n.id === card.linkedNoteId)
    : null;

  const handleEditorReady = useCallback((_ed: Editor | null) => {}, []);

  return (
    <div className="kanban-card-editor">
      <header className="kanban-card-editor-header">
        <div className="kanban-card-editor-breadcrumb">
          <span>{t('sidebar.todos')}</span>
          <span className="sep">/</span>
          <span>{groupName}</span>
          <span className="sep">/</span>
          <span>{columnName}</span>
        </div>
        {statusLabel && <span className="kanban-card-editor-status">{statusLabel}</span>}
      </header>

      <input
        type="text"
        className="kanban-card-editor-title"
        value={card.title}
        onChange={(e) => onUpdateTitle(e.target.value)}
        placeholder={t('kanban.cardTitle')}
      />

      <div className="kanban-card-editor-meta">
        <div className="kanban-card-editor-meta-field">
          <span className="kanban-card-editor-meta-label">
            <Calendar size={14} />
            {t('kanban.dueDate')}
          </span>
          <DateTimePicker
            value={card.dueAt}
            onChange={onDueAtChange}
            placeholder={t('kanban.noDue')}
          />
        </div>
        <div className="kanban-card-editor-meta-field">
          <span className="kanban-card-editor-meta-label">
            <Calendar size={14} />
            {t('kanban.schedule')}
          </span>
          <DateTimePicker
            value={card.scheduledAt}
            onChange={onScheduledAtChange}
            placeholder={t('kanban.noSchedule')}
          />
        </div>
      </div>

      <div className="kanban-card-editor-link">
        <label className="kanban-card-editor-link-label">
          <Link2 size={14} />
          {t('kanban.linkNote')}
        </label>
        <div className="kanban-card-editor-link-row">
          <SearchableSelect
            className="kanban-card-editor-link-select"
            value={card.linkedNoteId ?? ''}
            onChange={(id) => onLinkedNoteChange(id || null)}
            options={noteOptions}
            emptyOption={{ value: '', label: t('kanban.notLinked') }}
            placeholder={t('kanban.selectNote')}
            searchPlaceholder={t('kanban.searchNote')}
          />
          {linkedNote && (
            <button
              type="button"
              className="kanban-card-editor-open-note"
              onClick={() => onOpenLinkedNote(linkedNote.id)}
              title={t('kanban.openLinkedNote')}
            >
              <FileText size={16} />
              {t('kanban.openNote')}
            </button>
          )}
        </div>
        <p className="kanban-card-editor-hint">{t('kanban.linkHint')}</p>
      </div>

      <div className="kanban-card-editor-body">
        <p className="kanban-card-editor-hint">{t('kanban.cardBodyHint')}</p>
        <PreviewProvider>
          <RichEditor
            noteTitle={card.title}
            content={card.content}
            onChange={onUpdateContent}
            tags={[]}
            noteTagIds={[]}
            onToggleTag={() => {}}
            onEditorReady={handleEditorReady}
          />
        </PreviewProvider>
      </div>
    </div>
  );
}
