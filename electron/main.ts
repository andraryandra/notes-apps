import { app, BrowserWindow, ipcMain, dialog, protocol, clipboard, shell, type WebContents } from 'electron';
import path from 'path';
import fs from 'fs';
import { Readable } from 'node:stream';
import {
  BACKUP_DB,
  createManifest,
  copyDirRecursive,
  clearDirContents,
  isValidBackupDir,
  getBackupDbPath,
  getLegacyJsonBackupPath,
} from './backup';
import { loadSettings, saveSettings, type AppSettings } from './settings';
import { clampUiZoomLevel } from '../src/config/appearance';
import { ATTACHMENT_FILTER, getExt, getFileKind, getMime as mimeFromName } from './fileTypes';
import { previewOfficeHtml, listExcelSheetNames, previewExcelSheetHtml } from './officePreview';
import {
  fileNameFromProtocolRequest,
  fileNameFromStoredUrl,
  buildStoredFileUrl,
  buildStoredImageUrl,
  fileIdFromProtocolRequest,
  fileIdFromStoredUrl,
} from './storedUrl';
import { originalDisplayName } from './storedFileName';
import { registerNewStoredFile } from './storage/storedFilesRepo';
import type { StoredFileKind } from '../src/types';
import {
  buildStoragePaths,
  ensureStorageDirs,
  getStorageDataBytes,
  getDataStore,
  getStoredFileInventory,
  importLegacyJsonBackup,
  loadAllData,
  loadAllNoteContents,
  loadNoteContent,
  purgeUnusedFilesAfterSave,
  purgeStoredFileIfUnreferenced,
  syncStoredFileRefs,
  removeStoredFileById,
  replaceSqliteDatabase,
  resetDataStore,
  saveAllData,
} from './storage';
import type { AppData, NoteExportFormat } from '../src/types';
import { inlineStoredUrlsInHtml } from './exportHtml';
import { setupAutoUpdater } from './updater';

const USER_DATA = () => app.getPath('userData');
const storagePaths = () => buildStoragePaths(USER_DATA());
const SQLITE_FILE = () => storagePaths().sqliteFile;
const IMAGES_DIR = () => storagePaths().imagesDir;
const ATTACHMENTS_DIR = () => storagePaths().attachmentsDir;
const SETTINGS_FILE = () => path.join(USER_DATA(), 'settings.json');

export interface AttachmentMeta {
  fileId: string;
  storedUrl: string;
  fileName: string;
  fileKind: ReturnType<typeof getFileKind>;
  mimeType: string;
  size: number;
}

function ensureDirs() {
  const paths = storagePaths();
  ensureStorageDirs(paths);
  const store = getDataStore(paths);
  store.files.migrateOrphanDiskFiles(
    paths.imagesDir,
    paths.attachmentsDir,
    mimeFromName,
    (name) => getFileKind(name)
  );
}

function resolveStoredFilePath(storedUrl: string): string | null {
  const paths = storagePaths();
  const store = getDataStore(paths);
  const row = store.files.resolveRowFromUrl(storedUrl);
  if (row) {
    const fp = store.files.diskPath(row, paths.imagesDir, paths.attachmentsDir);
    if (fs.existsSync(fp)) return fp;
  }

  const fileId = fileIdFromStoredUrl(storedUrl);
  if (fileId) {
    const kind: StoredFileKind = storedUrl.startsWith('notes-image:') ? 'image' : 'attachment';
    const fp = store.files.findDiskPathByFileId(
      fileId,
      kind,
      paths.imagesDir,
      paths.attachmentsDir
    );
    if (fp) return fp;
  }

  if (storedUrl.startsWith('notes-image://')) {
    const name = fileNameFromStoredUrl(storedUrl);
    const legacy = path.join(IMAGES_DIR(), path.basename(name));
    if (fs.existsSync(legacy)) return legacy;
  }
  if (storedUrl.startsWith('notes-file://')) {
    const name = fileNameFromStoredUrl(storedUrl);
    const legacy = path.join(ATTACHMENTS_DIR(), path.basename(name));
    if (fs.existsSync(legacy)) return legacy;
  }
  return null;
}

function storedPath(storedUrl: string): string | null {
  const full = resolveStoredFilePath(storedUrl);
  if (!full || !fs.existsSync(full)) return null;
  return full;
}

function loadData(): AppData {
  ensureDirs();
  return loadAllData(storagePaths());
}

function saveData(data: AppData) {
  saveAllData(storagePaths(), data);
}

function saveImageFile(
  originalName: string,
  size: number,
  writeTo: (destPath: string) => void
): string {
  const paths = storagePaths();
  const store = getDataStore(paths);
  const row = registerNewStoredFile(store.files, {
    kind: 'image',
    originalName,
    mimeType: mimeFromName(originalName),
    fileKind: getFileKind(originalName),
    size,
  });
  const dest = store.files.diskPath(row, paths.imagesDir, paths.attachmentsDir);
  writeTo(dest);
  return buildStoredImageUrl(row.id);
}

function copyToAttachments(srcPath: string): AttachmentMeta | null {
  ensureDirs();
  if (!srcPath || !fs.existsSync(srcPath)) return null;
  const fileName = originalDisplayName(srcPath);
  const stat = fs.statSync(srcPath);
  const paths = storagePaths();
  const store = getDataStore(paths);
  const row = registerNewStoredFile(store.files, {
    kind: 'attachment',
    originalName: fileName,
    mimeType: mimeFromName(fileName),
    fileKind: getFileKind(fileName),
    size: stat.size,
  });
  const dest = store.files.diskPath(row, paths.imagesDir, paths.attachmentsDir);
  fs.copyFileSync(srcPath, dest);
  return {
    fileId: row.id,
    storedUrl: buildStoredFileUrl(row.id),
    fileName,
    fileKind: getFileKind(fileName),
    mimeType: mimeFromName(fileName),
    size: stat.size,
  };
}

let mainWindow: BrowserWindow | null = null;

const IS_DEV = !app.isPackaged;

function getDevServerUrl(): string {
  const fromEnv = process.env.VITE_DEV_SERVER_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  return `http://127.0.0.1:${process.env.VITE_DEV_SERVER_PORT ?? '5173'}`;
}

/** Vite menghasilkan preload.js; jangan hardcode preload.mjs */
function getPreloadPath(): string {
  for (const name of ['preload.js', 'preload.mjs', 'preload.cjs']) {
    const full = path.join(__dirname, name);
    if (fs.existsSync(full)) return full;
  }
  throw new Error(
    `Preload tidak ditemukan di ${__dirname}. Jalankan ulang: npm run dev`
  );
}

const PRIVILEGED_SCHEME = {
  standard: true,
  secure: true,
  supportFetchAPI: true,
  corsEnabled: true,
  bypassCSP: true,
  stream: true,
};

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu-vsync');
  if (IS_DEV) {
    app.disableHardwareAcceleration();
  }
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'notes-image', privileges: PRIVILEGED_SCHEME },
  { scheme: 'notes-file', privileges: PRIVILEGED_SCHEME },
]);

function fileStreamResponse(filePath: string, contentType: string, inlineName?: string): Response {
  const stat = fs.statSync(filePath);
  const body = Readable.toWeb(fs.createReadStream(filePath)) as ReadableStream;
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Content-Length': String(stat.size),
  };
  if (inlineName) {
    headers['Content-Disposition'] = `inline; filename="${inlineName}"`;
  }
  return new Response(body, { headers });
}

function applyWindowZoom(wc: WebContents, level: number): number {
  const clamped = clampUiZoomLevel(level);
  wc.setZoomLevel(clamped);
  return clamped;
}

function persistZoomLevel(level: number) {
  const settingsPath = SETTINGS_FILE();
  const settings = loadSettings(settingsPath);
  const clamped = clampUiZoomLevel(level);
  if (settings.uiZoomLevel === clamped) return;
  saveSettings(settingsPath, { ...settings, uiZoomLevel: clamped });
}

function registerZoomShortcuts(wc: WebContents) {
  wc.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (!(input.control || input.meta)) return;

    const key = input.key;
    if (key === '=' || key === '+' || key === 'Add') {
      const next = applyWindowZoom(wc, wc.getZoomLevel() + 0.5);
      persistZoomLevel(next);
      event.preventDefault();
      return;
    }
    if (key === '-' || key === 'Subtract' || key === '_') {
      const next = applyWindowZoom(wc, wc.getZoomLevel() - 0.5);
      persistZoomLevel(next);
      event.preventDefault();
      return;
    }
    if (key === '0') {
      applyWindowZoom(wc, 0);
      persistZoomLevel(0);
      event.preventDefault();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: process.platform !== 'darwin',
    autoHideMenuBar: process.platform !== 'darwin',
    backgroundColor: '#0a0a0d',
    show: false,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: !IS_DEV,
    },
  });

  const wc = mainWindow.webContents;

  const initialZoom = loadSettings(SETTINGS_FILE()).uiZoomLevel ?? 0;
  applyWindowZoom(wc, initialZoom);
  registerZoomShortcuts(wc);

  wc.on('did-fail-load', (_event, code, description, url) => {
    console.error('[Notes] Gagal memuat halaman:', url, code, description);
  });

  wc.on('render-process-gone', (_event, details) => {
    console.error('[Notes] Renderer crash:', details.reason, details.exitCode);
  });

  wc.on('console-message', (_event, level, message, line, sourceId) => {
    if (level >= 2) {
      console.error('[Renderer]', message, `(${sourceId}:${line})`);
    }
  });

  wc.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      void shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  wc.on('will-navigate', (event, url) => {
    if (url.startsWith('file://')) {
      event.preventDefault();
      return;
    }
    if (IS_DEV) {
      const devUrl = getDevServerUrl();
      if (url === devUrl || url.startsWith(`${devUrl}/`)) return;
      if (url.startsWith('http://localhost:') || url.startsWith('http://127.0.0.1:')) return;
    }
    event.preventDefault();
  });

  wc.session.on('will-download', (event, item) => {
    const url = item.getURL();
    if (url.startsWith('file://') || url.startsWith('notes-image://') || url.startsWith('notes-attachment://')) {
      event.preventDefault();
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (IS_DEV) {
    const devUrl = getDevServerUrl();
    console.log('[Notes] Memuat dev URL:', devUrl);
    void wc.loadURL(devUrl).catch((err) => {
      console.error('[Notes] loadURL gagal:', err);
    });
    if (process.env.NOTES_DEVTOOLS === '1') {
      wc.openDevTools({ mode: 'detach' });
    }
  } else {
    void wc.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  ensureDirs();

  protocol.handle('notes-image', (request) => {
    const filePath = resolveProtocolFilePath(request.url, 'image');
    if (!filePath) return new Response('Not found', { status: 404 });
    return fileStreamResponse(filePath, getMime(filePath));
  });

  protocol.handle('notes-file', (request) => {
    const paths = storagePaths();
    const id = fileIdFromProtocolRequest(request.url);
    let filePath: string | null = null;
    let displayName: string | undefined;

    if (id) {
      const row = getDataStore(paths).files.getById(id);
      if (row?.kind === 'attachment') {
        filePath = getDataStore(paths).files.diskPath(row, paths.imagesDir, paths.attachmentsDir);
        displayName = row.originalName;
      }
    } else {
      const name = fileNameFromProtocolRequest(request.url);
      const legacy = path.join(ATTACHMENTS_DIR(), path.basename(name));
      if (fs.existsSync(legacy)) {
        filePath = legacy;
        displayName = path.basename(name);
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return new Response('Not found', { status: 404 });
    }
    return fileStreamResponse(filePath, mimeFromName(displayName ?? filePath), displayName);
  });

  createWindow();
  setupAutoUpdater(() => mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

function getMime(filePath: string): string {
  return mimeFromName(path.basename(filePath));
}

function resolveProtocolFilePath(requestUrl: string, kind: StoredFileKind): string | null {
  const paths = storagePaths();
  const id = fileIdFromProtocolRequest(requestUrl);
  if (id) {
    const row = getDataStore(paths).files.getById(id);
    if (row?.kind === kind) {
      const fp = getDataStore(paths).files.diskPath(row, paths.imagesDir, paths.attachmentsDir);
      if (fs.existsSync(fp)) return fp;
    }
  }
  const name = fileNameFromProtocolRequest(requestUrl);
  const base = kind === 'image' ? IMAGES_DIR() : ATTACHMENTS_DIR();
  const legacy = path.join(base, path.basename(name));
  return fs.existsSync(legacy) ? legacy : null;
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('data:load', () => {
  try {
    return loadData();
  } catch (err) {
    console.error('[Notes] data:load gagal:', err);
    throw err;
  }
});

ipcMain.handle('data:loadNoteContent', (_e, noteId: string) => {
  ensureDirs();
  return loadNoteContent(storagePaths(), noteId);
});

ipcMain.handle('data:loadAllNoteContents', () => {
  ensureDirs();
  return loadAllNoteContents(storagePaths());
});

ipcMain.handle('data:save', (_e, data: AppData) => {
  saveData(data);
  try {
    const removed = purgeUnusedFilesAfterSave(storagePaths(), data);
    if (removed > 0) {
      console.log(`[Notes] ${removed} file tidak terpakai dihapus dari disk`);
    }
  } catch (err) {
    console.error('[Notes] Gagal membersihkan file tidak terpakai:', err);
  }
  return true;
});

ipcMain.handle('image:upload', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
  });
  if (result.canceled || !result.filePaths[0]) return null;

  const src = result.filePaths[0];
  const originalName = originalDisplayName(src);
  const stat = fs.statSync(src);
  return saveImageFile(originalName, stat.size, (dest) => {
    fs.copyFileSync(src, dest);
  });
});

ipcMain.handle('image:copyFromPath', (_e, filePath: string) => {
  ensureDirs();
  if (!filePath || !fs.existsSync(filePath)) return null;
  const originalName = originalDisplayName(filePath);
  const stat = fs.statSync(filePath);
  return saveImageFile(originalName, stat.size, (dest) => {
    fs.copyFileSync(filePath, dest);
  });
});

ipcMain.handle('image:save-buffer', (_e, base64: string, ext: string) => {
  ensureDirs();
  const buffer = Buffer.from(base64.replace(/^data:image\/[^;]+;base64,/, ''), 'base64');
  const safeExt = (ext || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const originalName = `image.${safeExt}`;
  return saveImageFile(originalName, buffer.length, (dest) => {
    fs.writeFileSync(dest, buffer);
  });
});

ipcMain.handle('image:resolve', (_e, url: string) => {
  const full = storedPath(url);
  if (!full) return null;
  const buf = fs.readFileSync(full);
  const mime = getMime(full);
  return `data:${mime};base64,${buf.toString('base64')}`;
});

/** Fallback paste: baca gambar langsung dari clipboard OS (screenshot, Copy Image) */
ipcMain.handle('attachment:pick', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile', 'multiSelections'],
    filters: [ATTACHMENT_FILTER, { name: 'Semua file', extensions: ['*'] }],
  });
  if (result.canceled) return [];
  const metas: AttachmentMeta[] = [];
  for (const fp of result.filePaths) {
    const meta = copyToAttachments(fp);
    if (meta) metas.push(meta);
  }
  return metas;
});

ipcMain.handle('attachment:copyFromPath', (_e, filePath: string) => copyToAttachments(filePath));

ipcMain.handle('attachment:saveBuffer', (_e, base64: string, fileName: string) => {
  ensureDirs();
  const originalName = originalDisplayName(fileName || 'file');
  const buffer = Buffer.from(base64, 'base64');
  const paths = storagePaths();
  const store = getDataStore(paths);
  const row = registerNewStoredFile(store.files, {
    kind: 'attachment',
    originalName,
    mimeType: mimeFromName(originalName),
    fileKind: getFileKind(originalName),
    size: buffer.length,
  });
  const dest = store.files.diskPath(row, paths.imagesDir, paths.attachmentsDir);
  fs.writeFileSync(dest, buffer);
  return {
    fileId: row.id,
    storedUrl: buildStoredFileUrl(row.id),
    fileName: originalName,
    fileKind: getFileKind(originalName),
    mimeType: mimeFromName(originalName),
    size: buffer.length,
  } satisfies AttachmentMeta;
});

ipcMain.handle('file:resolve', (_e, url: string) => {
  const full = storedPath(url);
  if (!full || !fs.existsSync(full)) return null;
  const buf = fs.readFileSync(full);
  return `data:${mimeFromName(path.basename(full))};base64,${buf.toString('base64')}`;
});

ipcMain.handle('file:readText', (_e, storedUrl: string) => {
  const full = storedPath(storedUrl);
  if (!full || !fs.existsSync(full)) return null;
  return fs.readFileSync(full, 'utf-8');
});

ipcMain.handle('file:readBuffer', (_e, storedUrl: string) => {
  const full = storedPath(storedUrl);
  if (!full || !fs.existsSync(full)) return null;
  return fs.readFileSync(full);
});

ipcMain.handle('file:openExternal', (_e, storedUrl: string) => {
  const full = storedPath(storedUrl);
  if (!full || !fs.existsSync(full)) return false;
  void shell.openPath(full);
  return true;
});

ipcMain.handle('file:showInFolder', (_e, storedUrl: string) => {
  const full = storedPath(storedUrl);
  if (!full || !fs.existsSync(full)) return false;
  shell.showItemInFolder(full);
  return true;
});

ipcMain.handle('file:deleteIfUnreferenced', (_e, storedUrl: string) => {
  ensureDirs();
  return purgeStoredFileIfUnreferenced(storagePaths(), storedUrl);
});

ipcMain.handle(
  'file:download',
  async (_e, storedUrl: string, suggestedName: string) => {
    const full = storedPath(storedUrl);
    if (!full || !fs.existsSync(full)) {
      return { ok: false as const, error: 'File tidak ditemukan' };
    }
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: suggestedName || path.basename(full),
    });
    if (result.canceled || !result.filePath) {
      return { ok: false as const, error: 'Dibatalkan' };
    }
    fs.copyFileSync(full, result.filePath);
    return { ok: true as const, path: result.filePath };
  }
);

ipcMain.handle(
  'file:previewOffice',
  async (_e, storedUrl: string, kind: 'word' | 'excel', sheetName?: string) => {
    const full = storedPath(storedUrl);
    if (!full) return null;
    return previewOfficeHtml(full, kind, sheetName);
  }
);

ipcMain.handle('file:listExcelSheets', async (_e, storedUrl: string) => {
  const full = storedPath(storedUrl);
  if (!full) return [];
  return listExcelSheetNames(full);
});

ipcMain.handle(
  'file:previewExcelSheet',
  async (_e, storedUrl: string, sheetName: string) => {
    const full = storedPath(storedUrl);
    if (!full) return null;
    return previewExcelSheetHtml(full, sheetName);
  }
);

ipcMain.handle(
  'note:export',
  async (
    _e,
    payload: { title: string; content: string; plainText: string; format: NoteExportFormat }
  ) => {
    const safeTitle = (payload.title || 'catatan').replace(/[^\w\s-]/g, '').trim() || 'catatan';
    const defaultName = `${safeTitle}.md`;

    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: defaultName,
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'PDF', extensions: ['pdf'] },
        { name: 'HTML', extensions: ['html', 'htm'] },
        { name: 'Teks', extensions: ['txt'] },
      ],
    });
    if (result.canceled || !result.filePath) return { ok: false as const, error: 'Dibatalkan' };

    const savedExt = getExt(path.basename(result.filePath));
    const format: NoteExportFormat =
      savedExt === 'pdf'
        ? 'pdf'
        : savedExt === 'html'
          ? 'html'
          : savedExt === 'md'
            ? 'md'
            : 'txt';

    const title = payload.title || 'Catatan tanpa judul';
    const escapedTitle = title
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const exportContent = inlineStoredUrlsInHtml(payload.content, storedPath);

    if (format === 'pdf') {
      const htmlDoc = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapedTitle}</title>
<style>body{font-family:system-ui,sans-serif;line-height:1.5;padding:24px;max-width:720px;margin:0 auto;color:#111}
h1{font-size:1.5rem;margin-bottom:1rem}img{max-width:100%;height:auto}</style></head>
<body><h1>${escapedTitle}</h1>${exportContent}</body></html>`;
      const pdfWin = new BrowserWindow({
        show: false,
        webPreferences: { offscreen: true, webSecurity: false },
      });
      const tmpHtml = path.join(app.getPath('temp'), `notes-export-${Date.now()}.html`);
      try {
        fs.writeFileSync(tmpHtml, htmlDoc, 'utf-8');
        await pdfWin.loadFile(tmpHtml);
        const pdf = await pdfWin.webContents.printToPDF({ printBackground: true });
        fs.writeFileSync(result.filePath, pdf);
        return { ok: true as const, path: result.filePath };
      } finally {
        pdfWin.destroy();
        try {
          fs.unlinkSync(tmpHtml);
        } catch {
          /* ignore */
        }
      }
    }

    let body: string;
    if (format === 'html') {
      body = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapedTitle}</title></head><body><h1>${escapedTitle}</h1>${exportContent}</body></html>`;
    } else if (format === 'md') {
      const text = payload.plainText.startsWith(`${title}\n\n`)
        ? payload.plainText.slice(title.length + 2)
        : payload.plainText;
      body = `# ${title}\n\n${text}`;
    } else {
      body = payload.plainText;
    }
    fs.writeFileSync(result.filePath, body, 'utf-8');
    return { ok: true as const, path: result.filePath };
  }
);

ipcMain.handle('clipboard:readImage', () => {
  ensureDirs();
  const image = clipboard.readImage();
  if (image.isEmpty()) return null;
  const png = image.toPNG();
  return saveImageFile('clipboard.png', png.length, (dest) => {
    fs.writeFileSync(dest, png);
  });
});

ipcMain.handle('settings:load', () => loadSettings(SETTINGS_FILE()));

ipcMain.handle('settings:save', (_e, settings: AppSettings) => {
  ensureDirs();
  saveSettings(SETTINGS_FILE(), settings);
  if (mainWindow) {
    applyWindowZoom(mainWindow.webContents, settings.uiZoomLevel ?? 0);
  }
  return true;
});

ipcMain.handle('window:get-zoom', () => {
  if (!mainWindow) return 0;
  return mainWindow.webContents.getZoomLevel();
});

ipcMain.handle('window:set-zoom', (_e, level: number) => {
  if (!mainWindow) return 0;
  const next = applyWindowZoom(mainWindow.webContents, level);
  persistZoomLevel(next);
  return next;
});

ipcMain.handle('window:adjust-zoom', (_e, delta: number) => {
  if (!mainWindow) return 0;
  const next = applyWindowZoom(mainWindow.webContents, mainWindow.webContents.getZoomLevel() + delta);
  persistZoomLevel(next);
  return next;
});

ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:toggle-maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
  return mainWindow.isMaximized();
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false);

function dirFileStats(dir: string): { count: number; bytes: number } {
  let count = 0;
  let bytes = 0;
  if (!fs.existsSync(dir)) return { count, bytes };
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isFile()) {
      count++;
      bytes += fs.statSync(p).size;
    }
  }
  return { count, bytes };
}

ipcMain.handle('storage:getInfo', () => {
  const paths = storagePaths();
  const userData = USER_DATA();
  const images = dirFileStats(IMAGES_DIR());
  const attachments = dirFileStats(ATTACHMENTS_DIR());
  const dataBytes = getStorageDataBytes(paths);
  const data = loadData();
  return {
    storageType: 'sqlite' as const,
    dataPath: userData,
    databasePath: SQLITE_FILE(),
    imagesPath: paths.imagesDir,
    attachmentsPath: paths.attachmentsDir,
    notesCount: data.notes.length,
    foldersCount: data.folders.length,
    tagsCount: data.tags.length,
    kanbanCardsCount: data.kanbanCards.length,
    imagesCount: images.count,
    attachmentsCount: attachments.count,
    totalBytes: dataBytes + images.bytes + attachments.bytes,
  };
});

ipcMain.handle('storage:getFileInventory', () => {
  ensureDirs();
  syncFileRefsBeforeInventory();
  return getStoredFileInventory(storagePaths());
});

function syncFileRefsBeforeInventory(): void {
  syncStoredFileRefs(storagePaths());
}

ipcMain.handle('storage:openFolder', (_e, which: 'data' | 'images' | 'attachments') => {
  ensureDirs();
  const target =
    which === 'images'
      ? IMAGES_DIR()
      : which === 'attachments'
        ? ATTACHMENTS_DIR()
        : USER_DATA();
  if (!fs.existsSync(target)) fs.mkdirSync(target, { recursive: true });
  void shell.openPath(target);
  return true;
});

ipcMain.handle(
  'storage:deleteStoredFile',
  (_e, fileId: string, force?: boolean) => {
    ensureDirs();
    syncFileRefsBeforeInventory();
    return removeStoredFileById(storagePaths(), fileId, force);
  }
);

ipcMain.handle('storage:deleteUnusedFiles', () => {
  ensureDirs();
  const deleted = purgeUnusedFilesAfterSave(storagePaths());
  return { ok: true as const, deleted };
});

ipcMain.handle('backup:export', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Pilih folder untuk menyimpan backup',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) {
    return { ok: false as const, error: 'Dibatalkan' };
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const backupDir = path.join(result.filePaths[0], `notes-backup-${stamp}`);

  try {
    fs.mkdirSync(backupDir, { recursive: true });
    if (fs.existsSync(SQLITE_FILE())) {
      fs.copyFileSync(SQLITE_FILE(), path.join(backupDir, BACKUP_DB));
    }
    saveSettings(path.join(backupDir, 'settings.json'), loadSettings(SETTINGS_FILE()));
    fs.writeFileSync(
      path.join(backupDir, 'manifest.json'),
      JSON.stringify(createManifest(), null, 2)
    );
    if (fs.existsSync(IMAGES_DIR())) {
      copyDirRecursive(IMAGES_DIR(), path.join(backupDir, 'images'));
    }
    if (fs.existsSync(ATTACHMENTS_DIR())) {
      copyDirRecursive(ATTACHMENTS_DIR(), path.join(backupDir, 'attachments'));
    }
    return { ok: true as const, path: backupDir };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Gagal export',
    };
  }
});

ipcMain.handle('backup:restore', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    title: 'Pilih folder backup (berisi notes.db)',
    properties: ['openDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) {
    return { ok: false as const, error: 'Dibatalkan' };
  }

  const sourceDir = result.filePaths[0];
  if (!isValidBackupDir(sourceDir)) {
    return {
      ok: false as const,
      error: 'Folder bukan backup valid (tidak ada notes.db)',
    };
  }

  try {
    ensureDirs();
    const safetyDir = path.join(
      USER_DATA(),
      'pre-restore-backup',
      new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    );
    fs.mkdirSync(safetyDir, { recursive: true });
    if (fs.existsSync(SQLITE_FILE())) {
      fs.copyFileSync(SQLITE_FILE(), path.join(safetyDir, BACKUP_DB));
    }
    if (fs.existsSync(SETTINGS_FILE())) {
      fs.copyFileSync(SETTINGS_FILE(), path.join(safetyDir, 'settings.json'));
    }
    if (fs.existsSync(IMAGES_DIR())) {
      copyDirRecursive(IMAGES_DIR(), path.join(safetyDir, 'images'));
    }
    if (fs.existsSync(ATTACHMENTS_DIR())) {
      copyDirRecursive(ATTACHMENTS_DIR(), path.join(safetyDir, 'attachments'));
    }

    resetDataStore();
    const dbBackup = getBackupDbPath(sourceDir);
    const legacyJson = getLegacyJsonBackupPath(sourceDir);
    if (dbBackup) {
      replaceSqliteDatabase(SQLITE_FILE(), dbBackup);
    } else if (legacyJson) {
      importLegacyJsonBackup(legacyJson, storagePaths());
    }
    const backupSettings = path.join(sourceDir, 'settings.json');
    if (fs.existsSync(backupSettings)) {
      fs.copyFileSync(backupSettings, SETTINGS_FILE());
    }
    const backupImages = path.join(sourceDir, 'images');
    fs.mkdirSync(IMAGES_DIR(), { recursive: true });
    clearDirContents(IMAGES_DIR());
    if (fs.existsSync(backupImages)) {
      copyDirRecursive(backupImages, IMAGES_DIR());
    }
    const backupAttachments = path.join(sourceDir, 'attachments');
    fs.mkdirSync(ATTACHMENTS_DIR(), { recursive: true });
    clearDirContents(ATTACHMENTS_DIR());
    if (fs.existsSync(backupAttachments)) {
      copyDirRecursive(backupAttachments, ATTACHMENTS_DIR());
    }

    return { ok: true as const, safetyPath: safetyDir };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : 'Gagal restore',
    };
  }
});
