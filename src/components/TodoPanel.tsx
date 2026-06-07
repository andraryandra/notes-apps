import { useMemo, useRef, useState } from 'react';
import { Plus, Trash2, CheckSquare, Link2, Calendar, GripVertical, X } from 'lucide-react';
import type { Note, TodoItem, TodoStatus } from '../types';
import { useDateTime } from '../hooks/useDateTime';
import { SearchableSelect, SegmentedSelect } from './SearchableSelect';
import './TodoPanel.css';

const COLUMNS: { status: TodoStatus; label: string; hint: string }[] = [
  { status: 'todo', label: 'Belum', hint: 'Tugas yang belum dimulai' },
  { status: 'doing', label: 'Sedang', hint: 'Sedang dikerjakan' },
  { status: 'done', label: 'Selesai', hint: 'Sudah selesai' },
];

interface Props {
  todos: TodoItem[];
  notes: Note[];
  selectedTodoId: string | null;
  onSelectTodo: (id: string | null) => void;
  onCreate: (title: string, status?: TodoStatus) => void;
  onMoveStatus: (id: string, status: TodoStatus) => void;
  onUpdate: (id: string, patch: Partial<Pick<TodoItem, 'title' | 'dueAt' | 'noteId' | 'status'>>) => void;
  onDelete: (id: string) => void;
  onOpenNote: (noteId: string) => void;
}

export function TodoPanel({
  todos,
  notes,
  selectedTodoId,
  onSelectTodo,
  onCreate,
  onMoveStatus,
  onUpdate,
  onDelete,
  onOpenNote,
}: Props) {
  const dt = useDateTime();
  const [dragId, setDragId] = useState<string | null>(null);
  const selected = todos.find((t) => t.id === selectedTodoId) ?? null;

  const noteSelectOptions = useMemo(
    () =>
      notes.map((n) => ({
        value: n.id,
        label: n.title.trim() || 'Tanpa judul',
        description: n.scheduledAt ? dt.formatScheduleDate(n.scheduledAt) : undefined,
      })),
    [notes, dt]
  );

  const byStatus = useMemo(() => {
    const map: Record<TodoStatus, TodoItem[]> = { todo: [], doing: [], done: [] };
    for (const t of todos) {
      const s = t.status ?? (t.done ? 'done' : 'todo');
      map[s].push(t);
    }
    for (const col of COLUMNS) {
      map[col.status].sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return map;
  }, [todos]);

  const activeCount = byStatus.todo.length + byStatus.doing.length;

  return (
    <div className="todo-panel todo-panel--kanban">
      <header className="todo-panel-header">
        <div className="todo-panel-header-text">
          <h2>
            <CheckSquare size={18} />
            TODO
          </h2>
          <p className="todo-panel-subtitle">Seret kartu antar kolom · tambah kartu di setiap kolom</p>
        </div>
        <div className="todo-panel-stats">
          <span className="todo-stat todo-stat--active">
            <strong>{activeCount}</strong> aktif
          </span>
          <span className="todo-stat todo-stat--done">
            <strong>{byStatus.done.length}</strong> selesai
          </span>
        </div>
      </header>

      <div className="kanban-board">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            column={col}
            todos={byStatus[col.status]}
            selectedTodoId={selectedTodoId}
            dragId={dragId}
            onCreateCard={(title) => onCreate(title, col.status)}
            notes={notes}
            onSelectTodo={onSelectTodo}
            onDelete={onDelete}
            onOpenNote={onOpenNote}
            onMoveStatus={onMoveStatus}
            onDragStart={setDragId}
            onDragEnd={() => setDragId(null)}
          />
        ))}
      </div>

      {selected && (
        <div className="todo-detail">
          <div className="todo-detail-head">
            <h3>Detail kartu</h3>
            <button type="button" className="todo-detail-close" onClick={() => onSelectTodo(null)} title="Tutup">
              <X size={16} />
            </button>
          </div>
          <label className="todo-detail-label">Judul</label>
          <input
            type="text"
            className="todo-detail-input"
            value={selected.title}
            onChange={(e) => onUpdate(selected.id, { title: e.target.value })}
          />
          <label className="todo-detail-label">Kolom kanban</label>
          <SegmentedSelect
            value={selected.status}
            onChange={(status) => onMoveStatus(selected.id, status)}
            options={[
              { value: 'todo', label: 'Belum' },
              { value: 'doing', label: 'Sedang' },
              { value: 'done', label: 'Selesai' },
            ]}
          />
          <label className="todo-detail-label">
            <Calendar size={14} />
            Jadwal / tenggat
          </label>
          <input
            type="datetime-local"
            className="todo-detail-input"
            value={dt.toDatetimeLocalValue(selected.dueAt)}
            onChange={(e) => onUpdate(selected.id, { dueAt: dt.fromDatetimeLocalValue(e.target.value) })}
          />
          <label className="todo-detail-label">
            <Link2 size={14} />
            Hubungkan catatan
          </label>
          <SearchableSelect
            value={selected.noteId ?? ''}
            onChange={(noteId) => onUpdate(selected.id, { noteId: noteId || null })}
            options={noteSelectOptions}
            placeholder="Pilih catatan…"
            searchPlaceholder="Cari judul catatan…"
            emptyOption={{ value: '', label: '— Tidak ada —' }}
          />
          {selected.noteId && (
            <button type="button" className="todo-open-note-btn" onClick={() => onOpenNote(selected.noteId!)}>
              Buka catatan terkait
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  column,
  todos,
  selectedTodoId,
  dragId,
  notes,
  onSelectTodo,
  onDelete,
  onOpenNote,
  onMoveStatus,
  onDragStart,
  onDragEnd,
  onCreateCard,
}: {
  column: (typeof COLUMNS)[number];
  todos: TodoItem[];
  selectedTodoId: string | null;
  dragId: string | null;
  notes: Note[];
  onSelectTodo: (id: string | null) => void;
  onDelete: (id: string) => void;
  onOpenNote: (noteId: string) => void;
  onMoveStatus: (id: string, status: TodoStatus) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onCreateCard: (title: string) => void;
}) {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const openComposer = () => {
    setComposing(true);
    setDraft('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submitCard = () => {
    const title = draft.trim();
    if (!title) return;
    onCreateCard(title);
    setDraft('');
    setComposing(false);
  };

  return (
    <div
      className={`kanban-column kanban-column--${column.status}`}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('kanban-column--drag-over');
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target || !e.currentTarget.contains(e.relatedTarget as Node)) {
          e.currentTarget.classList.remove('kanban-column--drag-over');
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('kanban-column--drag-over');
        const id = e.dataTransfer.getData('text/plain') || dragId;
        if (id) onMoveStatus(id, column.status);
        onDragEnd();
      }}
    >
      <div className="kanban-column-header">
        <div className="kanban-column-heading">
          <span className="kanban-column-dot" aria-hidden />
          <div>
            <span className="kanban-column-title">{column.label}</span>
            <span className="kanban-column-hint">{column.hint}</span>
          </div>
        </div>
        <span className="kanban-column-count">{todos.length}</span>
      </div>

      <div className="kanban-column-cards">
        {todos.map((todo) => (
          <KanbanCard
            key={todo.id}
            todo={todo}
            notes={notes}
            selected={selectedTodoId === todo.id}
            onSelect={() => onSelectTodo(todo.id)}
            onDelete={() => onDelete(todo.id)}
            onOpenNote={onOpenNote}
            onDragStart={() => onDragStart(todo.id)}
            onDragEnd={onDragEnd}
          />
        ))}

        {todos.length === 0 && !composing && (
          <button type="button" className="kanban-column-empty" onClick={openComposer}>
            <Plus size={18} />
            <span>Tambah kartu pertama</span>
          </button>
        )}
      </div>

      <div className="kanban-column-footer">
        {composing ? (
          <div className="kanban-composer">
            <textarea
              ref={inputRef}
              className="kanban-composer-input"
              placeholder="Judul tugas…"
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitCard();
                }
                if (e.key === 'Escape') {
                  setComposing(false);
                  setDraft('');
                }
              }}
            />
            <div className="kanban-composer-actions">
              <button type="button" className="kanban-composer-add" onClick={submitCard} disabled={!draft.trim()}>
                Tambah
              </button>
              <button
                type="button"
                className="kanban-composer-cancel"
                onClick={() => {
                  setComposing(false);
                  setDraft('');
                }}
              >
                Batal
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="kanban-add-card-btn" onClick={openComposer}>
            <Plus size={16} />
            Tambah kartu
          </button>
        )}
      </div>
    </div>
  );
}

function KanbanCard({
  todo,
  notes,
  selected,
  onSelect,
  onDelete,
  onOpenNote,
  onDragStart,
  onDragEnd,
}: {
  todo: TodoItem;
  notes: Note[];
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onOpenNote: (noteId: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const dt = useDateTime();
  const linked = todo.noteId ? notes.find((n) => n.id === todo.noteId) : null;

  return (
    <div
      className={`kanban-card ${selected ? 'selected' : ''} ${todo.status === 'done' ? 'is-done' : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', todo.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
    >
      <div className="kanban-card-top">
        <button type="button" className="kanban-card-drag" tabIndex={-1} aria-label="Seret kartu">
          <GripVertical size={14} />
        </button>
        <button type="button" className="kanban-card-body" onClick={onSelect}>
          <span className="kanban-card-title">{todo.title}</span>
        </button>
      </div>
      {(todo.dueAt || linked) && (
        <div className="kanban-card-tags">
          {todo.dueAt && (
            <span className="kanban-card-tag kanban-card-tag--date">
              <Calendar size={11} />
              {dt.formatScheduleDate(todo.dueAt)}
            </span>
          )}
          {linked && (
            <button
              type="button"
              className="kanban-card-tag kanban-card-tag--note"
              onClick={(e) => {
                e.stopPropagation();
                onOpenNote(linked.id);
              }}
              title="Buka catatan"
            >
              <Link2 size={11} />
              {linked.title.trim() || 'Catatan'}
            </button>
          )}
        </div>
      )}
      <div className="kanban-card-footer">
        <button type="button" className="kanban-card-action" onClick={onSelect}>
          Edit
        </button>
        <button type="button" className="kanban-card-action kanban-card-action--danger" onClick={onDelete}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
