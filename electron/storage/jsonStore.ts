import fs from 'fs';
import type { AppData } from '../../src/types';
import { normalizeAppData } from '../normalizeData';

/** Baca backup/migrasi dari notes-data.json lama */
export function readLegacyJsonFile(jsonFile: string): AppData | null {
  if (!fs.existsSync(jsonFile)) return null;
  try {
    return normalizeAppData(JSON.parse(fs.readFileSync(jsonFile, 'utf-8')));
  } catch {
    return null;
  }
}
