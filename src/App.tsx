import { useState, useMemo, useCallback, useEffect } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar } from './components/Sidebar';
import { NoteList } from './components/NoteList';
import { NoteEditor } from './components/NoteEditor';
import { EmptyState } from './components/EmptyState';
import { KanbanPanel } from './components/KanbanPanel';
import { KanbanCardEditor } from './components/KanbanCardEditor';
import { SchedulePanel } from './components/SchedulePanel';
import { ScheduleListPanel } from './components/ScheduleListPanel';
import { DashboardPanel } from './components/DashboardPanel';
import { CheckSquare } from 'lucide-react';
import { useNotesStore, stripHtml } from './hooks/useNotesStore';
import { collectFolderDescendantIds, countNotesInFolderSet } from './utils/folderOptions';
import { noteMatchesQuery } from './utils/noteSearch';
import { useAppearance } from './hooks/useAppearance';
import { I18nProvider } from './i18n/I18nProvider';
import { ConfirmProvider } from './context/ConfirmContext';
import { useI18n } from './i18n/useI18n';
import { SettingsModal } from './components/SettingsModal';
import { GlobalAssetsPanel } from './components/GlobalAssetsPanel';
import { parseGlobalNoteAssets } from './utils/parseGlobalNoteAssets';
import type { ParsedNoteAsset } from './utils/parseNoteAssets';
import type { SidebarView } from './types';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { useAppUpdater } from './hooks/useAppUpdater';
import { exportNoteFile } from './utils/exportNote';
import { createTranslator } from './i18n/translator';
import type { AppLocale } from './config/appearance';
import { useToast } from './hooks/useToast';
import { useConfirm } from './hooks/useConfirm';
import { useDateTime } from './hooks/useDateTime';
import {
  getKanbanColumnDisplayName,
  getKanbanGroupDisplayName,
} from './utils/kanbanDisplayNames';
import './styles/App.css';

function PromptModal({
  title,
  placeholder,
  onConfirm,
  onCancel,
}: {
  title: string;
  placeholder: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState('');
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{title}</h3>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) onConfirm(value.trim());
            if (e.key === 'Escape') onCancel();
          }}
        />
        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="modal-confirm"
            disabled={!value.trim()}
            onClick={() => value.trim() && onConfirm(value.trim())}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const appearance = useAppearance();
  return (
    <I18nProvider locale={appearance.locale} timeZone={appearance.timeZone}>
      <ConfirmProvider>
        <AppContent appearance={appearance} />
      </ConfirmProvider>
    </I18nProvider>
  );
}

function AppContent({
  appearance,
}: {
  appearance: ReturnType<typeof useAppearance>;
}) {
  const { t } = useI18n();
  const dt = useDateTime();
  const store = useNotesStore();
  const { showSuccess } = useToast();
  const { confirm } = useConfirm();
  const { checkForUpdates } = useAppUpdater({ confirm, showSuccess, t });
  const {
    theme,
    layout,
    scrollBatchSize,
    locale,
    timeZone,
    setTheme,
    setLayout,
    setScrollBatchSize,
    setLocale,
    setTimeZone,
    uiZoomLevel,
    setUiZoomLevel,
    adjustUiZoomLevel,
    ready,
  } = appearance;
  const [noteListDrawerOpen, setNoteListDrawerOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarView, setSidebarView] = useState<SidebarView>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedKanbanGroupId, setSelectedKanbanGroupId] = useState<string | null>(null);
  const [selectedKanbanCardId, setSelectedKanbanCardId] = useState<string | null>(null);
  const [scheduleDayFilter, setScheduleDayFilter] = useState<number | null>(null);
  const [scheduleSelectedDay, setScheduleSelectedDay] = useState(() => dt.startOfDay(Date.now()));
  const [pendingAsset, setPendingAsset] = useState<{
    noteId: string;
    asset: ParsedNoteAsset;
  } | null>(null);
  const [modal, setModal] = useState<
    | null
    | { type: 'folder'; parentId: string | null }
    | { type: 'tag' }
    | { type: 'kanbanGroup' }
  >(null);
  const [globalAssetsOpen, setGlobalAssetsOpen] = useState(false);

  const { data, loaded } = store;

  useEffect(() => {
    if (globalAssetsOpen) void store.hydrateAllNoteContents();
  }, [globalAssetsOpen, store.hydrateAllNoteContents]);

  const handleViewChange = useCallback(
    (view: SidebarView, folderId?: string | null, tagId?: string | null) => {
      setSidebarView(view);
      setGlobalAssetsOpen(false);
      if (view === 'folder') setSelectedFolderId(folderId ?? null);
      if (view === 'tag') setSelectedTagId(tagId ?? null);
      if (view === 'todos' || view === 'schedule') {
        setSelectedKanbanCardId(null);
      }
      if (view === 'dashboard') {
        setSelectedNoteId(null);
        setSelectedKanbanGroupId(null);
        setSelectedKanbanCardId(null);
      }
      if (view !== 'todos') {
        setSelectedKanbanGroupId(null);
      }
    },
    []
  );

  const filteredNotes = useMemo(() => {
    let notes = data.notes;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      notes = notes.filter((n) => noteMatchesQuery(n, q, stripHtml));
    } else {
      switch (sidebarView) {
        case 'favorites':
          notes = notes.filter((n) => n.favorite);
          break;
        case 'folder':
          if (selectedFolderId) {
            const collectFolderIds = (id: string): string[] => {
              const children = data.folders
                .filter((f) => f.parentId === id)
                .flatMap((f) => collectFolderIds(f.id));
              return [id, ...children];
            };
            const folderIds = new Set(collectFolderIds(selectedFolderId));
            notes = notes.filter((n) => n.folderId && folderIds.has(n.folderId));
          }
          break;
        case 'tag':
          if (selectedTagId) {
            notes = notes.filter((n) => n.tagIds.includes(selectedTagId));
          }
          break;
      }
    }

    return notes;
  }, [data.notes, data.folders, searchQuery, sidebarView, selectedFolderId, selectedTagId]);

  const listTitle = useMemo(() => {
    if (searchQuery.trim()) return t('app.listTitle.search', { query: searchQuery });
    switch (sidebarView) {
      case 'favorites':
        return t('app.listTitle.favorites');
      case 'folder': {
        const f = data.folders.find((x) => x.id === selectedFolderId);
        return f ? f.name : t('app.listTitle.folder');
      }
      case 'tag': {
        const tag = data.tags.find((x) => x.id === selectedTagId);
        return tag ? `#${tag.name}` : t('app.listTitle.tag');
      }
      default:
        return t('app.listTitle.all');
    }
  }, [searchQuery, sidebarView, selectedFolderId, selectedTagId, data.folders, data.tags, t]);

  const selectedNote = data.notes.find((n) => n.id === selectedNoteId) ?? null;

  const selectedKanbanGroup =
    data.kanbanGroups.find((g) => g.id === selectedKanbanGroupId) ?? null;

  const groupColumns = useMemo(
    () =>
      selectedKanbanGroupId
        ? data.kanbanColumns.filter((c) => c.groupId === selectedKanbanGroupId)
        : [],
    [data.kanbanColumns, selectedKanbanGroupId]
  );

  const groupCards = useMemo(
    () =>
      selectedKanbanGroupId
        ? data.kanbanCards.filter((c) => c.groupId === selectedKanbanGroupId)
        : [],
    [data.kanbanCards, selectedKanbanGroupId]
  );

  const selectedKanbanCard =
    data.kanbanCards.find((c) => c.id === selectedKanbanCardId) ?? null;

  const selectedCardColumn = selectedKanbanCard
    ? data.kanbanColumns.find((c) => c.id === selectedKanbanCard.columnId)
    : null;

  const linkedKanbanForNote = useMemo(
    () =>
      selectedNote
        ? data.kanbanCards.filter((c) => c.linkedNoteId === selectedNote.id)
        : [],
    [data.kanbanCards, selectedNote?.id]
  );

  const globalAssetCount = useMemo(
    () => parseGlobalNoteAssets(data.notes).counts.all,
    [data.notes]
  );

  const isFocusLayout = layout === 'focus';
  const isToolsView =
    sidebarView === 'dashboard' || sidebarView === 'todos' || sidebarView === 'schedule';
  const hideNoteList = !isToolsView && isFocusLayout && !!selectedNote && !noteListDrawerOpen;
  const showNoteList = !isToolsView && !hideNoteList;

  const todosActiveCount = data.kanbanCards.length;
  const scheduleCount =
    data.notes.filter((n) => n.scheduledAt).length +
    data.kanbanCards.filter((c) => c.dueAt || c.scheduledAt).length;

  useEffect(() => {
    if (!isFocusLayout || !selectedNote) setNoteListDrawerOpen(false);
  }, [isFocusLayout, selectedNote?.id]);

  const handleExportActiveNote = useCallback(async () => {
    if (!selectedNote) return;
    const res = await exportNoteFile(selectedNote.title, selectedNote.content, 'md');
    if (res.ok) showSuccess(t('app.toast.exported'));
    else if (res.error !== 'Dibatalkan') showSuccess(t('app.toast.exportFailed', { error: res.error }));
  }, [selectedNote, showSuccess, t]);

  useEffect(() => {
    if (sidebarView !== 'todos') return;
    if (selectedKanbanGroupId && data.kanbanGroups.some((g) => g.id === selectedKanbanGroupId)) {
      return;
    }
    if (data.kanbanGroups.length > 0) {
      setSelectedKanbanGroupId(data.kanbanGroups[0].id);
    }
  }, [sidebarView, selectedKanbanGroupId, data.kanbanGroups]);

  const openNote = useCallback(
    (noteId: string) => {
      if (selectedNoteId && selectedNoteId !== noteId) {
        store.flushBeforeNoteSwitch();
      }
      void store.ensureNoteContent(noteId);
      setSelectedNoteId(noteId);
      setSidebarView('all');
      if (isFocusLayout) setNoteListDrawerOpen(false);
    },
    [isFocusLayout, store, selectedNoteId]
  );

  const openNoteInSchedule = useCallback(
    (noteId: string) => {
      if (selectedNoteId && selectedNoteId !== noteId) {
        store.flushBeforeNoteSwitch();
      }
      void store.ensureNoteContent(noteId);
      setSelectedNoteId(noteId);
      if (isFocusLayout) setNoteListDrawerOpen(false);
    },
    [isFocusLayout, store, selectedNoteId]
  );

  const openKanbanCard = useCallback((cardId: string, groupId: string) => {
    setSidebarView('todos');
    setGlobalAssetsOpen(false);
    setSelectedKanbanGroupId(groupId);
    setSelectedKanbanCardId(cardId);
    setSelectedNoteId(null);
  }, []);

  const handleSelectNote = useCallback(
    (id: string) => {
      openNote(id);
    },
    [openNote]
  );

  const handleCreateNoteForDay = useCallback(
    (dayStart: number) => {
      store.createNote(null, {
        scheduledAt: dt.atDayTime(dayStart, 9, 0),
        title: t('noteEditor.defaultTitle'),
      });
    },
    [store, t, dt]
  );

  const handleAssignNoteToDay = useCallback(
    (noteId: string, dayStart: number) => {
      store.updateNote(noteId, { scheduledAt: dt.atDayTime(dayStart, 9, 0) });
    },
    [store, dt]
  );

  const closeScheduleNote = useCallback(() => {
    setSelectedNoteId(null);
  }, []);

  const handleGoToAsset = useCallback(
    (noteId: string, asset: ParsedNoteAsset) => {
      setSidebarView('all');
      openNote(noteId);
      setPendingAsset({ noteId, asset });
      setGlobalAssetsOpen(false);
    },
    [openNote]
  );

  const handleCreateNote = useCallback(() => {
    const folderId = sidebarView === 'folder' ? selectedFolderId : null;
    const note = store.createNote(folderId, { title: t('noteEditor.defaultTitle') });
    setSelectedNoteId(note.id);
    showSuccess(t('app.toast.noteCreated'));
  }, [store, sidebarView, selectedFolderId, showSuccess, t]);

  const handleLocaleChange = useCallback(
    async (next: AppLocale) => {
      if (next === locale) return;
      await setLocale(next);
      showSuccess(createTranslator(next)('app.toast.languageChanged'));
    },
    [locale, setLocale, showSuccess]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      const note = data.notes.find((n) => n.id === id);
      if (!note) return;
      store.toggleFavorite(id);
      showSuccess(note.favorite ? t('app.toast.favoriteRemoved') : t('app.toast.favoriteAdded'));
    },
    [data.notes, store, showSuccess, t]
  );

  const handleTogglePin = useCallback(
    (id: string) => {
      const note = data.notes.find((n) => n.id === id);
      if (!note) return;
      store.togglePin(id);
      showSuccess(note.pinned ? t('app.toast.pinRemoved') : t('app.toast.pinAdded'));
    },
    [data.notes, store, showSuccess, t]
  );

  const handleDeleteNote = useCallback(
    async (id: string) => {
      const note = data.notes.find((n) => n.id === id);
      const title = note?.title?.trim() || t('noteList.untitled');
      const ok = await confirm({
        title: t('noteList.deleteTitle'),
        message: t('noteList.deleteConfirm', { title }),
        confirmLabel: t('common.delete'),
        variant: 'danger',
      });
      if (!ok) return;
      store.deleteNote(id);
      if (selectedNoteId === id) setSelectedNoteId(null);
      showSuccess(t('app.toast.noteDeleted'));
    },
    [data.notes, store, selectedNoteId, showSuccess, t, confirm]
  );

  const handleDeleteNotes = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      store.deleteNotes(ids);
      if (selectedNoteId && ids.includes(selectedNoteId)) setSelectedNoteId(null);
      showSuccess(
        ids.length === 1
          ? t('app.toast.noteDeleted')
          : t('app.toast.notesDeleted', { count: ids.length })
      );
    },
    [store, selectedNoteId, showSuccess, t]
  );

  const handleMoveNotes = useCallback(
    (ids: string[], folderId: string | null) => {
      if (ids.length === 0) return;
      store.moveNotesToFolder(ids, folderId);
      showSuccess(
        ids.length === 1
          ? t('app.toast.noteMoved')
          : t('app.toast.notesMoved', { count: ids.length })
      );
    },
    [store, showSuccess, t]
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      const folderIds = collectFolderDescendantIds(data.folders, folderId);
      const noteCount = countNotesInFolderSet(data.notes, folderIds);
      const folder = data.folders.find((f) => f.id === folderId);
      const folderName = folder?.name ?? t('common.folder');

      const ok = await confirm({
        title: t('folderTree.deleteTitle'),
        message:
          noteCount > 0
            ? t('folderTree.deleteConfirmWithNotes', { name: folderName, count: noteCount })
            : t('folderTree.deleteConfirm', { name: folderName }),
        confirmLabel: t('common.delete'),
        variant: 'danger',
      });
      if (!ok) return;

      const noteIdsToDelete = data.notes
        .filter((n) => n.folderId && folderIds.has(n.folderId))
        .map((n) => n.id);
      store.deleteFolder(folderId);
      if (selectedNoteId && noteIdsToDelete.includes(selectedNoteId)) {
        setSelectedNoteId(null);
      }
      if (selectedFolderId && folderIds.has(selectedFolderId)) {
        setSelectedFolderId(null);
        setSidebarView('all');
      }
      showSuccess(
        noteCount > 0
          ? t('app.toast.folderDeletedWithNotes', { count: noteCount })
          : t('app.toast.folderDeleted')
      );
    },
    [data.folders, data.notes, store, selectedNoteId, selectedFolderId, showSuccess, t, confirm]
  );

  useGlobalShortcuts({
    onNewNote: handleCreateNote,
    onFocusSearch: () => {
      document.getElementById('global-search-input')?.focus();
    },
    onOpenSettings: () => setShowSettings(true),
    onTogglePin: () => {
      if (selectedNoteId) handleTogglePin(selectedNoteId);
    },
    onExportNote: () => void handleExportActiveNote(),
    onEscape: () => {
      if (showSettings) setShowSettings(false);
      else if (noteListDrawerOpen) setNoteListDrawerOpen(false);
    },
    hasActiveNote: !!selectedNoteId,
  });

  const handleDeleteKanbanGroup = useCallback(
    (groupId: string) => {
      store.deleteKanbanGroup(groupId);
      if (selectedKanbanGroupId === groupId) {
        const rest = data.kanbanGroups.filter((g) => g.id !== groupId);
        setSelectedKanbanGroupId(rest[0]?.id ?? null);
        setSelectedKanbanCardId(null);
      }
    },
    [store, selectedKanbanGroupId, data.kanbanGroups]
  );

  if (!ready || !loaded) {
    return (
      <div className="app-loading">
        <div className="loader" />
        <p>{t('app.loading')}</p>
      </div>
    );
  }

  return (
    <div className={`app ${showSettings ? 'is-settings-open' : ''}`}>
      <TitleBar
        onOpenSettings={() => setShowSettings(true)}
        showNoteListToggle={isFocusLayout && !!selectedNote}
        noteListOpen={noteListDrawerOpen}
        onToggleNoteList={() => setNoteListDrawerOpen((o) => !o)}
        locale={locale}
        onLocaleChange={(loc) => void handleLocaleChange(loc)}
      />
      <div className="app-body">
        {isFocusLayout && noteListDrawerOpen && selectedNote && (
          <button
            type="button"
            className="note-list-drawer-backdrop"
            aria-label="Tutup daftar catatan"
            onClick={() => setNoteListDrawerOpen(false)}
          />
        )}
        <Sidebar
          folders={data.folders}
          tags={data.tags}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sidebarView={sidebarView}
          selectedFolderId={selectedFolderId}
          selectedTagId={selectedTagId}
          onViewChange={handleViewChange}
          onCreateFolder={(parentId) => setModal({ type: 'folder', parentId })}
          onRenameFolder={store.renameFolder}
          onDeleteFolder={handleDeleteFolder}
          onCreateTag={() => setModal({ type: 'tag' })}
          onDeleteTag={store.deleteTag}
          noteCounts={{
            all: data.notes.length,
            favorites: data.notes.filter((n) => n.favorite).length,
            todosActive: todosActiveCount,
            schedule: scheduleCount,
          }}
          globalAssetsOpen={globalAssetsOpen}
          globalAssetCount={globalAssetCount}
          onToggleGlobalAssets={() => setGlobalAssetsOpen((o) => !o)}
          kanbanGroups={data.kanbanGroups}
          kanbanCards={data.kanbanCards}
          selectedKanbanGroupId={selectedKanbanGroupId}
          selectedKanbanCardId={selectedKanbanCardId}
          onSelectKanbanGroup={setSelectedKanbanGroupId}
          onSelectKanbanCard={(cardId, groupId) => openKanbanCard(cardId, groupId)}
          onCreateKanbanGroup={() => setModal({ type: 'kanbanGroup' })}
          onDeleteKanbanGroup={handleDeleteKanbanGroup}
        />
        {sidebarView === 'dashboard' && (
          <DashboardPanel
            notes={data.notes}
            folders={data.folders}
            tags={data.tags}
            kanbanGroups={data.kanbanGroups}
            kanbanCards={data.kanbanCards}
            onNavigate={handleViewChange}
            onOpenGlobalAssets={() => setGlobalAssetsOpen(true)}
            onOpenNote={openNote}
            onOpenKanbanCard={openKanbanCard}
            onOpenTag={(tagId) => handleViewChange('tag', null, tagId)}
            onGoToAsset={handleGoToAsset}
            scrollBatchSize={scrollBatchSize}
            onHydrateNoteContents={store.hydrateAllNoteContents}
          />
        )}
        {sidebarView === 'todos' && (
          <div className="kanban-workspace">
            {selectedKanbanGroup ? (
              <KanbanPanel
                group={selectedKanbanGroup}
                columns={groupColumns}
                cards={groupCards}
                selectedCardId={selectedKanbanCardId}
                onSelectCard={setSelectedKanbanCardId}
                onCreateColumn={(name) => {
                  if (selectedKanbanGroupId) store.createKanbanColumn(selectedKanbanGroupId, name);
                }}
                onRenameColumn={store.renameKanbanColumn}
                onDeleteColumn={store.deleteKanbanColumn}
                onCreateCard={(columnId, title) => {
                  if (!selectedKanbanGroupId) return;
                  const card = store.createKanbanCard(selectedKanbanGroupId, columnId, title);
                  setSelectedKanbanCardId(card.id);
                }}
                onMoveCard={store.moveKanbanCard}
                onDeleteCard={(id) => {
                  store.deleteKanbanCard(id);
                  if (selectedKanbanCardId === id) setSelectedKanbanCardId(null);
                }}
                onRenameGroup={(name) => {
                  if (selectedKanbanGroupId) store.renameKanbanGroup(selectedKanbanGroupId, name);
                }}
              />
            ) : (
              <div className="kanban-workspace-empty">
                <p>{t('app.kanbanEmpty')}</p>
              </div>
            )}
            {selectedKanbanCard && selectedKanbanGroup && selectedCardColumn ? (
              <KanbanCardEditor
                card={selectedKanbanCard}
                groupName={getKanbanGroupDisplayName(selectedKanbanGroup.name, t)}
                columnName={getKanbanColumnDisplayName(selectedCardColumn.name, t)}
                saveStatus={store.saveStatus}
                onUpdateTitle={(title) => store.updateKanbanCard(selectedKanbanCard.id, { title })}
                onUpdateContent={(content) =>
                  store.updateKanbanCard(selectedKanbanCard.id, { content })
                }
                onDueAtChange={(dueAt) =>
                  store.updateKanbanCard(selectedKanbanCard.id, { dueAt })
                }
                onScheduledAtChange={(scheduledAt) =>
                  store.updateKanbanCard(selectedKanbanCard.id, { scheduledAt })
                }
                notes={data.notes}
                onLinkedNoteChange={(linkedNoteId) =>
                  store.updateKanbanCard(selectedKanbanCard.id, { linkedNoteId })
                }
                onOpenLinkedNote={openNote}
              />
            ) : (
              <EmptyState
                title={t('app.kanbanSelectCard')}
                description={t('app.kanbanSelectCardDesc')}
                icon={<CheckSquare size={48} strokeWidth={1.2} />}
              />
            )}
          </div>
        )}
        {sidebarView === 'schedule' && (
          <SchedulePanel
            notes={data.notes}
            kanbanCards={data.kanbanCards}
            tags={data.tags}
            selectedDay={scheduleSelectedDay}
            onSelectDay={(day) => {
              setScheduleSelectedDay(day);
              setScheduleDayFilter(day);
            }}
            onOpenNote={openNoteInSchedule}
            onOpenKanbanCard={openKanbanCard}
            onCreateNoteForDay={handleCreateNoteForDay}
            onAssignNoteToDay={handleAssignNoteToDay}
            onToggleNoteFavorite={handleToggleFavorite}
            onToggleNotePin={handleTogglePin}
            onDeleteNote={handleDeleteNote}
          />
        )}
        {showNoteList && (
          <NoteList
            notes={filteredNotes}
            folders={data.folders}
            tags={data.tags}
            kanbanCards={data.kanbanCards}
            selectedNoteId={selectedNoteId}
            onSelect={handleSelectNote}
            onCreate={handleCreateNote}
            onDelete={handleDeleteNote}
            onDeleteMany={handleDeleteNotes}
            onMoveMany={handleMoveNotes}
            onToggleFavorite={handleToggleFavorite}
            onTogglePin={handleTogglePin}
            listTitle={listTitle}
            scrollBatchSize={scrollBatchSize}
            panelClassName={isFocusLayout && noteListDrawerOpen ? 'note-list-drawer' : undefined}
          />
        )}
        {sidebarView !== 'todos' && sidebarView !== 'dashboard' && selectedNote ? (
          <NoteEditor
            note={selectedNote}
            folders={data.folders}
            tags={data.tags}
            kanbanGroups={data.kanbanGroups}
            linkedKanbanCards={linkedKanbanForNote}
            saveStatus={store.saveStatus}
            onUpdateTitle={(title) => store.updateNote(selectedNote.id, { title })}
            onUpdateContent={(content) => store.updateNote(selectedNote.id, { content })}
            onToggleFavorite={() => handleToggleFavorite(selectedNote.id)}
            onTogglePin={() => handleTogglePin(selectedNote.id)}
            onToggleTag={(tagId) => store.toggleNoteTag(selectedNote.id, tagId)}
            onCreateTag={(name) => {
              const tag = store.createTag(name);
              store.toggleNoteTag(selectedNote.id, tag.id);
            }}
            onFolderChange={(folderId) => store.updateNote(selectedNote.id, { folderId })}
            onScheduledAtChange={(scheduledAt) =>
              store.updateNote(selectedNote.id, { scheduledAt })
            }
            onCreateLinkedKanbanCard={(title, groupId) => {
              const card = store.createKanbanCardFromNote(selectedNote.id, title, groupId);
              if (card) openKanbanCard(card.id, card.groupId);
            }}
            onOpenKanbanCard={openKanbanCard}
            onOpenTodoView={() => {
              setSidebarView('todos');
              setGlobalAssetsOpen(false);
            }}
            scrollToAsset={
              pendingAsset?.noteId === selectedNote.id ? pendingAsset.asset : null
            }
            onAssetScrolled={() => setPendingAsset(null)}
            onBack={sidebarView === 'schedule' ? closeScheduleNote : undefined}
            backLabel={t('app.backToSchedule')}
          />
        ) : sidebarView !== 'todos' && sidebarView !== 'schedule' && sidebarView !== 'dashboard' ? (
          <EmptyState />
        ) : sidebarView === 'schedule' ? (
          <ScheduleListPanel
            notes={data.notes}
            kanbanCards={data.kanbanCards}
            tags={data.tags}
            pageSize={scrollBatchSize}
            dayFilter={scheduleDayFilter}
            onClearDayFilter={() => setScheduleDayFilter(null)}
            onOpenNote={openNoteInSchedule}
            onOpenKanbanCard={openKanbanCard}
            onToggleNoteFavorite={handleToggleFavorite}
            onToggleNotePin={handleTogglePin}
            onDeleteNote={handleDeleteNote}
          />
        ) : null}
        {globalAssetsOpen && (
          <GlobalAssetsPanel
            notes={data.notes}
            onClose={() => setGlobalAssetsOpen(false)}
            onGoToAsset={handleGoToAsset}
          />
        )}
      </div>

      {modal?.type === 'folder' && (
        <PromptModal
          title={modal.parentId ? t('app.modal.newSubfolder') : t('app.modal.newFolder')}
          placeholder={t('app.modal.folderName')}
          onConfirm={(name) => {
            store.createFolder(name, modal.parentId);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === 'tag' && (
        <PromptModal
          title={t('app.modal.newTag')}
          placeholder={t('app.modal.tagName')}
          onConfirm={(name) => {
            store.createTag(name);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      )}
      {modal?.type === 'kanbanGroup' && (
        <PromptModal
          title={t('app.modal.newKanbanGroup')}
          placeholder={t('app.modal.kanbanGroupName')}
          onConfirm={(name) => {
            const group = store.createKanbanGroup(name);
            setSelectedKanbanGroupId(group.id);
            setSelectedKanbanCardId(null);
            setModal(null);
          }}
          onCancel={() => setModal(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          theme={theme}
          layout={layout}
          scrollBatchSize={scrollBatchSize}
          locale={locale}
          timeZone={timeZone}
          uiZoomLevel={uiZoomLevel}
          onThemeChange={setTheme}
          onLayoutChange={setLayout}
          onScrollBatchSizeChange={setScrollBatchSize}
          onLocaleChange={setLocale}
          onTimeZoneChange={setTimeZone}
          onUiZoomLevelChange={setUiZoomLevel}
          onAdjustUiZoomLevel={adjustUiZoomLevel}
          onCheckForUpdates={checkForUpdates}
          onClose={() => setShowSettings(false)}
          onRestoreComplete={async () => {
            const s = await window.electronAPI.getSettings();
            await setTheme(s.theme);
            await setLayout(s.layout);
            await setLocale(s.locale);
            await setTimeZone(s.timeZone);
            await setUiZoomLevel(s.uiZoomLevel ?? 0);
            await store.reload();
            setSelectedNoteId(null);
            setSelectedKanbanGroupId(null);
            setSelectedKanbanCardId(null);
          }}
        />
      )}
    </div>
  );
}
