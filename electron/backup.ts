import fs from 'fs';
import path from 'path';

const BACKUP_DB = 'notes.db';
const LEGACY_JSON = 'notes-data.json';

export interface BackupManifest {
  version: 2;
  app: 'notes-app';
  storage: 'sqlite';
  exportedAt: number;
}

export function createManifest(): BackupManifest {
  return {
    version: 2,
    app: 'notes-app',
    storage: 'sqlite',
    exportedAt: Date.now(),
  };
}

export function isValidBackupDir(dir: string): boolean {
  const db = path.join(dir, BACKUP_DB);
  const legacy = path.join(dir, LEGACY_JSON);
  return fs.existsSync(db) || fs.existsSync(legacy);
}

export function getBackupDbPath(dir: string): string | null {
  const db = path.join(dir, BACKUP_DB);
  if (fs.existsSync(db)) return db;
  return null;
}

export function getLegacyJsonBackupPath(dir: string): string | null {
  const legacy = path.join(dir, LEGACY_JSON);
  if (fs.existsSync(legacy)) return legacy;
  return null;
}

export function copyDirRecursive(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function clearDirContents(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    fs.rmSync(p, { recursive: true, force: true });
  }
}

export { BACKUP_DB, LEGACY_JSON };
