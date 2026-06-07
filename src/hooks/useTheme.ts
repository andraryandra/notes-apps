import { useState, useEffect, useCallback } from 'react';
import type { AppTheme } from '../types';

export function useTheme() {
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    window.electronAPI?.getSettings().then((s) => {
      setThemeState(s.theme);
      document.documentElement.setAttribute('data-theme', s.theme);
      setReady(true);
    });
  }, []);

  const setTheme = useCallback(async (next: AppTheme) => {
    setThemeState(next);
    document.documentElement.setAttribute('data-theme', next);
    const current = await window.electronAPI?.getSettings();
    if (current) {
      await window.electronAPI?.saveSettings({ ...current, theme: next });
    }
  }, []);

  return { theme, setTheme, ready };
}
