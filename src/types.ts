import type { AppSettings } from './config/appearance';

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  /** Preview teks untuk daftar — diisi saat load ringkas dari DB */
  contentPreview?: string;
  /** false = content belum dimuat penuh (lazy load saat catatan dibuka) */
  contentLoaded?: boolean;
  folderId: string | null;
  tagIds: string[];
  favorite: boolean;
  /** Pin — catatan selalu di atas daftar (beda dari favorit) */
  pinned: boolean;
  /** Jadwal tampil di panel Jadwal (unix ms), null = tanpa jadwal */
  scheduledAt: number | null;
  createdAt: number;
  updatedAt: number;
}

/** @deprecated Migrasi ke kanban — tidak dipakai setelah upgrade */
export type TodoStatus = 'todo' | 'doing' | 'done';

/** @deprecated Migrasi ke KanbanCard */
export interface TodoItem {
  id: string;
  title: string;
  done: boolean;
  status: TodoStatus;
  noteId: string | null;
  dueAt: number | null;
  createdAt: number;
  updatedAt: number;
}

/** Grup / papan kanban (folder TODO di sidebar) */
export interface KanbanGroup {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

/** Kolom kustom per grup */
export interface KanbanColumn {
  id: string;
  groupId: string;
  name: string;
  order: number;
}

/** Kartu kanban — berisi catatan (content) langsung di kartu */
export interface KanbanCard {
  id: string;
  groupId: string;
  columnId: string;
  title: string;
  /** Isi catatan rich-text (HTML), sama seperti Note.content */
  content: string;
  order: number;
  dueAt: number | null;
  scheduledAt: number | null;
  /** Opsional: tautan ke catatan di daftar Semua Catatan */
  linkedNoteId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface AppData {
  folders: Folder[];
  notes: Note[];
  tags: Tag[];
  /** Legacy — dikosongkan setelah migrasi kanban */
  todos: TodoItem[];
  kanbanGroups: KanbanGroup[];
  kanbanColumns: KanbanColumn[];
  kanbanCards: KanbanCard[];
}

export type SidebarView =
  | 'dashboard'
  | 'all'
  | 'favorites'
  | 'folder'
  | 'tag'
  | 'todos'
  | 'schedule';

export type {
  AppTheme,
  AppLayoutMode,
  AppSettings,
} from './config/appearance';

export {
  APP_THEMES,
  APP_LAYOUTS,
  DEFAULT_APP_SETTINGS,
} from './config/appearance';

export interface StorageInfo {
  storageType: 'sqlite';
  dataPath: string;
  databasePath: string;
  imagesPath: string;
  attachmentsPath: string;
  notesCount: number;
  foldersCount: number;
  tagsCount: number;
  kanbanCardsCount: number;
  imagesCount: number;
  attachmentsCount: number;
  totalBytes: number;
}

export type StoredFileKind = 'image' | 'attachment';

export interface StoredFileEntry {
  fileId: string;
  kind: StoredFileKind;
  /** Nama file di disk (uuid.ext) */
  diskName: string;
  /** Nama asli untuk tampilan */
  originalName: string;
  /** @deprecated gunakan originalName */
  fileName: string;
  size: number;
  used: boolean;
  usedInNotes: string[];
}

export interface StoredFileInventory {
  imagesPath: string;
  attachmentsPath: string;
  files: StoredFileEntry[];
  unusedCount: number;
}

export type DeleteStoredFileResult =
  | { ok: true }
  | { ok: false; error: string; usedInNotes?: string[] };

export type DeleteIfUnreferencedResult =
  | { ok: true; deleted: boolean }
  | { ok: false; error: string };

export type DeleteUnusedFilesResult = { ok: true; deleted: number };

export type BackupResult =
  | { ok: true; path?: string; safetyPath?: string }
  | { ok: false; error: string };

export type FileKind = 'pdf' | 'word' | 'excel' | 'image' | 'text' | 'other';

export interface AttachmentMeta {
  fileId: string;
  storedUrl: string;
  fileName: string;
  fileKind: FileKind;
  mimeType: string;
  size: number;
}

export type NoteExportFormat = 'txt' | 'html' | 'md' | 'pdf';

export type NoteExportResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

export type UpdaterCheckResult =
  | { status: 'dev' }
  | { status: 'not-available'; currentVersion: string }
  | { status: 'available'; currentVersion: string; version: string }
  | { status: 'error'; message: string };

export interface ElectronAPI {
  platform: NodeJS.Platform;
  loadData: () => Promise<AppData>;
  loadNoteContent: (noteId: string) => Promise<{ content: string } | null>;
  loadAllNoteContents: () => Promise<Record<string, string>>;
  saveData: (data: AppData) => Promise<boolean>;
  uploadImage: () => Promise<string | null>;
  copyImageFromPath: (filePath: string) => Promise<string | null>;
  getPathForFile: (file: File) => string;
  saveImageBuffer: (base64: string, ext: string) => Promise<string>;
  resolveImage: (url: string) => Promise<string | null>;
  readClipboardImage: () => Promise<string | null>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<boolean>;
  getUiZoomLevel: () => Promise<number>;
  setUiZoomLevel: (level: number) => Promise<number>;
  adjustUiZoomLevel: (delta: number) => Promise<number>;
  windowMinimize: () => Promise<void>;
  windowToggleMaximize: () => Promise<boolean>;
  windowClose: () => Promise<void>;
  getAppVersion: () => Promise<string>;
  checkForUpdates: () => Promise<UpdaterCheckResult>;
  downloadUpdate: () => Promise<boolean>;
  installUpdate: () => Promise<void>;
  onUpdaterEvent: (
    channel:
      | 'updater:available'
      | 'updater:not-available'
      | 'updater:downloaded'
      | 'updater:progress'
      | 'updater:error',
    callback: (payload: Record<string, unknown>) => void
  ) => () => void;
  getStorageInfo: () => Promise<StorageInfo>;
  getFileInventory: () => Promise<StoredFileInventory>;
  openStorageFolder: (which: 'data' | 'images' | 'attachments') => Promise<boolean>;
  deleteStoredFile: (fileId: string, force?: boolean) => Promise<DeleteStoredFileResult>;
  deleteUnusedStoredFiles: () => Promise<DeleteUnusedFilesResult>;
  exportBackup: () => Promise<BackupResult>;
  restoreBackup: () => Promise<BackupResult>;
  pickAttachments: () => Promise<AttachmentMeta[]>;
  copyAttachmentFromPath: (filePath: string) => Promise<AttachmentMeta | null>;
  saveAttachmentBuffer: (base64: string, fileName: string) => Promise<AttachmentMeta | null>;
  resolveFile: (url: string) => Promise<string | null>;
  readFileAsText: (storedUrl: string) => Promise<string | null>;
  readFileBuffer: (storedUrl: string) => Promise<Uint8Array | null>;
  openFileExternal: (storedUrl: string) => Promise<boolean>;
  showFileInFolder: (storedUrl: string) => Promise<boolean>;
  deleteStoredFileIfUnreferenced: (storedUrl: string) => Promise<DeleteIfUnreferencedResult>;
  downloadFile: (storedUrl: string, suggestedName: string) => Promise<NoteExportResult>;
  previewOfficeHtml: (
    storedUrl: string,
    kind: 'word' | 'excel',
    sheetName?: string
  ) => Promise<string | null>;
  listExcelSheets: (storedUrl: string) => Promise<string[]>;
  previewExcelSheet: (storedUrl: string, sheetName: string) => Promise<string | null>;
  exportNote: (payload: {
    title: string;
    content: string;
    plainText: string;
    format: NoteExportFormat;
  }) => Promise<NoteExportResult>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
