import { useCallback, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { X, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { PreviewProvider } from '../context/PreviewContext';
import { RichEditor } from './RichEditor';
import { NoteAssetsSidebar } from './NoteAssetsSidebar';
import { KanbanCardMetaPanel } from './KanbanCardMetaPanel';
import type { KanbanCard, Note, Tag } from '../types';
import type { SaveStatus } from '../hooks/useNotesStore';
import { useI18n } from '../i18n/useI18n';
import './NoteEditor.css';
import './KanbanCardEditor.css';

interface Props {
  card: KanbanCard;
  groupName: string;
  columnName: string;
  tags: Tag[];
  saveStatus: SaveStatus;
  onUpdateTitle: (title: string) => void;
  onUpdateContent: (content: string) => void;
  onScheduledAtChange: (scheduledAt: number | null) => void;
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string) => void;
  notes: Note[];
  onLinkedNoteChange: (noteId: string | null) => void;
  onOpenLinkedNote: (noteId: string) => void;
  onClose: () => void;
}

function saveStatusLabel(status: SaveStatus, t: (key: string) => string): string | null {
  switch (status) {
    case 'saving':
      return t('noteEditor.saving');
    case 'saved':
      return t('noteEditor.saved');
    default:
      return null;
  }
}

export function KanbanCardEditor({
  card,
  groupName,
  columnName,
  tags,
  saveStatus,
  onUpdateTitle,
  onUpdateContent,
  onScheduledAtChange,
  onToggleTag,
  onCreateTag,
  notes,
  onLinkedNoteChange,
  onOpenLinkedNote,
  onClose,
}: Props) {
  const { t } = useI18n();
  const statusLabel = saveStatusLabel(saveStatus, t);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);

  const handleEditorReady = useCallback((ed: Editor | null) => {
    setEditor(ed);
  }, []);

  return (
    <PreviewProvider>
      <div className="note-editor-wrap">
        <main className="note-editor kanban-card-editor">
          <header className="note-editor-header kanban-card-editor-header">
            <div className="kanban-card-editor-header-top">
              <div className="kanban-card-editor-breadcrumb">
                <span>{t('sidebar.todos')}</span>
                <span className="sep">/</span>
                <span>{groupName}</span>
                <span className="sep">/</span>
                <span>{columnName}</span>
              </div>
              <div className="kanban-card-editor-header-actions">
                {statusLabel && (
                  <span className={`note-save-status note-save-status--${saveStatus}`}>
                    {statusLabel}
                  </span>
                )}
                <button
                  type="button"
                  className={`note-panel-toggle ${assetsOpen ? 'active' : ''}`}
                  onClick={() => setAssetsOpen((o) => !o)}
                  title={assetsOpen ? t('noteEditor.assetsOpen') : t('noteEditor.assetsClosed')}
                >
                  {assetsOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                </button>
                <button
                  type="button"
                  className="kanban-card-editor-close"
                  onClick={onClose}
                  title={t('kanban.closeDetail')}
                  aria-label={t('kanban.closeDetail')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <input
              type="text"
              className="note-title-input kanban-card-editor-title"
              value={card.title}
              onChange={(e) => onUpdateTitle(e.target.value)}
              placeholder={t('kanban.cardTitle')}
            />
          </header>

          <KanbanCardMetaPanel
            card={card}
            tags={tags}
            notes={notes}
            onScheduledAtChange={onScheduledAtChange}
            onToggleTag={onToggleTag}
            onCreateTag={onCreateTag}
            onLinkedNoteChange={onLinkedNoteChange}
            onOpenLinkedNote={onOpenLinkedNote}
          />

          <RichEditor
            key={card.id}
            noteTitle={card.title}
            content={card.content}
            onChange={onUpdateContent}
            tags={tags}
            noteTagIds={card.tagIds}
            onToggleTag={onToggleTag}
            onEditorReady={handleEditorReady}
          />
        </main>
        {assetsOpen && (
          <NoteAssetsSidebar
            content={card.content}
            editor={editor}
            onClose={() => setAssetsOpen(false)}
          />
        )}
      </div>
    </PreviewProvider>
  );
}
