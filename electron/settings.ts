import fs from 'fs';
import {
  DEFAULT_APP_SETTINGS,
  clampUiZoomLevel,
  isAppLayout,
  isAppLocale,
  isAppTheme,
  isAppTimeZone,
  isUiZoomLevel,
  type AppSettings,
} from '../src/config/appearance';
import { DEFAULT_SCROLL_BATCH_SIZE, isScrollBatchSize } from '../src/config/storage';

export type { AppSettings, AppTheme, AppLayoutMode } from '../src/config/appearance';
export type { ScrollBatchSize } from '../src/config/storage';

export function loadSettings(settingsPath: string): AppSettings {
  if (!fs.existsSync(settingsPath)) {
    return { ...DEFAULT_APP_SETTINGS };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf-8')) as Partial<AppSettings> & {
      listPageSize?: number;
      storageBackend?: string;
    };
    const scrollBatchSize = isScrollBatchSize(raw.scrollBatchSize)
      ? raw.scrollBatchSize
      : isScrollBatchSize(raw.listPageSize)
        ? raw.listPageSize
        : DEFAULT_APP_SETTINGS.scrollBatchSize;
    return {
      theme: isAppTheme(raw.theme) ? raw.theme : DEFAULT_APP_SETTINGS.theme,
      layout: isAppLayout(raw.layout) ? raw.layout : DEFAULT_APP_SETTINGS.layout,
      scrollBatchSize,
      locale: isAppLocale(raw.locale) ? raw.locale : DEFAULT_APP_SETTINGS.locale,
      timeZone: isAppTimeZone(raw.timeZone) ? raw.timeZone : DEFAULT_APP_SETTINGS.timeZone,
      uiZoomLevel: isUiZoomLevel(raw.uiZoomLevel)
        ? clampUiZoomLevel(raw.uiZoomLevel)
        : DEFAULT_APP_SETTINGS.uiZoomLevel,
    };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_APP_SETTINGS };
}

export function saveSettings(settingsPath: string, settings: AppSettings) {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}
