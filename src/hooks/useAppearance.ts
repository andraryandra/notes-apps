import { useState, useEffect, useCallback } from 'react';
import type { AppLayoutMode, AppLocale, AppSettings, AppTheme, SidebarMode } from '../config/appearance';
import { DEFAULT_APP_SETTINGS, clampUiZoomLevel } from '../config/appearance';
import type { ScrollBatchSize } from '../config/storage';
import { animateSidebarWidth, animateThemeChange } from '../utils/motion';

function applyAppearance(theme: AppTheme, layout: AppLayoutMode, locale: AppLocale, sidebarMode: SidebarMode) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('data-layout', layout);
  document.documentElement.setAttribute('data-sidebar-mode', sidebarMode);
  document.documentElement.lang = locale === 'id' ? 'id' : 'en';
}

export function useAppearance() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    window.electronAPI?.getSettings().then((s) => {
      setSettings(s);
      applyAppearance(s.theme, s.layout, s.locale, s.sidebarMode);
      setReady(true);
    });
  }, []);

  const persist = useCallback(async (next: AppSettings) => {
    setSettings(next);
    applyAppearance(next.theme, next.layout, next.locale, next.sidebarMode);
    await window.electronAPI?.saveSettings(next);
  }, []);

  const setTheme = useCallback(async (theme: AppTheme) => {
    setSettings((prev) => {
      if (prev.theme === theme) return prev;
      const next = { ...prev, theme };
      void animateThemeChange(() => {
        applyAppearance(next.theme, next.layout, next.locale, next.sidebarMode);
      }).then(() => {
        void window.electronAPI?.saveSettings(next);
      });
      return next;
    });
  }, []);

  const setLayout = useCallback(async (layout: AppLayoutMode) => {
    setSettings((prev) => {
      const next = { ...prev, layout };
      applyAppearance(next.theme, next.layout, next.locale, next.sidebarMode);
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
      applyAppearance(next.theme, next.layout, next.locale, next.sidebarMode);
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

  const setSidebarMode = useCallback(async (sidebarMode: SidebarMode) => {
    setSettings((prev) => {
      if (prev.sidebarMode === sidebarMode) return prev;

      const root = document.documentElement;
      const current =
        parseFloat(getComputedStyle(root).getPropertyValue('--sidebar-width')) || 260;
      root.style.setProperty('--sidebar-width', `${current}px`);

      const next = { ...prev, sidebarMode };
      applyAppearance(next.theme, next.layout, next.locale, next.sidebarMode);
      void animateSidebarWidth(next.layout, sidebarMode);
      void window.electronAPI?.saveSettings(next);
      return next;
    });
  }, []);

  const setScheduleRemindersEnabled = useCallback(async (scheduleRemindersEnabled: boolean) => {
    setSettings((prev) => {
      const next = { ...prev, scheduleRemindersEnabled };
      void window.electronAPI?.saveSettings(next);
      return next;
    });
  }, []);

  const patchSettings = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void window.electronAPI?.saveSettings(next);
      return next;
    });
  }, []);

  return {
    theme: settings.theme,
    layout: settings.layout,
    scrollBatchSize: settings.scrollBatchSize,
    locale: settings.locale,
    timeZone: settings.timeZone,
    uiZoomLevel: settings.uiZoomLevel,
    sidebarMode: settings.sidebarMode,
    scheduleRemindersEnabled: settings.scheduleRemindersEnabled,
    reminderFired: settings.reminderFired,
    setTheme,
    setLayout,
    setScrollBatchSize,
    setLocale,
    setTimeZone,
    setUiZoomLevel,
    adjustUiZoomLevel,
    setSidebarMode,
    setScheduleRemindersEnabled,
    patchSettings,
    setSettings: persist,
    ready,
  };
}
