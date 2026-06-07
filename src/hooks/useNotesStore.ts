import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_KANBAN_GROUP_NAME } from '../utils/kanbanDisplayNames';
import type { AppData, Folder, KanbanCard, KanbanColumn, KanbanGroup, Note, Tag, TodoItem, TodoStatus } from '../types';

const TAG_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6'];

const defaultData: AppData = {
  folders: [],
  notes: [],
  tags: [],
  todos: [],
  kanbanGroups: [],
  kanbanColumns: [],
  kanbanCards: [],
};

export type SaveStatus = 'idle' | 'saving' | 'saved';

export function useNotesStore() {
  const [data, setData] = useState<AppData>(defaultData);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const savedIdleTimer = useRef<ReturnType<typeof setTimeout>>();
  const contentUiTimer = useRef<ReturnType<typeof setTimeout>>();
  const dataRef = useRef(data);
  // Jangan assign dataRef.current = data di render — itu menimpa konten editor yang belum di-setData

  const scheduleSave = useCallback((delay = 700) => {
    setSaveStatus('saving');
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!window.electronAPI) {
        setSaveStatus('idle');
        return;
      }
      void window.electronAPI.saveData(dataRef.current).then(
        () => {
          setSaveStatus('saved');
          clearTimeout(savedIdleTimer.current);
          savedIdleTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
        },
        (err) => {
          console.error(err);
          setSaveStatus('idle');
        }
      );
    }, delay);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        console.warn('[Notes] loadData timeout — tampilkan UI kosong');
        setLoaded(true);
      }
    }, 8000);

    const load = async () => {
      if (!window.electronAPI) {
        console.error(
          '[Notes] electronAPI tidak tersedia. Preload gagal dimuat — tutup app dan jalankan: npm run dev'
        );
        if (!cancelled) setLoaded(true);
        return;
      }
      try {
        const d = await window.electronAPI.loadData();
        if (!cancelled) {
          dataRef.current = d;
          setData(d);
        }
      } catch (err) {
        console.error('[Notes] loadData error:', err);
        if (!cancelled) setData(defaultData);
      }
      if (!cancelled) setLoaded(true);
    };
    void load();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(saveTimer.current);
      clearTimeout(savedIdleTimer.current);
      clearTimeout(contentUiTimer.current);
      if (window.electronAPI) {
        void window.electronAPI.saveData(dataRef.current).catch(console.error);
      }
    };
  }, []);

  const persist = useCallback(
    (updater: AppData | ((prev: AppData) => AppData)) => {
      clearTimeout(contentUiTimer.current);
      const next = typeof updater === 'function' ? updater(dataRef.current) : updater;
      dataRef.current = next;
      setData(next);
      scheduleSave(500);
    },
    [scheduleSave]
  );

  const updateNoteContent = useCallback(
    (id: string, content: string) => {
      const prev = dataRef.current.notes.find((n) => n.id === id);
      if (prev?.content === content) return;

      const preview = content
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 160);
      const next = {
        ...dataRef.current,
        notes: dataRef.current.notes.map((n) =>
          n.id === id
            ? { ...n, content, contentPreview: preview, contentLoaded: true, updatedAt: Date.now() }
            : n
        ),
      };
      dataRef.current = next;
      scheduleSave(900);
      clearTimeout(contentUiTimer.current);
      contentUiTimer.current = setTimeout(() => {
        setData({ ...dataRef.current });
      }, 400);
    },
    [scheduleSave]
  );

  /** Sinkronkan state + simpan sebelum pindah catatan */
  const flushBeforeNoteSwitch = useCallback(() => {
    clearTimeout(contentUiTimer.current);
    setData({ ...dataRef.current });
    clearTimeout(saveTimer.current);
    if (!window.electronAPI) return;
    setSaveStatus('saving');
    void window.electronAPI.saveData(dataRef.current).then(
      () => {
        setSaveStatus('saved');
        clearTimeout(savedIdleTimer.current);
        savedIdleTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
      },
      () => setSaveStatus('idle')
    );
  }, []);

  const ensureNoteContent = useCallback(async (id: string) => {
    const note = dataRef.current.notes.find((n) => n.id === id);
    if (!note || note.contentLoaded) return;
    if (!window.electronAPI) return;
    const payload = await window.electronAPI.loadNoteContent(id);
    if (!payload) return;
    const preview = payload.content
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 160);
    const next = {
      ...dataRef.current,
      notes: dataRef.current.notes.map((n) =>
        n.id === id
          ? { ...n, content: payload.content, contentPreview: preview, contentLoaded: true }
          : n
      ),
    };
    dataRef.current = next;
    setData(next);
  }, []);

  const hydrateAllNoteContents = useCallback(async () => {
    if (dataRef.current.notes.every((n) => n.contentLoaded)) return;
    if (!window.electronAPI) return;
    const bodies = await window.electronAPI.loadAllNoteContents();
    const next = {
      ...dataRef.current,
      notes: dataRef.current.notes.map((n) => {
        const content = bodies[n.id];
        if (!content) return n;
        const preview = content
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 160);
        return { ...n, content, contentPreview: preview, contentLoaded: true };
      }),
    };
    dataRef.current = next;
    setData(next);
  }, []);

  const createFolder = useCallback((name: string, parentId: string | null = null) => {
    const folder: Folder = { id: uuidv4(), name, parentId, createdAt: Date.now() };
    persist((prev) => ({ ...prev, folders: [...prev.folders, folder] }));
    return folder;
  }, [persist]);

  const renameFolder = useCallback(
    (id: string, name: string) => {
      persist((prev) => ({
        ...prev,
        folders: prev.folders.map((f) => (f.id === id ? { ...f, name } : f)),
      }));
    },
    [persist]
  );

  const deleteFolder = useCallback(
    (id: string) => {
      persist((prev) => {
        const collectIds = (folderId: string): string[] => {
          const children = prev.folders
            .filter((f) => f.parentId === folderId)
            .map((f) => f.id);
          return [folderId, ...children.flatMap(collectIds)];
        };
        const ids = new Set(collectIds(id));
        return {
          ...prev,
          folders: prev.folders.filter((f) => !ids.has(f.id)),
          notes: prev.notes.map((n) =>
            n.folderId && ids.has(n.folderId) ? { ...n, folderId: null } : n
          ),
        };
      });
    },
    [persist]
  );

  const createNote = useCallback(
    (folderId: string | null = null, options?: { scheduledAt?: number | null; title?: string }) => {
      const note: Note = {
        id: uuidv4(),
        title: options?.title ?? 'Catatan tanpa judul',
        content: '',
        contentPreview: '',
        contentLoaded: true,
        folderId,
        tagIds: [],
        favorite: false,
        pinned: false,
        scheduledAt: options?.scheduledAt ?? null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      persist((prev) => ({ ...prev, notes: [note, ...prev.notes] }));
      return note;
    },
    [persist]
  );

  const updateNote = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<Note, 'title' | 'content' | 'folderId' | 'tagIds' | 'favorite' | 'pinned' | 'scheduledAt'>
      >
    ) => {
      if ('content' in patch && Object.keys(patch).length === 1 && patch.content !== undefined) {
        updateNoteContent(id, patch.content);
        return;
      }
      clearTimeout(contentUiTimer.current);
      persist((prev) => ({
        ...prev,
        notes: prev.notes.map((n) => {
          if (n.id !== id) return n;
          const next = { ...n, ...patch, updatedAt: Date.now() };
          if ('content' in patch) next.contentLoaded = true;
          return next;
        }),
      }));
    },
    [persist, updateNoteContent]
  );

  const deleteNote = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => n.id !== id),
        todos: prev.todos.map((t) => (t.noteId === id ? { ...t, noteId: null } : t)),
      }));
    },
    [persist]
  );

  const deleteNotes = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const idSet = new Set(ids);
      persist((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => !idSet.has(n.id)),
        todos: prev.todos.map((t) =>
          t.noteId && idSet.has(t.noteId) ? { ...t, noteId: null } : t
        ),
      }));
    },
    [persist]
  );

  const createTodo = useCallback(
    (
      title: string,
      options?: { noteId?: string | null; dueAt?: number | null; status?: TodoStatus }
    ) => {
      const status = options?.status ?? 'todo';
      const todo: TodoItem = {
        id: uuidv4(),
        title: title.trim() || 'Tugas baru',
        done: status === 'done',
        status,
        noteId: options?.noteId ?? null,
        dueAt: options?.dueAt ?? null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      persist((prev) => ({ ...prev, todos: [todo, ...prev.todos] }));
      return todo;
    },
    [persist]
  );

  const updateTodo = useCallback(
    (
      id: string,
      patch: Partial<Pick<TodoItem, 'title' | 'done' | 'status' | 'noteId' | 'dueAt'>>
    ) => {
      persist((prev) => ({
        ...prev,
        todos: prev.todos.map((t) => {
          if (t.id !== id) return t;
          const next = { ...t, ...patch, updatedAt: Date.now() };
          if (patch.status !== undefined) {
            next.done = patch.status === 'done';
          } else if (patch.done !== undefined) {
            next.status = patch.done ? 'done' : next.status === 'done' ? 'todo' : next.status;
          }
          return next;
        }),
      }));
    },
    [persist]
  );

  const moveTodoStatus = useCallback(
    (id: string, status: TodoStatus) => {
      updateTodo(id, { status, done: status === 'done' });
    },
    [updateTodo]
  );

  const deleteTodo = useCallback(
    (id: string) => {
      persist((prev) => ({ ...prev, todos: prev.todos.filter((t) => t.id !== id) }));
    },
    [persist]
  );

  const toggleTodoDone = useCallback(
    (id: string) => {
      const todo = dataRef.current.todos.find((t) => t.id === id);
      if (todo) {
        const nextDone = !todo.done;
        updateTodo(id, {
          done: nextDone,
          status: nextDone ? 'done' : todo.status === 'done' ? 'todo' : todo.status,
        });
      }
    },
    [updateTodo]
  );

  const toggleFavorite = useCallback(
    (id: string) => {
      const note = dataRef.current.notes.find((n) => n.id === id);
      if (note) updateNote(id, { favorite: !note.favorite });
    },
    [updateNote]
  );

  const togglePin = useCallback(
    (id: string) => {
      const note = dataRef.current.notes.find((n) => n.id === id);
      if (note) updateNote(id, { pinned: !note.pinned });
    },
    [updateNote]
  );

  const createTag = useCallback(
    (name: string) => {
      const tag: Tag = {
        id: uuidv4(),
        name,
        color: TAG_COLORS[dataRef.current.tags.length % TAG_COLORS.length],
      };
      persist((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      return tag;
    },
    [persist]
  );

  const deleteTag = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        tags: prev.tags.filter((t) => t.id !== id),
        notes: prev.notes.map((n) => ({
          ...n,
          tagIds: n.tagIds.filter((t) => t !== id),
        })),
      }));
    },
    [persist]
  );

  const toggleNoteTag = useCallback(
    (noteId: string, tagId: string) => {
      const note = dataRef.current.notes.find((n) => n.id === noteId);
      if (!note) return;
      const tagIds = note.tagIds.includes(tagId)
        ? note.tagIds.filter((t) => t !== tagId)
        : [...note.tagIds, tagId];
      updateNote(noteId, { tagIds });
    },
    [updateNote]
  );

  const reload = useCallback(async () => {
    if (!window.electronAPI) return;
    const d = await window.electronAPI.loadData();
    setData(d);
    dataRef.current = d;
  }, []);

  const createKanbanGroup = useCallback(
    (name: string) => {
      const now = Date.now();
      const group: KanbanGroup = {
        id: uuidv4(),
        name: name.trim() || 'Grup baru',
        createdAt: now,
        updatedAt: now,
      };
      const col: KanbanColumn = {
        id: uuidv4(),
        groupId: group.id,
        name: 'Kolom 1',
        order: 0,
      };
      persist((prev) => ({
        ...prev,
        kanbanGroups: [...prev.kanbanGroups, group],
        kanbanColumns: [...prev.kanbanColumns, col],
      }));
      return group;
    },
    [persist]
  );

  const renameKanbanGroup = useCallback(
    (id: string, name: string) => {
      persist((prev) => ({
        ...prev,
        kanbanGroups: prev.kanbanGroups.map((g) =>
          g.id === id ? { ...g, name: name.trim() || g.name, updatedAt: Date.now() } : g
        ),
      }));
    },
    [persist]
  );

  const deleteKanbanGroup = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        kanbanGroups: prev.kanbanGroups.filter((g) => g.id !== id),
        kanbanColumns: prev.kanbanColumns.filter((c) => c.groupId !== id),
        kanbanCards: prev.kanbanCards.filter((c) => c.groupId !== id),
      }));
    },
    [persist]
  );

  const createKanbanColumn = useCallback(
    (groupId: string, name: string) => {
      const cols = dataRef.current.kanbanColumns.filter((c) => c.groupId === groupId);
      const order = cols.length ? Math.max(...cols.map((c) => c.order)) + 1 : 0;
      const col: KanbanColumn = {
        id: uuidv4(),
        groupId,
        name: name.trim() || `Kolom ${order + 1}`,
        order,
      };
      persist((prev) => ({ ...prev, kanbanColumns: [...prev.kanbanColumns, col] }));
      return col;
    },
    [persist]
  );

  const renameKanbanColumn = useCallback(
    (id: string, name: string) => {
      persist((prev) => ({
        ...prev,
        kanbanColumns: prev.kanbanColumns.map((c) =>
          c.id === id ? { ...c, name: name.trim() || c.name } : c
        ),
      }));
    },
    [persist]
  );

  const deleteKanbanColumn = useCallback(
    (id: string) => {
      const col = dataRef.current.kanbanColumns.find((c) => c.id === id);
      if (!col) return;
      const fallback = dataRef.current.kanbanColumns
        .filter((c) => c.groupId === col.groupId && c.id !== id)
        .sort((a, b) => a.order - b.order)[0]?.id;
      persist((prev) => ({
        ...prev,
        kanbanColumns: prev.kanbanColumns.filter((c) => c.id !== id),
        kanbanCards: fallback
          ? prev.kanbanCards.map((card) =>
              card.columnId === id ? { ...card, columnId: fallback } : card
            )
          : prev.kanbanCards.filter((card) => card.columnId !== id),
      }));
    },
    [persist]
  );

  const createKanbanCard = useCallback(
    (
      groupId: string,
      columnId: string,
      title: string,
      options?: { content?: string; linkedNoteId?: string | null; dueAt?: number | null }
    ) => {
      const inCol = dataRef.current.kanbanCards.filter(
        (c) => c.groupId === groupId && c.columnId === columnId
      );
      const order = inCol.length ? Math.max(...inCol.map((c) => c.order)) + 1 : 0;
      const now = Date.now();
      const card: KanbanCard = {
        id: uuidv4(),
        groupId,
        columnId,
        title: title.trim() || 'Kartu baru',
        content: options?.content ?? '',
        order,
        dueAt: options?.dueAt ?? null,
        scheduledAt: null,
        linkedNoteId: options?.linkedNoteId ?? null,
        createdAt: now,
        updatedAt: now,
      };
      persist((prev) => ({ ...prev, kanbanCards: [...prev.kanbanCards, card] }));
      return card;
    },
    [persist]
  );

  const updateKanbanCard = useCallback(
    (
      id: string,
      patch: Partial<
        Pick<
          KanbanCard,
          'title' | 'content' | 'columnId' | 'dueAt' | 'scheduledAt' | 'linkedNoteId' | 'order'
        >
      >
    ) => {
      persist((prev) => ({
        ...prev,
        kanbanCards: prev.kanbanCards.map((c) =>
          c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
        ),
      }));
    },
    [persist]
  );

  const moveKanbanCard = useCallback(
    (id: string, columnId: string) => {
      updateKanbanCard(id, { columnId });
    },
    [updateKanbanCard]
  );

  const deleteKanbanCard = useCallback(
    (id: string) => {
      persist((prev) => ({
        ...prev,
        kanbanCards: prev.kanbanCards.filter((c) => c.id !== id),
      }));
    },
    [persist]
  );

  const createKanbanCardFromNote = useCallback(
    (noteId: string, title: string, groupId?: string) => {
      const note = dataRef.current.notes.find((n) => n.id === noteId);
      let group =
        (groupId ? dataRef.current.kanbanGroups.find((g) => g.id === groupId) : null) ??
        dataRef.current.kanbanGroups[0];

      if (!group) {
        group = createKanbanGroup(DEFAULT_KANBAN_GROUP_NAME);
      }

      let col = dataRef.current.kanbanColumns
        .filter((c) => c.groupId === group!.id)
        .sort((a, b) => a.order - b.order)[0];

      if (!col) {
        col = createKanbanColumn(group.id, 'Kolom 1');
      }

      return createKanbanCard(group.id, col.id, title, {
        content: note?.content ?? '',
        linkedNoteId: noteId,
      });
    },
    [createKanbanGroup, createKanbanColumn, createKanbanCard]
  );

  return {
    data,
    loaded,
    saveStatus,
    reload,
    ensureNoteContent,
    flushBeforeNoteSwitch,
    hydrateAllNoteContents,
    createFolder,
    renameFolder,
    deleteFolder,
    createNote,
    updateNote,
    deleteNote,
    deleteNotes,
    toggleFavorite,
    togglePin,
    createTag,
    deleteTag,
    toggleNoteTag,
    createTodo,
    updateTodo,
    moveTodoStatus,
    deleteTodo,
    toggleTodoDone,
    createKanbanGroup,
    renameKanbanGroup,
    deleteKanbanGroup,
    createKanbanColumn,
    renameKanbanColumn,
    deleteKanbanColumn,
    createKanbanCard,
    updateKanbanCard,
    moveKanbanCard,
    deleteKanbanCard,
    createKanbanCardFromNote,
  };
}

export function buildFolderTree(folders: Folder[], parentId: string | null = null): Folder[] {
  return folders
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getFolderPath(folders: Folder[], folderId: string | null): string {
  if (!folderId) return '';
  const parts: string[] = [];
  let current: string | null = folderId;
  while (current) {
    const f = folders.find((x) => x.id === current);
    if (!f) break;
    parts.unshift(f.name);
    current = f.parentId;
  }
  return parts.join(' / ');
}

export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}
