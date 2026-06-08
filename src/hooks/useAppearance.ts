import { useState, useEffect, useCallback } from 'react';
import type { AppLayoutMode, AppLocale, AppSettings, AppTheme } from '../config/appearance';
import { DEFAULT_APP_SETTINGS, clampUiZoomLevel } from '../config/appearance';
import type { ScrollBatchSize } from '../config/storage';

function applyAppearance(theme: AppTheme, layout: AppLayoutMode, locale: AppLocale) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-layout', layout);
  document.documentElement.lang = locale === 'id' ? 'id' : 'en';
}

export function useAppearance() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    window.electronAPI?.getSettings().then((s) => {
      setSettings(s);
      applyAppearance(s.theme, s.layout, s.locale);
      setReady(true);
    });
  }, []);

  const persist = useCallback(async (next: AppSettings) => {
    setSettings(next);
    applyAppearance(next.theme, next.layout, next.locale);
    await window.electronAPI?.saveSettings(next);
  }, []);

  const setTheme = useCallback(async (theme: AppTheme) => {
    setSettings((prev) => {
      const next = { ...prev, theme };
      applyAppearance(next.theme, next.layout, next.locale);
      void window.electronAPI?.saveSettings(next);
      return next;
    });
  }, []);

  const setLayout = useCallback(async (layout: AppLayoutMode) => {
    setSettings((prev) => {
      const next = { ...prev, layout };
      applyAppearance(next.theme, next.layout, next.locale);
      void window.electronAPI?.saveSettings(next);
      return next;
    });
  }, []);

  const setScrollBatchSize = useCallback(async (scrollBatchSize: ScrollBatchSize) => {
    setSettings((prev) => {
      const next = { ...prev, scrollBatchSize };
      void window.electronAPI?.saveSettings(next);
      return next;
    });
  }, []);

  const setLocale = useCallback(async (locale: AppLocale) => {
    setSettings((prev) => {
      const next = { ...prev, locale };
      applyAppearance(next.theme, next.layout, next.locale);
      void window.electronAPI?.saveSettings(next);
      return next;
    });
  }, []);

  const setTimeZone = useCallback(async (timeZone: string) => {
    setSettings((prev) => {
      const next = { ...prev, timeZone };
      void window.electronAPI?.saveSettings(next);
      return next;
    });
  }, []);

  const setUiZoomLevel = useCallback(async (uiZoomLevel: number) => {
    const clamped = clampUiZoomLevel(uiZoomLevel);
    const level = (await window.electronAPI?.setUiZoomLevel(clamped)) ?? clamped;
    setSettings((prev) => {
      const next = { ...prev, uiZoomLevel: level };
      void window.electronAPI?.saveSettings(next);
      return next;
    });
  }, []);

  const adjustUiZoomLevel = useCallback(async (delta: number) => {
    const level = (await window.electronAPI?.adjustUiZoomLevel(delta)) ?? settings.uiZoomLevel;
    setSettings((prev) => {
      const next = { ...prev, uiZoomLevel: level };
      void window.electronAPI?.saveSettings(next);
      return next;
    });
  }, [settings.uiZoomLevel]);

  return {
    theme: settings.theme,
    layout: settings.layout,
    scrollBatchSize: settings.scrollBatchSize,
    locale: settings.locale,
    timeZone: settings.timeZone,
    uiZoomLevel: settings.uiZoomLevel,
    setTheme,
    setLayout,
    setScrollBatchSize,
    setLocale,
    setTimeZone,
    setUiZoomLevel,
    adjustUiZoomLevel,
    setSettings: persist,
    ready,
  };
}
