import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

type GetMainWindow = () => BrowserWindow | null;

function send(getWindow: GetMainWindow, channel: string, payload: unknown) {
  getWindow()?.webContents.send(channel, payload);
}

export function setupAutoUpdater(getWindow: GetMainWindow) {
  if (!app.isPackaged) {
    ipcMain.handle('updater:check', () => ({ status: 'dev' as const }));
    ipcMain.handle('updater:download', () => false);
    ipcMain.handle('updater:install', () => {});
    ipcMain.handle('app:getVersion', () => app.getVersion());
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (err) => {
    console.error('[Notes Updater]', err);
    send(getWindow, 'updater:error', { message: err.message });
  });

  autoUpdater.on('update-available', (info) => {
    send(getWindow, 'updater:available', { version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    send(getWindow, 'updater:not-available', {});
  });

  autoUpdater.on('download-progress', (progress) => {
    send(getWindow, 'updater:progress', { percent: progress.percent });
  });

  autoUpdater.on('update-downloaded', (info) => {
    send(getWindow, 'updater:downloaded', { version: info.version });
  });

  ipcMain.handle('app:getVersion', () => app.getVersion());

  ipcMain.handle('updater:check', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      const latest = result?.updateInfo?.version;
      const current = app.getVersion();
      if (!latest || latest === current) {
        return { status: 'not-available' as const, currentVersion: current };
      }
      return { status: 'available' as const, currentVersion: current, version: latest };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { status: 'error' as const, message };
    }
  });

  ipcMain.handle('updater:download', async () => {
    await autoUpdater.downloadUpdate();
    return true;
  });

  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall();
  });

  setTimeout(() => {
    void autoUpdater.checkForUpdates().catch((err) => {
      console.warn('[Notes Updater] Startup check gagal:', err);
    });
  }, 8000);
}
