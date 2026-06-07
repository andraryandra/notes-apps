import { contextBridge, ipcRenderer, webUtils } from 'electron';
import type {
  AppData,
  AppSettings,
  StorageInfo,
  StoredFileInventory,
  StoredFileKind,
  DeleteStoredFileResult,
  DeleteUnusedFilesResult,
  DeleteIfUnreferencedResult,
  BackupResult,
  AttachmentMeta,
  NoteExportFormat,
  NoteExportResult,
} from '../src/types';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  loadData: (): Promise<AppData> => ipcRenderer.invoke('data:load'),
  loadNoteContent: (noteId: string): Promise<{ content: string } | null> =>
    ipcRenderer.invoke('data:loadNoteContent', noteId),
  loadAllNoteContents: (): Promise<Record<string, string>> =>
    ipcRenderer.invoke('data:loadAllNoteContents'),
  saveData: (data: AppData): Promise<boolean> => ipcRenderer.invoke('data:save', data),
  uploadImage: (): Promise<string | null> => ipcRenderer.invoke('image:upload'),
  copyImageFromPath: (filePath: string): Promise<string | null> =>
    ipcRenderer.invoke('image:copyFromPath', filePath),
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),
  saveImageBuffer: (base64: string, ext: string): Promise<string> =>
    ipcRenderer.invoke('image:save-buffer', base64, ext),
  resolveImage: (url: string): Promise<string | null> => ipcRenderer.invoke('image:resolve', url),
  readClipboardImage: (): Promise<string | null> => ipcRenderer.invoke('clipboard:readImage'),
  getSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: AppSettings): Promise<boolean> =>
    ipcRenderer.invoke('settings:save', settings),
  getStorageInfo: (): Promise<StorageInfo> => ipcRenderer.invoke('storage:getInfo'),
  getFileInventory: (): Promise<StoredFileInventory> =>
    ipcRenderer.invoke('storage:getFileInventory'),
  openStorageFolder: (which: 'data' | 'images' | 'attachments'): Promise<boolean> =>
    ipcRenderer.invoke('storage:openFolder', which),
  deleteStoredFile: (fileId: string, force?: boolean): Promise<DeleteStoredFileResult> =>
    ipcRenderer.invoke('storage:deleteStoredFile', fileId, force),
  deleteUnusedStoredFiles: (): Promise<DeleteUnusedFilesResult> =>
    ipcRenderer.invoke('storage:deleteUnusedFiles'),
  exportBackup: (): Promise<BackupResult> => ipcRenderer.invoke('backup:export'),
  restoreBackup: (): Promise<BackupResult> => ipcRenderer.invoke('backup:restore'),
  pickAttachments: (): Promise<AttachmentMeta[]> => ipcRenderer.invoke('attachment:pick'),
  copyAttachmentFromPath: (filePath: string): Promise<AttachmentMeta | null> =>
    ipcRenderer.invoke('attachment:copyFromPath', filePath),
  saveAttachmentBuffer: (base64: string, fileName: string): Promise<AttachmentMeta | null> =>
    ipcRenderer.invoke('attachment:saveBuffer', base64, fileName),
  resolveFile: (url: string): Promise<string | null> => ipcRenderer.invoke('file:resolve', url),
  readFileAsText: (storedUrl: string): Promise<string | null> =>
    ipcRenderer.invoke('file:readText', storedUrl),
  readFileBuffer: (storedUrl: string): Promise<Uint8Array | null> =>
    ipcRenderer.invoke('file:readBuffer', storedUrl),
  openFileExternal: (storedUrl: string): Promise<boolean> =>
    ipcRenderer.invoke('file:openExternal', storedUrl),
  showFileInFolder: (storedUrl: string): Promise<boolean> =>
    ipcRenderer.invoke('file:showInFolder', storedUrl),
  deleteStoredFileIfUnreferenced: (storedUrl: string): Promise<DeleteIfUnreferencedResult> =>
    ipcRenderer.invoke('file:deleteIfUnreferenced', storedUrl),
  downloadFile: (storedUrl: string, suggestedName: string): Promise<NoteExportResult> =>
    ipcRenderer.invoke('file:download', storedUrl, suggestedName),
  previewOfficeHtml: (
    storedUrl: string,
    kind: 'word' | 'excel',
    sheetName?: string
  ): Promise<string | null> => ipcRenderer.invoke('file:previewOffice', storedUrl, kind, sheetName),
  listExcelSheets: (storedUrl: string): Promise<string[]> =>
    ipcRenderer.invoke('file:listExcelSheets', storedUrl),
  previewExcelSheet: (storedUrl: string, sheetName: string): Promise<string | null> =>
    ipcRenderer.invoke('file:previewExcelSheet', storedUrl, sheetName),
  exportNote: (payload: {
    title: string;
    content: string;
    plainText: string;
    format: NoteExportFormat;
  }): Promise<NoteExportResult> => ipcRenderer.invoke('note:export', payload),
});
