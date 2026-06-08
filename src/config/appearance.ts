/** Daftar tema & layout — satu sumber untuk UI dan validasi */

import {
  DEFAULT_SCROLL_BATCH_SIZE,
  type ScrollBatchSize,
} from './storage';
import { detectSystemTimeZone, isValidTimeZone } from './timezones';

export type { ScrollBatchSize } from './storage';
export {
  SCROLL_BATCH_SIZES,
  DEFAULT_SCROLL_BATCH_SIZE,
  SQLITE_DB_NAME,
} from './storage';

export const APP_THEMES = [
  'dark',
  'light',
  'indigo',
  'slate',
  'midnight',
  'nord',
  'ocean',
  'forest',
  'rose',
  'sunset',
  'lavender',
  'mint',
  'paper',
  'graphite',
] as const;

export type AppTheme = (typeof APP_THEMES)[number];

export const APP_LAYOUTS = ['standard', 'focus', 'wide', 'compact'] as const;

export type AppLayoutMode = (typeof APP_LAYOUTS)[number];

export const APP_LOCALES = ['id', 'en'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export interface AppSettings {
  theme: AppTheme;
  layout: AppLayoutMode;
  /** Ukuran batch infinite scroll */
  scrollBatchSize: ScrollBatchSize;
  /** Bahasa antarmuka */
  locale: AppLocale;
  /** Zona waktu IANA untuk tampilan tanggal (data disimpan UTC / Unix ms) */
  timeZone: string;
  /** Level zoom Electron (0 = 100%, negatif = lebih kecil) */
  uiZoomLevel: number;
}

export const MIN_UI_ZOOM_LEVEL = -5;
export const MAX_UI_ZOOM_LEVEL = 5;
export const DEFAULT_UI_ZOOM_LEVEL = 0;

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'dark',
  layout: 'standard',
  scrollBatchSize: DEFAULT_SCROLL_BATCH_SIZE,
  locale: 'id',
  timeZone: detectSystemTimeZone(),
  uiZoomLevel: DEFAULT_UI_ZOOM_LEVEL,
};

export function isAppTheme(value: unknown): value is AppTheme {
  return typeof value === 'string' && (APP_THEMES as readonly string[]).includes(value);
}

export function isAppLayout(value: unknown): value is AppLayoutMode {
  return typeof value === 'string' && (APP_LAYOUTS as readonly string[]).includes(value);
}

export function isAppLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && (APP_LOCALES as readonly string[]).includes(value);
}

export function isAppTimeZone(value: unknown): value is string {
  return isValidTimeZone(value);
}

export function clampUiZoomLevel(value: number): number {
  return Math.max(MIN_UI_ZOOM_LEVEL, Math.min(MAX_UI_ZOOM_LEVEL, value));
}

export function isUiZoomLevel(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function uiZoomPercent(level: number): number {
  return Math.round(Math.pow(1.2, clampUiZoomLevel(level)) * 100);
}

export const THEME_OPTIONS: {
  id: AppTheme;
  label: string;
  desc: string;
  preview: { bg: string; surface: string; accent: string };
}[] = [
  { id: 'dark', label: 'Dark', desc: 'Ungu gelap klasik', preview: { bg: '#0a0a0d', surface: '#12121a', accent: '#8b5cf6' } },
  { id: 'light', label: 'Light', desc: 'Terang bersih', preview: { bg: '#f4f4f5', surface: '#ffffff', accent: '#6366f1' } },
  { id: 'indigo', label: 'Indigo', desc: 'Biru ungu dalam', preview: { bg: '#0f0e1a', surface: '#16142a', accent: '#6366f1' } },
  { id: 'slate', label: 'Slate', desc: 'Abu modern netral', preview: { bg: '#0f172a', surface: '#1e293b', accent: '#38bdf8' } },
  { id: 'midnight', label: 'Midnight', desc: 'Hitam OLED', preview: { bg: '#000000', surface: '#0a0a0a', accent: '#60a5fa' } },
  { id: 'nord', label: 'Nord', desc: 'Arctic cool', preview: { bg: '#2e3440', surface: '#3b4252', accent: '#88c0d0' } },
  { id: 'ocean', label: 'Ocean', desc: 'Biru laut dalam', preview: { bg: '#0c1222', surface: '#111b2e', accent: '#22d3ee' } },
  { id: 'forest', label: 'Forest', desc: 'Hijau alami', preview: { bg: '#0c1410', surface: '#142018', accent: '#34d399' } },
  { id: 'rose', label: 'Rose', desc: 'Pink modern', preview: { bg: '#140c12', surface: '#1f1218', accent: '#fb7185' } },
  { id: 'sunset', label: 'Sunset', desc: 'Hangat oranye', preview: { bg: '#1a100c', surface: '#261812', accent: '#fb923c' } },
  { id: 'lavender', label: 'Lavender', desc: 'Ungu lembut terang', preview: { bg: '#f5f3ff', surface: '#ffffff', accent: '#a78bfa' } },
  { id: 'mint', label: 'Mint', desc: 'Hijau mint segar', preview: { bg: '#f0fdf9', surface: '#ffffff', accent: '#14b8a6' } },
  { id: 'paper', label: 'Paper', desc: 'Krem seperti kertas', preview: { bg: '#f7f3eb', surface: '#fffdf8', accent: '#d97706' } },
  { id: 'graphite', label: 'Graphite', desc: 'Abu terang minimal', preview: { bg: '#ececef', surface: '#f8f8fa', accent: '#18181b' } },
];

export const LAYOUT_OPTIONS: {
  id: AppLayoutMode;
  label: string;
  desc: string;
}[] = [
  { id: 'standard', label: 'Standar', desc: 'Sidebar, daftar catatan, dan editor' },
  { id: 'focus', label: 'Fokus', desc: 'Editor lebar; daftar bisa dibuka sementara' },
  { id: 'wide', label: 'Lebar', desc: 'Panel samping lebih sempit, editor lebih luas' },
  { id: 'compact', label: 'Kompak', desc: 'Jarak dan panel lebih rapat' },
];
