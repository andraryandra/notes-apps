import { useState, useCallback, useEffect, memo, useRef } from 'react';
import { Star, FolderOpen, PanelRightOpen, PanelRightClose, ArrowLeft, Pin, Download } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { PreviewProvider } from '../context/PreviewContext';
import { RichEditor } from './RichEditor';
import { NoteAssetsSidebar } from './NoteAssetsSidebar';
import { NoteMetaPanel } from './NoteMetaPanel';
import { getFolderPath } from '../hooks/useNotesStore';
import type { Note, Folder, Tag, KanbanCard, KanbanGroup } from '../types';
import type { SaveStatus } from '../hooks/useNotesStore';
import type { ParsedNoteAsset } from '../utils/parseNoteAssets';
import { scrollToNoteAsset } from '../utils/scrollToNoteAsset';
import { exportNoteFile } from '../utils/exportNote';
import { useToast } from '../hooks/useToast';
import { useI18n } from '../i18n/useI18n';
import type { NoteExportFormat } from '../types';
import './NoteEditor.css';

interface Props {
  note: Note;
  folders: Folder[];
  tags: Tag[];
  saveStatus: SaveStatus;
  onUpdateTitle: (title: string) => void;
  onUpdateContent: (content: string) => void;
  onToggleFavorite: () => void;
  onTogglePin: () => void;
  onToggleTag: (tagId: string) => void;
  onCreateTag: (name: string) => void;
  kanbanGroups: KanbanGroup[];
  linkedKanbanCards: KanbanCard[];
  onScheduledAtChange: (scheduledAt: number | null) => void;
  onCreateLinkedKanbanCard: (title: string, groupId: string) => void;
  onOpenKanbanCard: (cardId: string, groupId: string) => void;
  onOpenTodoView: () => void;
  scrollToAsset?: ParsedNoteAsset | null;
  onAssetScrolled?: () => void;
  onBack?: () => void;
  backLabel?: string;
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

export const NoteEditor = memo(function NoteEditor({
  note,
  folders,
  tags,
  saveStatus,
  onUpdateTitle,
  onUpdateContent,
  onToggleFavorite,
  onTogglePin,
  onToggleTag,
  onCreateTag,
  kanbanGroups,
  linkedKanbanCards,
  onScheduledAtChange,
  onCreateLinkedKanbanCard,
  onOpenKanbanCard,
  onOpenTodoView,
  scrollToAsset,
  onAssetScrolled,
  onBack,
  backLabel,
}: Props) {
  const { t } = useI18n();
  const resolvedBackLabel = backLabel ?? t('noteEditor.back');
  const folderPath = getFolderPath(folders, note.folderId);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const { showSuccess } = useToast();

  const handleEditorReady = useCallback((ed: Editor | null) => {
    setEditor(ed);
  }, []);

  useEffect(() => {
    if (!scrollToAsset) return;
    setAssetsOpen(true);
  }, [scrollToAsset]);

  useEffect(() => {
    if (!scrollToAsset || !editor) return;
    const timer = window.setTimeout(() => {
      scrollToNoteAsset(editor, scrollToAsset);
      onAssetScrolled?.();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [scrollToAsset, editor, onAssetScrolled]);

  useEffect(() => {
    if (!exportOpen) return;
    const close = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [exportOpen]);

  const handleExport = useCallback(
    async (format: NoteExportFormat) => {
      setExportOpen(false);
      const html = editor?.getHTML() ?? note.content;
      const res = await exportNoteFile(note.title, html, format);
      if (res.ok) showSuccess(t('app.toast.exported'));
      else if (res.error !== 'Dibatalkan') showSuccess(t('app.toast.exportFailed', { error: res.error }));
    },
    [editor, note.content, note.title, showSuccess, t]
  );

  return (
    <PreviewProvider>
    <div className="note-editor-wrap">
    <main className="note-editor">
      <header className="note-editor-header">
        {onBack && (
          <button type="button" className="note-editor-back" onClick={onBack} title={resolvedBackLabel}>
            <ArrowLeft size={18} />
            <span>{resolvedBackLabel}</span>
          </button>
        )}
        <input
          type="text"
          className="note-title-input"
          value={note.title}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder={t('noteEditor.titlePlaceholder')}
        />
        <div className="note-editor-actions">
          {saveStatusLabel(saveStatus, t) && (
            <span className={`note-save-status note-save-status--${saveStatus}`}>
              {saveStatusLabel(saveStatus, t)}
            </span>
          )}
          {folderPath && (
            <span className="note-editor-folder">
              <FolderOpen size={14} />
              {folderPath}
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
          <div className="note-export-wrap" ref={exportRef}>
            <button
              type="button"
              className={`note-panel-toggle ${exportOpen ? 'active' : ''}`}
              onClick={() => setExportOpen((o) => !o)}
              title={t('noteEditor.export')}
            >
              <Download size={20} />
            </button>
            {exportOpen && (
              <div className="note-export-menu">
                <button type="button" onClick={() => void handleExport('md')}>
                  {t('noteEditor.exportMd')}
                </button>
                <button type="button" onClick={() => void handleExport('pdf')}>
                  {t('noteEditor.exportPdf')}
                </button>
                <button type="button" onClick={() => void handleExport('html')}>
                  {t('noteEditor.exportHtml')}
                </button>
                <button type="button" onClick={() => void handleExport('txt')}>
                  {t('noteEditor.exportTxt')}
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className={`fav-btn pin-header-btn ${note.pinned ? 'active' : ''}`}
            onClick={onTogglePin}
            title={note.pinned ? t('noteEditor.unpin') : t('noteEditor.pin')}
          >
            <Pin size={20} fill={note.pinned ? 'currentColor' : 'none'} />
          </button>
          <button
            type="button"
            className={`fav-btn ${note.favorite ? 'active' : ''}`}
            onClick={onToggleFavorite}
            title={note.favorite ? t('noteEditor.removeFavorite') : t('noteEditor.addFavorite')}
          >
            <Star size={20} fill={note.favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </header>
      <NoteMetaPanel
        note={note}
        tags={tags}
        kanbanGroups={kanbanGroups}
        linkedKanbanCards={linkedKanbanCards}
        onScheduledAtChange={onScheduledAtChange}
        onToggleTag={onToggleTag}
        onCreateTag={onCreateTag}
        onCreateKanbanCard={onCreateLinkedKanbanCard}
        onOpenKanbanCard={onOpenKanbanCard}
        onOpenTodoView={onOpenTodoView}
      />
        <RichEditor
          key={note.id}
          noteTitle={note.title}
          content={note.content}
          onChange={onUpdateContent}
          tags={tags}
          noteTagIds={note.tagIds}
          onToggleTag={onToggleTag}
          onEditorReady={handleEditorReady}
        />
    </main>
    {assetsOpen && (
      <NoteAssetsSidebar
        content={note.content}
        editor={editor}
        onClose={() => setAssetsOpen(false)}
      />
    )}
    </div>
    </PreviewProvider>
  );
});
