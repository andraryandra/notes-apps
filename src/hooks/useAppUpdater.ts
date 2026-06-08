import { useEffect, useRef, useCallback } from 'react';
import type { UpdaterCheckResult } from '../types';
import type { useConfirm } from './useConfirm';
import type { useToast } from './useToast';
import type { useI18n } from '../i18n/useI18n';

type ConfirmFn = ReturnType<typeof useConfirm>['confirm'];
type ShowSuccessFn = ReturnType<typeof useToast>['showSuccess'];
type TFn = ReturnType<typeof useI18n>['t'];

async function promptDownloadUpdate(confirm: ConfirmFn, t: TFn, version: string) {
  const ok = await confirm({
    title: t('updater.availableTitle'),
    message: t('updater.availableMessage', { version }),
    confirmLabel: t('updater.download'),
  });
  if (ok && window.electronAPI) {
    await window.electronAPI.downloadUpdate();
  }
}

async function promptInstallUpdate(confirm: ConfirmFn, t: TFn, version: string) {
  const ok = await confirm({
    title: t('updater.readyTitle'),
    message: t('updater.readyMessage', { version }),
    confirmLabel: t('updater.restart'),
  });
  if (ok) {
    await window.electronAPI?.installUpdate();
  }
}

export function useAppUpdater({
  confirm,
  showSuccess,
  t,
}: {
  confirm: ConfirmFn;
  showSuccess: ShowSuccessFn;
  t: TFn;
}) {
  const manualCheckRef = useRef(false);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api?.onUpdaterEvent) return;

    const unsubs = [
      api.onUpdaterEvent('updater:available', (payload) => {
        if (manualCheckRef.current) return;
        const version = String(payload.version ?? '');
        if (!version) return;
        void promptDownloadUpdate(confirm, t, version);
      }),
      api.onUpdaterEvent('updater:downloaded', (payload) => {
        const version = String(payload.version ?? '');
        void promptInstallUpdate(confirm, t, version || '?');
      }),
      api.onUpdaterEvent('updater:not-available', () => {
        if (manualCheckRef.current) {
          manualCheckRef.current = false;
          showSuccess(t('updater.upToDate'));
        }
      }),
      api.onUpdaterEvent('updater:error', (payload) => {
        if (manualCheckRef.current) {
          manualCheckRef.current = false;
          showSuccess(t('updater.checkFailed'));
        }
        console.warn('[Updater]', payload.message);
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [confirm, showSuccess, t]);

  const checkForUpdates = useCallback(async (): Promise<UpdaterCheckResult | null> => {
    const api = window.electronAPI;
    if (!api?.checkForUpdates) return null;

    manualCheckRef.current = true;
    const result = await api.checkForUpdates();
    manualCheckRef.current = false;

    if (result.status === 'dev') {
      showSuccess(t('updater.devMode'));
      return result;
    }
    if (result.status === 'error') {
      showSuccess(t('updater.checkFailed'));
      return result;
    }
    if (result.status === 'not-available') {
      showSuccess(t('updater.upToDate'));
      return result;
    }
    if (result.status === 'available') {
      await promptDownloadUpdate(confirm, t, result.version);
    }
    return result;
  }, [confirm, showSuccess, t]);

  return { checkForUpdates };
}
